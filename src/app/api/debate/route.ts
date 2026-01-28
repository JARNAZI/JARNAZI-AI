import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  sanitizeInput,
  verifyTurnstileToken,
  checkSafeBrowsing,
  checkRateLimit,
  validateContentSafety
} from '@/lib/security';

export const runtime = 'nodejs';

type RequestType = 'text' | 'latex' | 'image' | 'video' | 'file';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function callEdgeOrchestrator(body: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const fnUrl = `${supabaseUrl}/functions/v1/ai-orchestrator`;
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
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
    .eq('is_active', true)
    .eq('category', 'text');
  if (error) throw error;
  return Number(count || 0);
}

function computeTokenCost(providerCount: number, rounds: number, requestType: RequestType) {
  // Simple, predictable pricing:
  // - base: 1 token
  // - each AI turn: 1 token (participants * rounds)
  // - media planning adds small overhead (2 tokens) because prompts are longer/more complex
  const base = 1;
  const perTurn = 1;
  const mediaOverhead = (requestType === 'image' || requestType === 'video' || requestType === 'file') ? 2 : 0;
  const total = base + (Math.max(providerCount, 0) * Math.max(rounds, 1) * perTurn) + mediaOverhead;
  return Math.max(1, total);
}

async function reserveTokens(supabaseAdmin: any, userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc('reserve_tokens', { p_user_id: userId, p_tokens: tokens });
  if (error) throw error;
}

async function refundTokens(supabaseAdmin: any, userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc('refund_tokens', { p_user_id: userId, p_tokens: tokens });
  if (error) {
    // Best-effort refund; log but do not throw to avoid masking original error.
    console.error('refund_tokens failed', error);
  }
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));
    const rawTopic = String(body?.topic ?? '').trim();
    const requestType: RequestType = (body?.requestType || 'text') as RequestType;

    if (!rawTopic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 });

    // 1) Basic safety + rate limit (keep existing protections)
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';

    // Turnstile (optional)
    const turnstileToken = body?.turnstileToken;
    if (turnstileToken) {
      const ok = await verifyTurnstileToken(turnstileToken, ip);
      if (!ok) return NextResponse.json({ error: 'Turnstile failed' }, { status: 403 });
    }

    await checkRateLimit(ip);
    const topic = sanitizeInput(rawTopic);
    await validateContentSafety(topic);
    await checkSafeBrowsing(topic);

    // 2) Authenticate user via bearer token
    const authHeader = req.headers.get('authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = userData.user;

    // 3) Create debate record
    const { data: debate, error: debErr } = await supabaseAdmin
      .from('debates')
      .insert({
        user_id: user.id,
        topic,
        status: 'processing',
      })
      .select('*')
      .single();

    if (debErr || !debate) throw debErr || new Error('Failed to create debate');

    // 4) Token accounting (reserve upfront)
    const rounds = 2; // finite debate; not infinite
    const providerCount = await countActiveTextProviders(supabaseAdmin);
    const tokenCost = computeTokenCost(providerCount, rounds, requestType);

    await reserveTokens(supabaseAdmin, user.id, tokenCost);

    // 5) Kick off unified orchestrator in Edge Function (keys stay in Edge secrets)
    try {
      await callEdgeOrchestrator({
        debateId: debate.id,
        prompt: topic,
        requestType,
        rounds,
        systemMessage:
          "Multi-AI debate. Each participant must respond to another AI by name. Use LaTeX for math: inline $...$ and block $$...$$. For image/video/file requests, debate to produce a single final generation prompt, then output the final agreement under the heading 'الاتفاق'.",
      });
    } catch (e) {
      // Refund reserved tokens on failure
      await refundTokens(supabaseAdmin, user.id, tokenCost);
      // Mark debate error
      await supabaseAdmin.from('debates').update({ status: 'error' }).eq('id', debate.id);
      throw e;
    }

    return NextResponse.json({ debateId: debate.id, reservedTokens: tokenCost });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
