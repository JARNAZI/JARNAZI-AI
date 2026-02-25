import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DebateOrchestrator } from '@/lib/orchestrator';

export const runtime = 'nodejs';

type RequestType = 'text' | 'latex' | 'image' | 'video' | 'file';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase Admin credentials in debate/message");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAiCosts(supabaseAdmin: any) {
  const { data } = await supabaseAdmin.from('ai_costs').select('*').eq('is_active', true);
  return data || [];
}

async function getMediaOverheadSetting(supabaseAdmin: any) {
  try {
    const { data } = await supabaseAdmin.from('site_settings').select('value').eq('key', 'debate_media_overhead').maybeSingle();
    return Number(data?.value) || 0;
  } catch (e) { return 0; }
}

function computeTokenCost(requestType: RequestType, aiCosts: any[], mediaOverhead: number) {
  let sumCost = 0;
  let textCount = 0;
  for (const c of aiCosts) {
    if (c.cost_type === 'text') {
      sumCost += Number(c.cost_per_unit) || 0;
      textCount++;
    }
  }
  const avgCost = textCount > 0 ? (sumCost / textCount) : 1;
  const orchestrationCost = Number(aiCosts.find(c => c.provider === 'openai')?.cost_per_unit) || 1;

  const totalCost = avgCost + orchestrationCost;
  const media = (requestType === 'image' || requestType === 'video' || requestType === 'file') ? mediaOverhead : 0;
  return Math.ceil((totalCost * 1.25) + media);
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
  const orchestrator = new DebateOrchestrator();

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
      .select('id,user_id,topic')
      .eq('id', debateId)
      .single();

    if (debErr || !debRow) return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    if (debRow.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // AI Orchestration Settings
    const aiCosts = await fetchAiCosts(supabaseAdmin);
    const mediaOverhead = await getMediaOverheadSetting(supabaseAdmin);
    const tokenCost = computeTokenCost(requestType, aiCosts, mediaOverhead);

    try {
      await reserveTokens(supabaseAdmin, user.id, tokenCost);
    } catch (e: any) {
      if (e.message?.includes('INSUFFICIENT_TOKENS')) {
        return NextResponse.json({ error: 'INSUFFICIENT_TOKENS', requiredTokens: tokenCost }, { status: 402 });
      }
      throw e;
    }

    try {
      // 1. Fetch History for Context
      const { data: turns } = await supabaseAdmin
        .from('debate_turns')
        .select('ai_name_snapshot, content')
        .eq('debate_id', debateId)
        .order('created_at', { ascending: true });

      const context = {
        topic: debRow.topic,
        debateId: debateId,
        previousTurns: (turns || []).map((t: any) => ({ ai_name: t.ai_name_snapshot, content: t.content }))
      };

      // 2. Execute a reply using the Maestro's best candidate selection
      const replyStep = {
        role: "Interlocutor / Rebuttal",
        provider_preference: [], // Use dynamic selection
        task_type: requestType === 'image' || requestType === 'video' ? 'image' : 'text' as any,
        instructions: `Participate in the debate based on the user's input: "${rawPrompt}"`
      };

      const result = await orchestrator.executeStep(replyStep, context);

      if (result.status === 'success') {
        await orchestrator.saveTurn(
          debateId,
          user.id,
          'assistant',
          result.agentName || 'AI',
          result.agentId || null,
          result.content,
          { user_prompt: rawPrompt }
        );

        // Ledger write
        await supabaseAdmin.from('token_ledger').insert({
          user_id: user.id,
          amount: -tokenCost,
          description: `Debate turn cost for session: ${debateId}`
        });

      } else {
        throw new Error(result.content);
      }

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

