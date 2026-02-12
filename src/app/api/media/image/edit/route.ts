import { NextResponse } from 'next/server';
import { createClient as createBrowserServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function estimateEditTokens(prompt: string) {
  const len = (prompt || '').length;
  return Math.min(45, 10 + Math.ceil(len / 200) * 5);
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

async function getActiveProvidersFor(admin: any, kind: 'image' | 'video') {
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
    const sourceImageUrl: string = body?.sourceImageUrl ?? '';
    const confirmed: boolean = !!body?.confirmed;

    if (!debateId || !prompt || !sourceImageUrl)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const tokensNeeded = estimateEditTokens(prompt);

    if (!confirmed) return NextResponse.json({ ok: true, tokensNeeded });

    const admin = getSupabaseAdmin();
    const features = await getFeatures(admin);

    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('token_balance, free_trial_used')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    if (features?.free_trial_enabled && !profile.free_trial_used) {
      return NextResponse.json({ error: 'Free trial is text-only. Buy tokens to edit images.' }, { status: 403 });
    }

    const currentBalance = Number(profile.token_balance ?? 0);
    if (currentBalance < tokensNeeded)
      return NextResponse.json({ error: 'Insufficient tokens', tokensNeeded, tokenBalance: currentBalance }, { status: 402 });

    const { error: reserveErr } = await admin.rpc('reserve_tokens', { p_user_id: user.id, p_tokens: tokensNeeded } as any);
    if (reserveErr) {
      const msg = reserveErr.message || 'INSUFFICIENT_TOKENS';
      return NextResponse.json({ error: msg, tokensNeeded }, { status: 402 });
    }

    const fnName = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
    const providers = await getActiveProvidersFor(admin, 'image');

    const { data: fnData, error: fnError } = await admin.functions.invoke(fnName, {
      body: {
        kind: 'image_edit',
        requestType: 'image',
        prompt,
        sourceImageUrl,
        debate_id: debateId,
        user_id: user.id,
        providers,
      },
    });

    if (fnError) {
      await admin.rpc('refund_tokens', { p_user_id: user.id, p_tokens: tokensNeeded } as any);
      return NextResponse.json({ error: 'Image editing failed', details: fnError.message }, { status: 502 });
    }

    const { data: asset, error: assetErr } = await admin
      .from('generated_assets')
      .insert({
        user_id: user.id,
        debate_id: debateId,
        asset_type: 'image',
        prompt,
        provider_name: (fnData as any)?.provider_name || (fnData as any)?.provider || 'unknown',
        storage_path: (fnData as any)?.storage_path || null,
        public_url: (fnData as any)?.public_url || (fnData as any)?.url || null,
        cost_cents: tokensNeeded,
      } as any)
      .select('*')
      .single();

    if (assetErr) return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });

    const { data: p2 } = await admin.from('profiles').select('token_balance').eq('id', user.id).maybeSingle();

    return NextResponse.json({ ok: true, tokensDeducted: tokensNeeded, tokenBalance: p2?.token_balance ?? null, asset });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

