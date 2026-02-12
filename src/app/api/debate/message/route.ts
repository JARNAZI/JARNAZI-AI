import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type RequestType = 'text' | 'latex' | 'image' | 'video' | 'file';

function getSupabaseAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function callEdgeOrchestrator(body: any, userAuthHeader?: string | null) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const fnUrl = `${supabaseUrl}/functions/v1/ai-orchestrator`;
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(userAuthHeader
        ? {
          'Authorization': userAuthHeader,
          'apikey': (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!,
        }
        : {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
        }),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Edge orchestrator failed: ${res.status} ${t}`);
  }
  return res.json().catch(() => ({}));
}

async function countActiveTextProviders(supabaseAdmin: any) {
  const { count, error } = await supabaseAdmin
    .from('ai_providers')
    .select('id', { count: 'exact', head: true })
    .eq('enabled', true)
    .eq('kind', 'text');
  if (error) throw error;
  return Number(count || 0);
}

async function getNumericSetting(supabaseAdmin: any, key: string, fallback: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!error) {
      const raw = (data as any)?.value;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    }
  } catch (_) { }
  return fallback;
}

function computeTokenCost(providerCount: number, rounds: number, requestType: RequestType, base: number, perTurn: number, mediaOverhead: number) {
  const media = (requestType === 'image' || requestType === 'video' || requestType === 'file') ? mediaOverhead : 0;
  const total = base + (Math.max(providerCount, 0) * Math.max(rounds, 1) * perTurn) + media;
  return Math.max(1, total);
}

async function reserveTokens(supabaseAdmin: any, userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc('reserve_tokens', { p_user_id: userId, p_tokens: tokens });
  if (error) throw error;
}

async function refundTokens(supabaseAdmin: any, userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc('refund_tokens', { p_user_id: userId, p_tokens: tokens });
  if (error) console.error('refund_tokens failed', error);
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));
    const debateId = String(body?.debateId || '').trim();
    const rawPrompt = String(body?.prompt || '').trim();
    const requestType: RequestType = (body?.requestType || 'text') as RequestType;

    if (!debateId) return NextResponse.json({ error: 'Missing debateId' }, { status: 400 });
    if (!rawPrompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = userData.user;

    const { data: debRow, error: debErr } = await supabaseAdmin
      .from('debates')
      .select('id,user_id')
      .eq('id', debateId)
      .single();

    if (debErr || !debRow) return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    if (debRow.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rounds = await getNumericSetting(supabaseAdmin, 'debate_rounds', 3);
    const baseCost = await getNumericSetting(supabaseAdmin, 'debate_base_cost', 1);
    const perTurn = await getNumericSetting(supabaseAdmin, 'debate_cost_per_turn', 1);
    const mediaOverhead = await getNumericSetting(supabaseAdmin, 'debate_media_overhead', 2);

    const providerCount = await countActiveTextProviders(supabaseAdmin);
    const tokenCost = computeTokenCost(providerCount, rounds, requestType, baseCost, perTurn, mediaOverhead);

    try {
      await reserveTokens(supabaseAdmin, user.id, tokenCost);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('INSUFFICIENT_TOKENS')) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('token_balance')
          .eq('id', user.id)
          .maybeSingle();
        const current = Number(prof?.token_balance ?? 0);
        const missing = Math.max(0, tokenCost - current);
        return NextResponse.json(
          { error: 'INSUFFICIENT_TOKENS', requiredTokens: tokenCost, currentTokens: current, missingTokens: missing },
          { status: 402 }
        );
      }
      throw e;
    }

    try {
      await callEdgeOrchestrator({
        debateId,
        prompt: rawPrompt,
        requestType,
        rounds,
        tokens: tokenCost,
        alreadyReserved: true,
        systemMessage: "Multi-AI debate context continued.",
      }, authHeader);
    } catch (e) {
      await refundTokens(supabaseAdmin, user.id, tokenCost);
      throw e;
    }

    return NextResponse.json({ ok: true, reservedTokens: tokenCost });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

