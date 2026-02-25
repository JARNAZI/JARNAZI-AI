import { NextResponse } from 'next/server';
import { createClient as createBrowserServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getSetting } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RequestType = 'video';

function estimateVideoTokens(input: { durationSec?: number }) {
  const duration = Math.max(1, Math.min(600, Number(input.durationSec ?? 6)));
  const base = 35;
  return Math.round(base * (duration / 6));
}

type VideoCostRate = { cost_per_unit: number; unit: string } | null;

async function getActiveVideoCostRate(admin: any): Promise<VideoCostRate> {
  const { data, error } = await admin
    .from('ai_costs')
    .select('cost_per_unit, unit')
    .eq('is_active', true)
    .eq('cost_type', 'video')
    .order('cost_per_unit', { ascending: true })
    .limit(1);

  if (error) return null;
  const row = Array.isArray(data) && data.length ? data[0] : null;
  if (!row) return null;
  const cpu = Number((row as any).cost_per_unit);
  const unit = String((row as any).unit ?? '').trim();
  if (!Number.isFinite(cpu) || cpu <= 0 || !unit) return null;
  return { cost_per_unit: cpu, unit };
}

function calcVideoTokensFromRate(durationSec: number, rate: { cost_per_unit: number; unit: string }) {
  const tokensPerUsd = 3;
  const real = rate.cost_per_unit;
  const unit = rate.unit;

  let realCostUsd = 0;
  if (unit === 'per_second') realCostUsd = durationSec * real;
  else if (unit === 'per_minute') realCostUsd = (durationSec / 60) * real;
  else if (unit === 'per_video') realCostUsd = real;
  else if (unit === 'per_10_seconds') realCostUsd = (durationSec / 10) * real;
  else return null;

  const realCents = Math.max(0, Math.round(realCostUsd * 100));
  const sellCents = Math.ceil(realCents / 0.75);
  const tokensNeeded = Math.max(1, Math.ceil((sellCents * tokensPerUsd) / 100));
  return tokensNeeded;
}

function getSupabaseAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getFeatures(admin: any) {
  const { data: row } = await admin.from('site_settings').select('value').eq('key', 'features').maybeSingle();
  return (row?.value ?? {}) as any;
}

async function getActiveProvidersFor(
  admin: any,
  kind: 'image' | 'video'
) {
  const { data, error } = await admin
    .from('ai_providers')
    .select('id, name, kind, enabled, config')
    .eq('enabled', true)
    .eq('kind', kind);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function POST(req: Request) {
  try {
    const supabase = await createBrowserServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const debateId: string | null = body?.debateId ?? null;
    const prompt: string = body?.prompt ?? '';
    let durationSec: number = Number(body?.durationSec ?? 6);

    if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > 600) {
      return NextResponse.json({ error: 'durationSec must be between 1 and 600' }, { status: 400 });
    }
    durationSec = Math.round(durationSec);
    const confirmed: boolean = !!body?.confirmed;

    if (!confirmed) return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    if (!prompt || prompt.trim().length < 3)
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const features = await getFeatures(admin);

    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('token_balance, free_trial_used')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

    if (features?.free_trial_enabled && !profile?.free_trial_used) {
      return NextResponse.json({ error: 'Free trial is text-only. Buy tokens to generate videos.' }, { status: 403 });
    }

    const perVideoBase = Number((await getSetting('video_base_tokens', null)) ?? 0);

    let tokensNeeded: number | null = null;
    if (perVideoBase > 0) {
      tokensNeeded = Math.max(1, Math.round(perVideoBase));
    } else {
      const rate = await getActiveVideoCostRate(admin);
      if (rate) tokensNeeded = calcVideoTokensFromRate(durationSec, rate);
      if (!tokensNeeded) tokensNeeded = estimateVideoTokens({ durationSec });
    }

    tokensNeeded = Number(tokensNeeded ?? 0) || 0;
    const currentBalance = Number(profile?.token_balance ?? 0);

    if (currentBalance < tokensNeeded) {
      const missingTokens = Math.max(0, tokensNeeded - currentBalance);

      try {
        const { data: pendingId, error: pendErr } = await admin.rpc('create_pending_request', {
          p_user_id: user.id,
          p_kind: 'video',
          p_payload: { debateId, prompt, durationSec },
          p_required_tokens: tokensNeeded,
          p_missing_tokens: missingTokens,
          p_ttl_minutes: 10,
        } as any);

        if (!pendErr && pendingId) {
          const { data: latest } = await admin.rpc('get_latest_pending', { p_user_id: user.id } as any);
          const expiresAt = Array.isArray(latest) && latest.length ? (latest[0] as any).expires_at : null;

          return NextResponse.json(
            {
              error: 'INSUFFICIENT_TOKENS',
              tokensNeeded,
              tokenBalance: currentBalance,
              missingTokens,
              pendingId,
              expiresAt,
              hint: 'Buy tokens to continue. If expired, confirm again.',
            },
            { status: 402 }
          );
        }
      } catch {
        // ignore
      }

      return NextResponse.json(
        { error: 'INSUFFICIENT_TOKENS', tokensNeeded, tokenBalance: currentBalance, missingTokens },
        { status: 402 }
      );
    }

    const { error: reserveErr } = await admin.rpc('reserve_tokens', { p_user_id: user.id, p_tokens: tokensNeeded } as any);
    if (reserveErr) {
      const msg = reserveErr.message || 'INSUFFICIENT_TOKENS';
      return NextResponse.json({ error: msg, tokensNeeded }, { status: 402 });
    }

    const fnName = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
    const providers = await getActiveProvidersFor(admin, 'video');

    const { data: gen, error: fnErr } = await admin.functions.invoke(fnName, {
      body: {
        kind: 'video_generate',
        requestType: 'video' as RequestType,
        user_id: user.id,
        debate_id: debateId,
        prompt,
        durationSec,
        providers,
      },
    });

    if (fnErr) {
      await admin.rpc('refund_tokens', { p_user_id: user.id, p_tokens: tokensNeeded } as any);
      return NextResponse.json({ error: fnErr.message || 'Generation failed' }, { status: 500 });
    }

    const public_url = gen?.public_url ?? null;
    const storage_path = gen?.storage_path ?? null;
    const provider_name = gen?.provider_name ?? gen?.provider ?? 'unknown';

    const { data: asset, error: assetErr } = await admin
      .from('generated_assets')
      .insert({
        user_id: user.id,
        debate_id: debateId,
        asset_type: 'video',
        prompt,
        provider_name,
        storage_path,
        public_url,
        cost_cents: tokensNeeded,
      } as any)
      .select('*')
      .single();

    if (assetErr) return NextResponse.json({ error: assetErr.message }, { status: 500 });

    const { data: p2 } = await admin.from('profiles').select('token_balance').eq('id', user.id).maybeSingle();

    return NextResponse.json({
      ok: true,
      tokensDeducted: tokensNeeded,
      tokenBalance: p2?.token_balance ?? null,
      asset,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
