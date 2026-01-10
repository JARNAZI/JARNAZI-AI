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


const requestType = (body.requestType || 'text') as 'text' | 'image' | 'video' | 'audio' | 'file';

// Settings-driven pricing (cents). Defaults are conservative.
const { data: settingRows } = await supabaseAdmin.from('settings').select('key,value').in('key', [
    'enable_free_trial',
    'free_trial_credits_cents',
    'cost_rates'
]);

const settings: Record<string, any> = {};
for (const r of settingRows || []) settings[r.key] = r.value;

const enableFreeTrial = settings.enable_free_trial === true || settings.enable_free_trial === 'true';
const freeTrialCredits = Number(settings.free_trial_credits_cents ?? 100);
const costRates = (() => {
    try {
        const v = settings.cost_rates;
        if (!v) return null;
        return typeof v === 'string' ? JSON.parse(v) : v;
    } catch { return null; }
})() as any;

const DEFAULT_RATES: Record<string, number> = { text: 10, image: 200, video: 1000, audio: 150, file: 50 };
const estimatedCost = Number((costRates && costRates[requestType]) ?? DEFAULT_RATES[requestType] ?? 10);


        // --- SECURITY LAYER END ---


        // 1. Verify User & Check Free Trial (Existing Logic)
        const { data: profile } = await supabaseAdmin.from('profiles').select('token_balance, email, full_name').eq('id', userId).single();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { count: debateCount } = await supabaseAdmin.from('debates').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        const isFreeTrial = enableFreeTrial && debateCount === 0;

        if (isFreeTrial && requestType !== 'text') {
            return NextResponse.json({ error: 'Free trial allows text debates only.' }, { status: 402 });
        }


        if ((profile.token_balance || 0) < estimatedCost && !isFreeTrial) {
            await createNotification(userId, 'Insufficient credits. Please purchase more.', 'error', '/plans');
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

        // Apply one-time free trial credit (first debate only)
        if (isFreeTrial && (profile.token_balance || 0) < freeTrialCredits) {
            profile.token_balance = freeTrialCredits;
            await supabaseAdmin.from('profiles').update({ token_balance: freeTrialCredits }).eq('id', userId);
        }

        if ((profile.token_balance || 0) < estimatedCost) {
            await createNotification(userId, 'Insufficient credits. Please purchase more.', 'error', '/plans');
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

        // Reserve credits up-front
        await supabaseAdmin.from('profiles').update({ token_balance: (profile.token_balance || 0) - estimatedCost }).eq('id', userId);

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

                await orchestrator.saveTurn(debate.id, result.agentName || 'AI', providerId, result.content);

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
