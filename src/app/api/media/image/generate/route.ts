import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple server-side estimate for image generation cost in TOKENS.
// We keep this conservative and stable; you can tune later via site_settings.
function estimateImageTokens({ quality }: { quality?: string }) {
  // baseline for a single HQ image
  const base = 18;
  const q = (quality || '').toLowerCase();
  if (q.includes('high') || q.includes('hq')) return base + 12;
  return base;
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
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
    if (!prompt || prompt.trim().length < 3) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    // Load feature flags
    const { data: featuresRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'features')
      .maybeSingle();
    const features = (featuresRow?.value ?? {}) as unknown;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('token_balance_cents, free_trial_used')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

    // Free trial is text-only (when enabled).
    if (features?.free_trial_enabled && !profile?.free_trial_used) {
      return NextResponse.json(
        { error: 'Free trial is text-only. Buy tokens to generate images.' },
        { status: 403 }
      );
    }

    const tokensNeeded = estimateImageTokens({ quality });

    if (!profile || (profile.token_balance_cents ?? 0) < tokensNeeded) {
      return NextResponse.json(
        { error: 'Insufficient tokens', tokensNeeded, tokenBalance: profile?.token_balance_cents ?? 0 },
        { status: 402 }
      );
    }

    // Deduct tokens atomically
    const { data: updated, error: updErr } = await supabase
      .from('profiles')
      .update({ token_balance_cents: (profile.token_balance_cents ?? 0) - tokensNeeded })
      .eq('id', user.id)
      .select('token_balance_cents')
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Call a single edge function responsible for generation.
    // Expected to return { public_url, storage_path, provider_name }.
    const fnName = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
    const { data: gen, error: fnErr } = await supabase.functions.invoke(fnName, {
      body: {
        kind: 'image_generate',
        user_id: user.id,
        debate_id: debateId,
        prompt,
        style,
        aspect,
        quality,
      },
    });

    if (fnErr) {
      // Refund on failure
      await supabase
        .from('profiles')
        .update({ token_balance_cents: (updated?.token_balance_cents ?? 0) + tokensNeeded })
        .eq('id', user.id);
      return NextResponse.json({ error: fnErr.message || 'Generation failed' }, { status: 500 });
    }

    const public_url = gen?.public_url ?? null;
    const storage_path = gen?.storage_path ?? null;
    const provider_name = gen?.provider_name ?? gen?.provider ?? 'unknown';

    // Persist asset record (3-day cleanup handled by cron/retention job)
    const { data: asset, error: assetErr } = await supabase
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
      })
      .select('*')
      .single();

    if (assetErr) return NextResponse.json({ error: assetErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, tokensDeducted: tokensNeeded, tokenBalance: updated?.token_balance_cents, asset });
  } catch (e: unknown) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
