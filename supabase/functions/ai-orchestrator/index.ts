import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type OrchestratorRequest = {
  debateId: string;
  prompt: string;
  requestType?: "text" | "latex" | "image" | "video" | "file";
  systemMessage?: string;
  rounds?: number;
  tokens?: number;
  alreadyReserved?: boolean;
};

type ProviderRow = {
  id: string;
  name: string;
  kind: string;
  enabled: boolean;
  env_key: string | null;
  base_url: string | null;
  model_id: string;
  config: any;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeProviderRow(raw: any): ProviderRow {
  const cfg = typeof raw?.config === "object" ? raw.config : {};
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? "provider"),
    kind: String(raw?.kind ?? "text"),
    enabled: Boolean(raw?.enabled ?? true),
    env_key: raw?.env_key ?? null,
    base_url: raw?.base_url ?? null,
    model_id: String(cfg?.model_id ?? cfg?.model ?? "gpt-4o"),
    config: cfg,
  };
}

async function callTextProvider(provider: ProviderRow, prompt: string, system: string) {
  const apiKey = Deno.env.get(provider.env_key || "");
  if (!apiKey) throw new Error(`Missing Edge secret: ${provider.env_key}`);

  const baseUrl = provider.base_url || "https://api.openai.com";
  const url = baseUrl.replace(/\/$/, "") + "/v1/chat/completions";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model_id,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Provider failed: ${data?.error?.message || res.status}`);
  return String(data?.choices?.[0]?.message?.content || "");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: OrchestratorRequest = await req.json();
    const { debateId, prompt, tokens = 0 } = body;

    const authHeader = req.headers.get("Authorization");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Fetch enabled text providers
    const { data: rawProviders } = await admin
      .from("ai_providers")
      .select("*")
      .eq("enabled", true)
      .ilike("kind", "%text%");

    const providers = (rawProviders || []).map(normalizeProviderRow);
    if (!providers.length) return json({ error: "No providers available" }, 503);

    // Run a simple debate context
    const responses = [];
    for (const p of providers.slice(0, 3)) {
      try {
        const text = await callTextProvider(p, prompt, "You are a helpful assistant.");
        responses.push({ p: p.name, text });

        await admin.from("debate_turns").insert({
          debate_id: debateId,
          user_id: user.id,
          ai_provider_id: p.id,
          ai_name_snapshot: p.name,
          role: "assistant",
          content: text,
        });
      } catch (e) {
        console.error(`Provider ${p.name} failed:`, e);
      }
    }

    const summary = responses.map(r => `${r.p}: ${r.text}`).join("\n\n");
    await admin.from("debates").update({
      final_summary: summary,
      status: "completed",
      total_cost_cents: tokens
    }).eq("id", debateId);

    if (tokens > 0) {
      await admin.from("token_ledger").insert({
        user_id: user.id,
        amount: -tokens,
        description: `Debate cost for session: ${debateId}`
      });
    }

    return json({ ok: true, summary });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
