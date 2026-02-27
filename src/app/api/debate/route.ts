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
import { DebateOrchestrator, calculateDynamicTokenCost } from '@/lib/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 60; // Extend duration for multi-step AI orchestration

type RequestType = 'text' | 'latex' | 'image' | 'video' | 'file';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing Supabase Admin credentials: ${!url ? 'URL ' : ''}${!key ? 'KEY' : ''}`);
  return createClient(url, key, { auth: { persistSession: false } });
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

    // Check Free Trial vs Token Balance
    const { data: profile } = await supabaseAdmin.from('profiles').select('token_balance, free_trial_used').eq('id', user.id).single();
    const { data: stData } = await supabaseAdmin.from('site_settings').select('value').eq('key', 'enable_free_trial').maybeSingle();
    const enableFreeTrial = (stData as any)?.value === 'true';
    const isFreeTrialActive = enableFreeTrial && profile && !profile.free_trial_used;

    // Reject non-text requests if relying ONLY on free trial
    if (isFreeTrialActive && requestType !== 'text' && Number(profile?.token_balance || 0) <= 0) {
      return NextResponse.json({ error: 'FREE_TRIAL_TEXT_ONLY', message: 'Free trial is text-only.' }, { status: 403 });
    }

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

    // 2. Trigger Maestro to Plan the Debate first
    const plan = await orchestrator.planDebate(topic);

    // 3. Token Accounting using dynamic pricing
    const tokenCost = await calculateDynamicTokenCost(supabaseAdmin, plan);

    let isFreeTrialTurn = false;

    // Check if user has no tokens -> Must rely on free trial
    if (Number(profile?.token_balance || 0) < tokenCost) {
      if (isFreeTrialActive && requestType === 'text') {
        isFreeTrialTurn = true;
      } else {
        return NextResponse.json({ error: 'INSUFFICIENT_TOKENS', tokensNeeded: tokenCost }, { status: 402 });
      }
    } else {
      try {
        await reserveTokens(supabaseAdmin, user.id, tokenCost);
      } catch (e: any) {
        if (e.message?.includes('INSUFFICIENT_TOKENS')) {
          return NextResponse.json({ error: 'INSUFFICIENT_TOKENS', tokensNeeded: tokenCost }, { status: 402 });
        }
        throw e;
      }
    }

    // 4. Trigger Maestro (Non-blocking or await depending on requirements)
    // We await here to ensure we can handle errors and refund, local Next.js supports longer timeouts.
    try {
      await orchestrator.runFullDebate(debate.id, user.id, topic, plan);

      if (isFreeTrialTurn) {
        await supabaseAdmin.from('profiles').update({ free_trial_used: true }).eq('id', user.id);
      } else {
        // Update final cost if applicable
        await supabaseAdmin.from('debates').update({ total_cost_cents: tokenCost }).eq('id', debate.id);

        // Log to Ledger
        await supabaseAdmin.from('token_ledger').insert({
          user_id: user.id,
          amount: -tokenCost,
          description: `Debate cost for session: ${debate.id}`
        });
      }

    } catch (e) {
      console.error("[API/Debate] Maestro Execution Failed:", e);
      if (!isFreeTrialTurn) {
        await refundTokens(supabaseAdmin, user.id, tokenCost);
      }
      await supabaseAdmin.from('debates').update({ status: 'failed' }).eq('id', debate.id);
      throw e;
    }

    return NextResponse.json({ debateId: debate.id, reservedTokens: tokenCost });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

