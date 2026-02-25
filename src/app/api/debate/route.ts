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
import { DebateOrchestrator } from '@/lib/orchestrator';
import { getSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const maxDuration = 60; // Extend duration for multi-step AI orchestration

type RequestType = 'text' | 'latex' | 'image' | 'video' | 'file';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing Supabase Admin credentials: ${!url ? 'URL ' : ''}${!key ? 'KEY' : ''}`);
  return createClient(url, key, { auth: { persistSession: false } });
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

async function fetchAiCosts(supabaseAdmin: any) {
  const { data } = await supabaseAdmin.from('ai_costs').select('*').eq('is_active', true);
  return data || [];
}

/**
 * Calculates a conservative token budget for the Maestro from database settings.
 */
function computeTokenCost(
  providerCount: number,
  requestType: RequestType,
  settings: Record<string, unknown>,
  aiCosts: any[]
) {
  const maxSteps = Number(settings.debate_rounds) || 2;
  const sMediaOverhead = Number(settings.debate_media_overhead) || 2;

  const mediaOverhead = (requestType === 'image' || requestType === 'video' || requestType === 'file') ? sMediaOverhead : 0;

  let sumCost = 0;
  for (const c of aiCosts) {
    if (c.cost_type === 'text') {
      sumCost += Number(c.cost_per_unit) || 1;
    }
  }
  if (sumCost === 0) sumCost = providerCount * 1; // fallback

  const orchestrationCost = Number(aiCosts.find(c => c.provider === 'openai')?.cost_per_unit) || 1;

  const totalCost = (sumCost * maxSteps) + orchestrationCost;
  const userChargeToken = Math.ceil((totalCost * 1.25) + mediaOverhead);

  return userChargeToken;
}

async function reserveTokens(supabaseAdmin: any, userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc('reserve_tokens', { p_user_id: userId, p_tokens: tokens });
  if (error) throw error;
}

async function refundTokens(supabaseAdmin: any, userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc('refund_tokens', { p_user_id: userId, p_tokens: tokens });
  if (error) {
    console.error('refund_tokens failed', error);
  }
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const orchestrator = new DebateOrchestrator();

  try {
    const body = await req.json().catch(() => ({}));
    const rawTopic = String(body?.topic ?? '').trim();
    const requestType: RequestType = (body?.requestType || 'text') as RequestType;

    if (!rawTopic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 });

    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';

    const turnstileToken = body?.turnstileToken;
    if (turnstileToken) {
      const ok = await verifyTurnstileToken(turnstileToken, ip);
      if (!ok) return NextResponse.json({ error: 'Turnstile failed' }, { status: 403 });
    }

    await checkRateLimit(ip);
    const topic = sanitizeInput(rawTopic);
    await validateContentSafety(topic);
    await checkSafeBrowsing(topic);

    const authHeader = req.headers.get('authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = userData.user;

    // 1. Create Debate Record
    const { data: debate, error: debErr } = await supabaseAdmin
      .from('debates')
      .insert({
        user_id: user.id,
        topic,
        status: 'active',
        mode: requestType,
      })
      .select('*')
      .single();

    if (debErr || !debate) throw debErr || new Error('Failed to create debate');

    // 2. Token Accounting
    const providerCount = await countActiveTextProviders(supabaseAdmin);

    // Fetch dynamic settings for debate parameters
    const settingsArr = await getSettings([
      'debate_rounds',
      'debate_media_overhead'
    ]);
    const aiCosts = await fetchAiCosts(supabaseAdmin);
    const tokenCost = computeTokenCost(providerCount, requestType, settingsArr, aiCosts);

    try {
      await reserveTokens(supabaseAdmin, user.id, tokenCost);
    } catch (e: any) {
      if (e.message?.includes('INSUFFICIENT_TOKENS')) {
        return NextResponse.json({ error: 'Insufficient tokens' }, { status: 402 });
      }
      throw e;
    }

    // 3. Trigger Maestro (Non-blocking or await depending on requirements)
    // We await here to ensure we can handle errors and refund, local Next.js supports longer timeouts.
    try {
      await orchestrator.runFullDebate(debate.id, user.id, topic);

      // Update final cost if applicable
      await supabaseAdmin.from('debates').update({ total_cost_cents: tokenCost }).eq('id', debate.id);

      // Log to Ledger
      await supabaseAdmin.from('token_ledger').insert({
        user_id: user.id,
        amount: -tokenCost,
        description: `Debate cost for session: ${debate.id}`
      });

    } catch (e) {
      console.error("[API/Debate] Maestro Execution Failed:", e);
      await refundTokens(supabaseAdmin, user.id, tokenCost);
      await supabaseAdmin.from('debates').update({ status: 'failed' }).eq('id', debate.id);
      throw e;
    }

    return NextResponse.json({ debateId: debate.id, reservedTokens: tokenCost });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

