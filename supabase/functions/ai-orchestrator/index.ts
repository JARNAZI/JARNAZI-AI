import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * AI Orchestrator (Supabase Edge Function)
 * - Reads provider credentials ONLY from Edge Function secrets (Deno.env)
 * - Discovers active providers from `public.ai_providers` (admin-managed)
 * - Runs a multi-agent "debate" where OpenAI is the leader / synthesizer
 * - Writes all turns to `public.debate_turns` and updates `public.debates.summary`
 * - Deducts user credits from `public.profiles.token_balance` (USD cents, resource budget)
 *
 * IMPORTANT:
 *  - This function supports a set of provider "styles" (openai_compatible, anthropic, gemini, cohere).
 *  - New providers can be added by admin without code changes IF they use one of these supported styles.
 */

type ProviderRow = {
  id: string;
  name: string;
  provider: string;
  category: "text" | "image" | "video" | "audio" | "math" | "security";
  base_url: string | null;
  model_id: string;
  config: any;
  env_key: string | null;
  is_active: boolean;
  priority: number;
};

type OrchestratorRequest = {
  debateId: string;
  prompt: string;
  systemMessage?: string;
  mode?: "text" | "image" | "video" | "audio";
  show?: "all" | "final"; // UI toggle hint (we still store all turns)
  participants?: string[]; // optional provider codes to include
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_DB_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const DEFAULT_SYSTEM = [
  "You are the leader of a multi-model AI debate.",
  "Your job: orchestrate multiple AI participants, then synthesize a final agreement.",
  "Rules:",
  "1) Keep the debate structured and concise.",
  "2) If math is present, use LaTeX with single dollar signs ($) inline, and double ($$) for blocks.",
  "3) Produce the final answer in clear bullet points + a short conclusion.",
].join("\n");

function jsonSafeParse(s: unknown) {
  if (!s) return {};
  if (typeof s === "object") return s;
  try { return JSON.parse(String(s)); } catch { return {}; }
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function estimateTextCostCents(provider: ProviderRow, prompt: string, expectedOutTokens = 700) {
  const cfg = jsonSafeParse(provider.config);
  const pricing = cfg?.pricing || {};
  // Defaults are intentionally conservative (admin should override in provider.config)
  const inPer1k = Number(pricing.input_per_1k_tokens ?? pricing.input ?? 2.5) / 100; // $0.025 default? => 2.5 cents per 1k
  const outPer1k = Number(pricing.output_per_1k_tokens ?? pricing.output ?? 7.5) / 100; // 7.5 cents per 1k
  const inTokens = Math.ceil(prompt.length / 4);
  const costUsd = (inTokens / 1000) * inPer1k + (expectedOutTokens / 1000) * outPer1k;
  return Math.max(1, Math.ceil(costUsd * 100)); // cents
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
      "Authorization": `Bearer ${opts.apiKey}`,
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
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!res.ok || !text) throw new Error(`OpenAI-compatible error (${res.status}): ${data?.error?.message || "No text"}`);
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
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!res.ok || !text) throw new Error(`Anthropic error (${res.status}): ${data?.error?.message || "No text"}`);
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
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!res.ok || !text) throw new Error(`Gemini error (${res.status}): ${data?.error?.message || "No text"}`);
  return String(text);
}

async function callCohere(opts: { apiKey: string; model: string; system: string; user: string }) {
  // Cohere chat API
  const res = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${opts.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      preamble: opts.system,
      message: opts.user,
      temperature: 0.4,
    }),
  });
  const data = await res.json();
  const text = data?.text;
  if (!res.ok || !text) throw new Error(`Cohere error (${res.status}): ${data?.message || "No text"}`);
  return String(text);
}

function providerStyle(provider: ProviderRow): "openai_compatible" | "anthropic" | "gemini" | "cohere" {
  const cfg = jsonSafeParse(provider.config);
  const style = String(cfg?.style || "").toLowerCase();
  if (style === "anthropic") return "anthropic";
  if (style === "gemini") return "gemini";
  if (style === "cohere") return "cohere";
  // default
  if (provider.provider === "anthropic") return "anthropic";
  if (provider.provider === "google" || provider.provider === "gemini") return "gemini";
  if (provider.provider === "cohere") return "cohere";
  return "openai_compatible";
}

async function callTextProvider(provider: ProviderRow, prompt: string, system: string) {
  if (!provider.env_key) throw new Error("Missing env_key on provider");
  const key = Deno.env.get(provider.env_key);
  if (!key) throw new Error(`Missing Edge secret: ${provider.env_key}`);

  const style = providerStyle(provider);
  if (style === "anthropic") return await callAnthropic({ apiKey: key, model: provider.model_id, system, user: prompt });
  if (style === "gemini") return await callGemini({ apiKey: key, model: provider.model_id, user: prompt });
  if (style === "cohere") return await callCohere({ apiKey: key, model: provider.model_id, system, user: prompt });

  const baseUrl =
    (provider.base_url && provider.base_url.trim()) ||
    (provider.provider === "openai" ? "https://api.openai.com" : "");
  if (!baseUrl) throw new Error("Missing base_url for openai_compatible provider");
  return await callOpenAICompatible({ baseUrl, apiKey: key, model: provider.model_id, system, user: prompt });
}

async function insertTurn(supabaseAdmin: any, args: {
  debateId: string;
  provider?: ProviderRow | null;
  nameSnapshot: string;
  content: string;
  isError?: boolean;
  sequenceIndex: number;
}) {
  const { error } = await supabaseAdmin.from("debate_turns").insert({
    debate_id: args.debateId,
    ai_provider_id: args.provider?.id ?? null,
    ai_name_snapshot: args.nameSnapshot,
    content: args.content,
    is_error: !!args.isError,
    sequence_index: args.sequenceIndex,
  });
  if (error) console.error("insertTurn error:", error);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as OrchestratorRequest;
    if (!payload?.debateId || !payload?.prompt) throw new Error("Missing debateId or prompt");

    // Auth: get user via bearer token coming from supabase.functions.invoke(...)
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData } = await supabaseUser.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
        status: 401,
      });
    }

    // Load credits
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("token_balance, subscription_tier")
      .eq("id", user.id)
      .single();
    if (profileErr) throw profileErr;

    // Load providers (admin managed)
    const { data: providers, error: provErr } = await supabaseAdmin
      .from("ai_providers")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (provErr) throw provErr;

    const textProviders = (providers as ProviderRow[]).filter((p) => p.category === "text");
    const leader = textProviders.find((p) => p.provider === "openai") || textProviders[0];
    if (!leader) throw new Error("No active text providers configured. Add at least OpenAI in Admin > Providers.");

    // Determine participants
    const requested = (payload.participants || []).map((s) => s.toLowerCase());
    const participants = textProviders
      .filter((p) => p.id !== leader.id)
      .filter((p) => (requested.length ? requested.includes(p.provider.toLowerCase()) : true))
      .slice(0, 8); // safety cap

    // Credits check (estimate)
    let estimatedCostCents = 0;
    estimatedCostCents += estimateTextCostCents(leader, payload.prompt, 900);
    for (const p of participants) estimatedCostCents += estimateTextCostCents(p, payload.prompt, 650);
    estimatedCostCents = clamp(estimatedCostCents, 1, 200000); // cap $2000 safety

    const currentCredits = Number(profile?.token_balance ?? 0);
    if (currentCredits < estimatedCostCents) {
      await insertTurn(supabaseAdmin, {
        debateId: payload.debateId,
        provider: null,
        nameSnapshot: "System",
        content: `Insufficient credits. Need ~$${(estimatedCostCents / 100).toFixed(2)} but you have $${(currentCredits / 100).toFixed(2)}.`,
        isError: true,
        sequenceIndex: 999999,
      });
      return new Response(JSON.stringify({ error: "Insufficient credits", needed_cents: estimatedCostCents, balance_cents: currentCredits }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
        status: 402,
      });
    }

    const system = payload.systemMessage?.trim() || DEFAULT_SYSTEM;

    // 1) Participant turns
    let seq = Date.now(); // monotonic-ish
    const participantTurns: { name: string; providerId: string; content: string }[] = [];
    for (const p of participants) {
      try {
        const content = await callTextProvider(
          p,
          payload.prompt,
          [
            `You are ${p.name}.`,
            "Provide your best contribution in 6-12 bullet points.",
            "Include: key reasoning, risks, and a suggested final stance.",
            "If you disagree with others, clearly say why.",
            "",
            system,
          ].join("\n"),
        );
        participantTurns.push({ name: p.name, providerId: p.id, content });
        await insertTurn(supabaseAdmin, {
          debateId: payload.debateId,
          provider: p,
          nameSnapshot: p.name,
          content,
          sequenceIndex: seq++,
        });
      } catch (e) {
        await insertTurn(supabaseAdmin, {
          debateId: payload.debateId,
          provider: p,
          nameSnapshot: p.name,
          content: `ERROR: ${(e as Error).message}`,
          isError: true,
          sequenceIndex: seq++,
        });
      }
    }

    // 2) Leader synthesis
    const synthesisPrompt = [
      "You are the Leader (OpenAI) synthesizing a multi-model debate.",
      "Input: user prompt + multiple participant answers.",
      "Task: produce ONE agreed final answer.",
      "Output format:",
      "A) 'Final Agreement' (bullets)",
      "B) 'Why this is correct' (short)",
      "C) 'If you need more info' (1-3 questions)",
      "",
      "USER PROMPT:",
      payload.prompt,
      "",
      "PARTICIPANTS:",
      ...participantTurns.map((t, i) => `--- Participant ${i + 1}: ${t.name} ---\n${t.content}`),
    ].join("\n");

    let finalText = "";
    try {
      finalText = await callTextProvider(leader, synthesisPrompt, system);
      await insertTurn(supabaseAdmin, {
        debateId: payload.debateId,
        provider: leader,
        nameSnapshot: `${leader.name} (Leader)`,
        content: finalText,
        sequenceIndex: seq++,
      });

      // Update debates.summary
      await supabaseAdmin.from("debates").update({ summary: finalText, status: "completed" }).eq("id", payload.debateId);

    } catch (e) {
      await insertTurn(supabaseAdmin, {
        debateId: payload.debateId,
        provider: leader,
        nameSnapshot: `${leader.name} (Leader)`,
        content: `ERROR: ${(e as Error).message}`,
        isError: true,
        sequenceIndex: seq++,
      });
      throw e;
    }

    // 3) Deduct credits (provider cost only)
    const newBalance = currentCredits - estimatedCostCents;
    await supabaseAdmin.from("profiles").update({ token_balance: newBalance }).eq("id", user.id);

    // 4) Ledger transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      amount: Math.round(estimatedCostCents), // cents
      currency: "USD",
      tokens_granted: 0,
      type: "usage",
      provider: "system",
      status: "completed",
      reason: "AI debate usage",
      metadata: {
        debate_id: payload.debateId,
        estimated_cost_cents: estimatedCostCents,
        margin_note: "User credits represent 75% resource budget; 25% margin is in plan price (not deducted per request).",
        providers_used: { leader: leader.provider, participants: participants.map((p) => p.provider) },
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      debateId: payload.debateId,
      estimated_cost_cents: estimatedCostCents,
      balance_cents: newBalance,
      final: finalText,
    }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 400,
    });
  }
});
