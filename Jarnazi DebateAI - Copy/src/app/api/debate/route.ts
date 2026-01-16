import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { DebateOrchestrator } from '@/lib/orchestrator';
import {
    DebateSchema,
    sanitizeInput,
    verifyTurnstileToken,
    checkSafeBrowsing,
    checkRateLimit,
    validateContentSafety
} from '@/lib/security';

// Server-side client for admin tasks
// Disable Edge Runtime to use Node.js APIs
export const runtime = 'nodejs';

// Supabase admin client will be initialized per request

import { sendDebateSummary } from '@/lib/email';
import { createNotification, notifyAdmin } from '@/lib/notifications';

export async function POST(req: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    try {
        const body = await req.json();

        // --- SECURITY LAYER START ---

        // 1. Zod Validation (Type & Format)
        const parseResult = DebateSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ error: 'Invalid input format', details: parseResult.error.format() }, { status: 400 });
        }
        const { topic: rawTopic, userId, turnstileToken } = parseResult.data;

        // 2. Turnstile Verification (Optional)
        if (turnstileToken) {
            const ip = (await headers()).get('x-forwarded-for') || undefined;
            const isHuman = await verifyTurnstileToken(turnstileToken, ip);
            if (!isHuman) {
                return NextResponse.json({ error: 'Security check failed (Captcha)' }, { status: 403 });
            }
        }

        // 3. Rate Limiting (Anti-Abuse)
        const isAllowed = await checkRateLimit(userId);
        if (!isAllowed) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
        }

        // 4. Safe Browsing (Malware/Phishing)
        const isSafe = await checkSafeBrowsing(rawTopic);
        if (!isSafe) {
            // Shadow ban potential? For now, strict block.
            await notifyAdmin('Security Alert', `Malicious content blocked from User ${userId}: ${rawTopic}`);
            return NextResponse.json({ error: 'Topic contains unsafe content.' }, { status: 400 });
        }

        // 5. Advanced Sanitization & Injection Check
        if (!validateContentSafety(rawTopic)) {
            return NextResponse.json({ error: 'Input contains forbidden patterns.' }, { status: 400 });
        }
        const topic = sanitizeInput(rawTopic);


const requestType: 'text' | 'image' | 'video' | 'audio' | 'latex' | 'file' = (body.requestType || 'text');

// --- SECURITY LAYER START ---
// Read feature flags from site_settings (best effort; defaults are safe)
let freeTrialEnabled = true;
let freeTrialTextOnly = true;

try {
  const { data: featuresRow } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'features')
    .maybeSingle();

  const features = (featuresRow as any)?.value || {};
  freeTrialEnabled = Boolean(features.free_trial_enabled ?? true);
  freeTrialTextOnly = Boolean(features.free_trial_text_only ?? true);
} catch (e) {
  // ignore: use defaults
}

const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('id, email, token_balance_cents, free_trial_used')
  .eq('id', user.id)
  .single();

if (profileError || !profile) {
  return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
}

// Cost in TOKENS (integer-ish). We estimate lightly.
const estimatedCost = estimateCostTokens(requestType, body);

// Free trial = ONE TEXT QUESTION ONLY (no attachments / no latex / no audio / no images / no video / no files)
const isFreeTrialRequest =
  freeTrialEnabled &&
  !profile.free_trial_used &&
  requestType === 'text' &&
  freeTrialTextOnly &&
  !body?.hasAttachment &&
  !body?.isLatex;

const currentTokens = Number(profile.token_balance_cents || 0);

if (!isFreeTrialRequest && currentTokens < estimatedCost) {
  // Insufficient balance
  await createNotification(
    user.id,
    'Insufficient tokens',
    'Your balance is not enough for this request. Please buy tokens to continue.',
    `/buy-tokens`
  );

  return NextResponse.json(
    { error: 'Insufficient tokens', required: estimatedCost, balance: currentTokens },
    { status: 402 }
  );
}

// Reserve tokens upfront (server-side only) for non-free-trial requests
let newBalance = currentTokens;
if (!isFreeTrialRequest) {
  newBalance = currentTokens - estimatedCost;

  const { error: reserveError } = await supabaseAdmin
    .from('profiles')
    .update({ token_balance_cents: newBalance })
    .eq('id', user.id);

  if (reserveError) {
    return NextResponse.json({ error: 'Failed to reserve tokens' }, { status: 500 });
  }
}
// --- SECURITY LAYER END ---


        // 2. Initialize Orchestrator & Create Record
        const orchestrator = new DebateOrchestrator();

        const { data: debate } = await supabaseAdmin.from('debates').insert({ user_id: userId, topic, status: 'active' }).select().single();
        if (!debate) throw new Error('Failed to start debate');

        // Deduct Token (ONLY if not a free trial run)
        if (!isFreeTrial) {
            const newBalance = profile.token_balance - 1;
            await supabaseAdmin.from('profiles').update({ token_balance: newBalance }).eq('id', userId);

            if (newBalance < 3) {
                await createNotification(userId, `Low balance warning: ${newBalance} tokens remaining.`, 'warning', '/pricing');
            }
        }

        // 3. MASTER PLANNER: Generate Execution Plan
        const planSteps = await orchestrator.planDebate(topic);

        const results = [];
        const turnsHistory: { ai_name: string; content: string; type?: string }[] = [];

        // 4. Execute Dynamic Steps
        for (const step of planSteps) {
            const result = await orchestrator.executeStep(step, {
                topic,
                debateId: debate.id,
                previousTurns: turnsHistory
            });

            if (result.status === 'success') {
                const providerId = step.task_type === 'image' ? 'system-visual' : 'ai-agent-generic';

                                const roleLabel = (step.role || '').toLowerCase();
                const phase = /consensus|agreement/.test(roleLabel)
                    ? 'consensus'
                    : /rebuttal|review|critique|cross/.test(roleLabel)
                        ? 'review'
                        : 'independent';
                const turnRole = phase === 'consensus' ? 'agreement' : 'assistant';

                await orchestrator.saveTurn(
                    debate.id,
                    user.id,
                    turnRole,
                    result.agentName || 'AI',
                    providerId,
                    result.content,
                    { phase, task_type: step.task_type, plan_role: step.role }
                );
turnsHistory.push({
                    ai_name: result.agentName || 'AI',
                    content: result.content,
                    type: step.task_type
                });

                results.push({
                    ai_name: result.agentName,
                    content: result.content,
                    role: step.role
                });
            }
        }

                // Mark free trial as used after the first successful TEXT-only request
        if (isFreeTrialRequest) {
            await supabaseAdmin.from('profiles').update({ free_trial_used: true }).eq('id', user.id);
        }

        // 5. Complete Debate
        await supabaseAdmin.from('debates').update({ status: 'completed' }).eq('id', debate.id);

        if (profile.email) {
            await sendDebateSummary(profile.email, topic, debate.id);
        }

        return NextResponse.json({ success: true, debateId: debate.id, turns: results });

    } catch (error: any) {
        console.error('Debate API Error:', error);
        await notifyAdmin('Critical API Failure', `Debate Route Error: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


function estimateCostTokens(
  requestType: 'text' | 'image' | 'video' | 'audio' | 'latex' | 'file',
  body: any
): number {
  // Conservative defaults: keep integer tokens.
  switch (requestType) {
    case 'text':
      return 1;
    case 'latex':
      return 2;
    case 'audio':
      return 3;
    case 'image':
      return 8;
    case 'video':
      return 25;
    case 'file':
      return 2;
    default:
      return 1;
  }
}
