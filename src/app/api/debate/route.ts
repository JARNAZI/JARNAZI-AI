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
    let { data: profile, error: profErr } = await supabaseAdmin.from('profiles').select('token_balance, free_trial_used').eq('id', user.id).maybeSingle();

    // Lazy Profile Creation: If the user just registered and has no profile row yet, create it.
    if (!profile) {
      console.log("[Debate API] Profile missing for user", user.id, "- performing lazy creation.");
      const { data: newProfile, error: createErr } = await supabaseAdmin.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        token_balance: 0,
        free_trial_used: false
      }).select('token_balance, free_trial_used').single();

      if (!createErr && newProfile) {
        profile = newProfile;
      } else {
        console.error("[Debate API] Lazy profile creation failed:", createErr);
        // Fallback to a virtual profile
        profile = { token_balance: 0, free_trial_used: false };
      }
    }

    // Robustly fetch 'enable_free_trial'
    const { getRobustSetting } = require('@/lib/settings-robust');
    const rawEnableTrial = await getRobustSetting(supabaseAdmin, 'enable_free_trial', 'false');
    const enableFreeTrial = String(rawEnableTrial).toLowerCase() === 'true';

    // Free trial is active if:
    // 1. Setting is globally enabled
    // 2. User has a profile (we ensured this above)
    // 3. User HAS NOT explicitly used it yet (free_trial_used !== true)
    const isFreeTrialActive = enableFreeTrial && profile && profile.free_trial_used !== true;

    console.log("[Debate API] Trial Check:", {
      userId: user.id,
      enableFreeTrial,
      profileExists: !!profile,
      freeTrialUsed: profile?.free_trial_used,
      isFreeTrialActive,
      requestType,
      balance: profile?.token_balance
    });

    // Reject non-text requests if relying ONLY on free trial
    if (isFreeTrialActive && requestType !== 'text' && Number(profile?.token_balance || 0) <= 0) {
      return NextResponse.json({
        error: 'FREE_TRIAL_TEXT_ONLY',
        message: 'The Council requires an allocation of neural tokens for media generation. Your free trial is valid for text-based deliberations only.'
      }, { status: 403 });
    }

    // 1. Trigger Maestro to Plan the Debate first
    const plan = await orchestrator.planDebate(topic);

    // 2. Token Accounting using dynamic pricing
    const tokenCost = await calculateDynamicTokenCost(supabaseAdmin, plan);

    let isFreeTrialTurn = false;
    let tokensInsufficient = false;

    // Check if user has no tokens -> Must rely on free trial
    if (Number(profile?.token_balance || 0) < tokenCost) {
      if (isFreeTrialActive && requestType === 'text') {
        isFreeTrialTurn = true;
      } else {
        tokensInsufficient = true;
      }
    }

    // 3. Create Debate Record and User Prompt first (so it ALWAYS appears in Consensus Library)
    const { data: debate, error: debErr } = await supabaseAdmin
      .from('debates')
      .insert({
        user_id: user.id,
        topic,
        status: tokensInsufficient ? 'failed' : 'active',
        mode: requestType,
      })
      .select('*')
      .single();

    if (debErr || !debate) {
      throw debErr || new Error('Failed to create debate');
    }

    // Save the user's initial prompt as the first message in the debate window
    await orchestrator.saveTurn(
      debate.id,
      user.id,
      'user',
      user.user_metadata?.full_name || 'User',
      null,
      topic,
      { request_type: requestType }
    );

    // If tokens are insufficient, return 402 NOW (with debateId so it's known)
    if (tokensInsufficient) {
      return NextResponse.json({ 
        error: 'INSUFFICIENT_TOKENS', 
        tokensNeeded: tokenCost, 
        debateId: debate.id 
      }, { status: 402 });
    }

    // 4. Apply Payments immediately
    if (!isFreeTrialTurn) {
      try {
        await reserveTokens(supabaseAdmin, user.id, tokenCost);
      } catch (e: any) {
        await supabaseAdmin.from('debates').update({ status: 'failed' }).eq('id', debate.id);
        if (e.message?.includes('INSUFFICIENT_TOKENS')) {
          return NextResponse.json({ error: 'INSUFFICIENT_TOKENS', tokensNeeded: tokenCost, debateId: debate.id }, { status: 402 });
        }
        throw e;
      }
    } else {
      // Mark free trial as used IMMEDIATELY so they don't get stuck in a loop
      await supabaseAdmin.from('profiles').update({ free_trial_used: true }).eq('id', user.id);
    }

    // 5. Trigger Maestro asynchronously (Non-blocking) so the UI redirects instantly to the Debate Room
    const runDebateBackground = async () => {
      try {
        await orchestrator.runFullDebate(debate.id, user.id, topic, plan);

        if (!isFreeTrialTurn) {
          // Update final cost
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
      }
    };

    // Fire & Forget
    runDebateBackground().catch(console.error);

    return NextResponse.json({ debateId: debate.id, reservedTokens: tokenCost });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

