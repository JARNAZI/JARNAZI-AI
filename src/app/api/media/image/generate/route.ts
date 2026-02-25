import { NextResponse } from 'next/server';
import { createClient as createBrowserServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RequestType = 'image';

function estimateImageTokens({ quality }: { quality?: string }) {
  const base = 18;
  const q = (quality || '').toLowerCase();
  if (q.includes('high') || q.includes('hq')) return base + 12;
  return base;
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
    const style: string = body?.style ?? 'Cinematic';
    const aspect: string = body?.aspect ?? '16:9';
    const quality: string = body?.quality ?? 'High';
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
      return NextResponse.json({ error: 'Free trial is text-only. Buy tokens to generate images.' }, { status: 403 });
    }

    const tokensNeeded = estimateImageTokens({ quality });
    const currentBalance = Number(profile?.token_balance ?? 0);

    if (currentBalance < tokensNeeded) {
      return NextResponse.json(
        { error: 'Insufficient tokens', tokensNeeded, tokenBalance: currentBalance },
        { status: 402 }
      );
    }

    const { error: reserveErr } = await admin.rpc('reserve_tokens', { p_user_id: user.id, p_tokens: tokensNeeded } as any);
    if (reserveErr) {
      const msg = reserveErr.message || 'INSUFFICIENT_TOKENS';
      return NextResponse.json({ error: msg, tokensNeeded }, { status: 402 });
    }

    const fnName = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
    const providers = await getActiveProvidersFor(admin, 'image');

    const { data: gen, error: fnErr } = await admin.functions.invoke(fnName, {
      body: {
        kind: 'image_generate',
        requestType: 'image' as RequestType,
        user_id: user.id,
        debate_id: debateId,
        prompt,
        style,
        aspect,
        quality,
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
        asset_type: 'image',
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

