import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * ai-orchestrator (Supabase Edge Function)
 *
 * What it guarantees:
 * - Identifies the end-user from Authorization: Bearer <user_jwt>
 * - Runs a short multi-provider debate (default 3 rounds)
 * - Writes turns to public.debate_turns (best-effort)
 * - Writes a FINAL agreement to public.debates.summary (best-effort)
 * - Token accounting:
 *   - If the caller already reserved tokens (recommended): pass { tokens, alreadyReserved:true }
 *     -> We ONLY write token_ledger on success (no double deduction).
 *   - If not reserved: we reserve via rpc('reserve_tokens') and refund on failure.
 */

type OrchestratorRequest = {
  debateId: string;
  prompt: string;
  requestType?: "text" | "latex" | "image" | "video" | "file";
  systemMessage?: string;
  rounds?: number; // 1..3
  tokens?: number; // token cost in cents (same unit as token_balance_cents)
  alreadyReserved?: boolean;
  participants?: string[];
};

type ProviderRow = {
  id: string;
  name: string;
  kind: string; // text/image/video/etc
  enabled: boolean;
  env_key: string | null;
  base_url: string | null;
  model_id: string;
  config: any;
  priority: number;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function jsonSafeParse(s: unknown) {
  if (!s) return {};
  if (typeof s === "object") return s;
  try {
    return JSON.parse(String(s));
  } catch {
    return {};
  }
}

function normalizeProviderRow(raw: any): ProviderRow {
  const cfg = jsonSafeParse(raw?.config);
  const enabled = Boolean(raw?.enabled ?? raw?.is_active ?? true);
  const kind = String(raw?.kind ?? raw?.category ?? cfg?.capabilities?.primary ?? "text");
  const model_id = String(raw?.model_id ?? cfg?.model_id ?? cfg?.model ?? "").trim();
  const base_url = raw?.base_url ?? cfg?.base_url ?? null;
  const env_key = raw?.env_key ?? cfg?.env_key ?? null;
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? raw?.provider ?? cfg?.name ?? "provider"),
    kind,
    enabled,
    env_key,
    base_url,
    model_id,
    config: cfg,
    priority: Number(raw?.priority ?? cfg?.priority ?? 0),
  };
}

function providerStyle(p: ProviderRow): "openai_compatible" | "anthropic" | "gemini" | "cohere" {
  const style = String(p.config?.style || "").toLowerCase();
  if (style === "anthropic") return "anthropic";
  if (style === "gemini") return "gemini";
  if (style === "cohere") return "cohere";
  // Heuristics by name
  const n = p.name.toLowerCase();
  if (n.includes("anthropic") || n.includes("claude")) return "anthropic";
  if (n.includes("gemini") || n.includes("google")) return "gemini";
  if (n.includes("cohere")) return "cohere";
  return "openai_compatible";
}

async function callOpenAICompatible(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
}) {
  const url = opts.baseUrl.replace(/\/$/, "") + "/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: 0.4,
    }),
  });
  const data = await res.json().catch(() => ({}));
  const text = data?.choices?.[0]?.message?.content;
  if (!res.ok || !text) {
    throw new Error(
      `OpenAI-compatible error (${res.status}): ${data?.error?.message || "No text"}`,
    );
  }
  return String(text);
}

async function callAnthropic(opts: { apiKey: string; model: string; system: string; user: string }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 900,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  const text = data?.content?.[0]?.text;
  if (!res.ok || !text) {
    throw new Error(`Anthropic error (${res.status}): ${data?.error?.message || "No text"}`);
  }
  return String(text);
}

async function callGemini(opts: { apiKey: string; model: string; user: string }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${opts.apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: opts.user }] }] }),
    },
  );
  const data = await res.json().catch(() => ({}));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!res.ok || !text) {
    throw new Error(`Gemini error (${res.status}): ${data?.error?.message || "No text"}`);
  }
  return String(text);
}

async function callCohere(opts: { apiKey: string; model: string; system: string; user: string }) {
  const res = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      preamble: opts.system,
      message: opts.user,
      temperature: 0.4,
    }),
  });
  const data = await res.json().catch(() => ({}));
  const text = data?.text;
  if (!res.ok || !text) {
    throw new Error(`Cohere error (${res.status}): ${data?.message || "No text"}`);
  }
  return String(text);
}

async function callTextProvider(provider: ProviderRow, prompt: string, system: string) {
  if (!provider.env_key) throw new Error(`Provider ${provider.name} missing env_key`);
  const apiKey = Deno.env.get(provider.env_key);
  if (!apiKey) throw new Error(`Missing Edge secret: ${provider.env_key}`);

  const style = providerStyle(provider);
  if (style === "anthropic") {
    return await callAnthropic({ apiKey, model: provider.model_id, system, user: prompt });
  }
  if (style === "gemini") {
    return await callGemini({ apiKey, model: provider.model_id, user: `${system}\n\n${prompt}` });
  }
  if (style === "cohere") {
    return await callCohere({ apiKey, model: provider.model_id, system, user: prompt });
  }

  // openai-compatible
  const baseUrl = provider.base_url || "https://api.openai.com";
  return await callOpenAICompatible({ baseUrl, apiKey, model: provider.model_id, system, user: prompt });
}

async function bestEffortInsertTurn(
  admin: any,
  turn: { debate_id: string; role: string; content: string; round_index: number; provider?: string; model?: string },
) {
  try {
    await admin.from("debate_turns").insert(turn);
  } catch {
    // ignore (table may not exist)
  }
}

async function bestEffortUpdateSummary(admin: any, debateId: string, summary: string) {
  try {
    await admin.from("debates").update({ summary }).eq("id", debateId);
  } catch {
    // ignore
  }
}

async function writeLedgerOnSuccess(admin: any, userId: string, debateId: string, tokens: number, reason: string) {
  try {
    await admin.from("token_ledger").insert({
      user_id: userId,
      change_cents: -Math.abs(tokens),
      reason,
      reference_id: debateId,
    });
  } catch {
    // ignore (should exist, but never hard-fail the response)
  }
}


function isLongFormVideo(requestType: string | undefined, prompt: string): boolean {
  if ((requestType || "").toLowerCase() !== "video") return false;
  const p = (prompt || "").toLowerCase();
  return (
    p.includes("فيلم") ||
    p.includes("مسلسل") ||
    p.includes("برنامج") ||
    p.includes("حلقة") ||
    p.includes("season") ||
    p.includes("episode") ||
    p.includes("series") ||
    p.includes("film") ||
    p.includes("long video") ||
    p.includes("feature film") ||
    p.includes("tv show")
  );
}

function extractJsonOnly(text: string): string {
  // Best-effort: pick first {...} block
  const m = text.match(/\{[\s\S]*\}/);
  return m ? m[0] : text.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, error: "Missing Supabase env (URL/ANON/SERVICE_ROLE)" }, 500);
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";
  if (!jwt) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify user
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }
  const user = userData.user;

  let body: OrchestratorRequest;
  try {
    body = (await req.json()) as OrchestratorRequest;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const debateId = String(body?.debateId || "").trim();
  const prompt = String(body?.prompt || "").trim();
  const rounds = clamp(Number(body?.rounds ?? 3), 1, 3);
  const requestType = (body?.requestType ?? "text") as OrchestratorRequest["requestType"];
  const systemMessage = String(body?.systemMessage || "").trim();
  const tokens = Number(body?.tokens ?? 0);
  const alreadyReserved = Boolean(body?.alreadyReserved ?? false);

  if (!debateId || !prompt) {
    return json({ ok: false, error: "Missing debateId or prompt" }, 400);
  }

  // Ensure debate belongs to user (best-effort). If table not found, skip.
  try {
    const { data: debRow } = await admin
      .from("debates")
      .select("id,user_id")
      .eq("id", debateId)
      .maybeSingle();
    if (debRow && (debRow as any).user_id && (debRow as any).user_id !== user.id) {
      return json({ ok: false, error: "Forbidden" }, 403);
    }
  } catch {
    // ignore
  }

  // If caller didn't reserve tokens, reserve here (and refund on failure)
  let reservedHere = false;
  const effectiveTokens = Number.isFinite(tokens) && tokens > 0 ? Math.floor(tokens) : 0;
  if (!alreadyReserved && effectiveTokens > 0) {
    const { error } = await admin.rpc("reserve_tokens", { p_user_id: user.id, p_tokens: effectiveTokens });
    if (error) {
      const msg = String((error as any)?.message || "INSUFFICIENT_TOKENS");
      if (msg.includes("INSUFFICIENT")) {
        return json({ ok: false, error: "Insufficient tokens" }, 402);
      }
      return json({ ok: false, error: msg }, 500);
    }
    reservedHere = true;
  }

  try {
    // Load active text providers
    let rows: any[] = [];
    try {
      const { data } = await admin.from("ai_providers").select("*").limit(50);
      rows = (data as any[]) || [];
    } catch {
      rows = [];
    }

    const providers = rows
      .map(normalizeProviderRow)
      .filter((p) => p.enabled && String(p.kind).toLowerCase().includes("text"))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, 6);

    // Choose up to 3 participants by default
    const wanted = (body?.participants || []).map((s) => String(s).toLowerCase());
    const participants = (wanted.length
      ? providers.filter((p) => wanted.includes(p.name.toLowerCase()))
      : providers
    ).slice(0, 3);

    if (participants.length === 0) {
      throw new Error("No active text providers configured in ai_providers");
    }

    const leader =
      participants.find((p) => p.name.toLowerCase().includes("openai")) || participants[0];

    const baseSystem =
      systemMessage ||
      [
        "أنت جزء من نقاش بين عدة نماذج ذكاء اصطناعي.",
        "كل نموذج يجب أن يذكر اسم نموذج آخر ويرد على نقاط الاتفاق والاختلاف.",
        "إذا كان هناك رياضيات استخدم LaTeX: inline $...$ و block $$...$$.",
        "في النهاية سيقوم القائد بتجميع (الاتفاق) تحت عنوان: الاتفاق",
      ].join("\n");

    // Store the user prompt turn (best-effort)
    await bestEffortInsertTurn(admin, {
      debate_id: debateId,
      role: "user",
      content: prompt,
      round_index: 0,
      provider: "user",
      model: "user",
    });

    const transcript: { speaker: string; content: string }[] = [{ speaker: "user", content: prompt }];

    // Debate rounds
    for (let r = 1; r <= rounds; r++) {
      for (const p of participants) {
        const others = participants
          .filter((x) => x.id !== p.id)
          .map((x) => x.name)
          .join(", ");
        const ctx = transcript
          .slice(-10)
          .map((t) => `${t.speaker}: ${t.content}`)
          .join("\n\n");

        const userPrompt =
          `السؤال الأساسي: ${prompt}\n\n` +
          `السياق السابق (مختصر):\n${ctx}\n\n` +
          `دورك: أجب، ثم علّق على ما قاله الآخرون (${others}) من حيث الاتفاق والاختلاف، واذكرهم بالاسم.`;

        const answer = await callTextProvider(p, userPrompt, baseSystem);
        transcript.push({ speaker: p.name, content: answer });

        await bestEffortInsertTurn(admin, {
          debate_id: debateId,
          role: "assistant",
          content: answer,
          round_index: r,
          provider: p.name,
          model: p.model_id || "",
        });
      }
    }

    // Final synthesis by leader
    const finalCtx = transcript
      .slice(-30)
      .map((t) => `${t.speaker}: ${t.content}`)
      .join("\n\n");

    const finalPrompt =
      `اجمع خلاصة ما اتفق عليه المشاركون حول السؤال التالي:\n${prompt}\n\n` +
      `النقاش (مختصر):\n${finalCtx}\n\n` +
      `أخرج النتيجة النهائية تحت عنوان واضح: الاتفاق\n` +
      `ثم نقاط مختصرة تلخص القرار/الخطة. لا تكرر النقاش بالكامل.`;

    const finalAgreementBase = await callTextProvider(leader, finalPrompt, baseSystem);

    // For long-form video (film/series), also generate a canonical bible (characters/locations/style) to keep consistency.
    let canonBlock = "";
    if (isLongFormVideo(requestType, prompt)) {
      const canonPrompt =
        `أنت تبني "Bible" ثابتة للعمل (شخصيات + أماكن + أسلوب) لاستخدامها في توليد مشاهد فيديو طويلة.
` +
        `أخرج JSON فقط بدون أي شرح أو Markdown.
` +
        `المطلوب:
` +
        `- characters: قائمة شخصيات. لكل شخصية: name, description, attributes (ملامح/ملابس/طباع), home (name, description), work (name, description).
` +
        `- locations: قائمة أماكن إضافية (غير منزل/عمل) مع name, description, attributes.
` +
        `- style: كائن فيه: genre, era, camera, lighting, color_palette, rules (قواعد ثبات).
` +
        `استخدم لغة المستخدم.

` +
        `طلب المستخدم:
${prompt}
`;
      const canonRaw = await callTextProvider(leader, canonPrompt, baseSystem);
      const canonJson = extractJsonOnly(canonRaw);
      canonBlock = `

CANON_JSON:
\`\`\`json
${canonJson}
\`\`\``;
    }

    const finalAgreement = finalAgreementBase + canonBlock;

    await bestEffortInsertTurn(admin, {
      debate_id: debateId,
      role: "assistant",
      content: finalAgreement,
      round_index: rounds + 1,
      provider: leader.name,
      model: leader.model_id || "",
    });

    await bestEffortUpdateSummary(admin, debateId, finalAgreement);

    // Token ledger on success (to match the reserved deduction)
    if (effectiveTokens > 0) {
      await writeLedgerOnSuccess(
        admin,
        user.id,
        debateId,
        effectiveTokens,
        `debate_${requestType || "text"}`,
      );
    }

    return json({ ok: true, debateId, rounds, final: finalAgreement });
  } catch (err: any) {
    // If we reserved here, refund
    if (reservedHere && effectiveTokens > 0) {
      try {
        await admin.rpc("refund_tokens", { p_user_id: user.id, p_tokens: effectiveTokens });
      } catch {
        // ignore
      }
    }

    return json({ ok: false, error: String(err?.message || err || "Unknown error") }, 500);
  }
});
