import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getSetting } from '@/lib/settings';

export const runtime = 'nodejs';

function estimateVideoTokens(input: { durationSec?: number }) {
  // Conservative default until provider pricing is wired.
  const duration = Math.max(1, Math.min(30, Number(input.durationSec ?? 6)));
  // Base + per-second.
  return Math.round(30 + duration * 5); // e.g. 6s => 60 tokens
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { debateId, prompt, durationSec, confirmed } = body as {
    debateId?: string;
    prompt?: string;
    durationSec?: number;
    confirmed?: boolean;
  };

  if (!confirmed) {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
  }

  const tokensCost = estimateVideoTokens({ durationSec });

  // Feature flags / retention from settings (best-effort)
  const features = (await getSetting('features').catch(() => null)) as unknown;
  const freeTrialTextOnly = Boolean(features?.free_trial_text_only ?? true);

  // Free trial never allows video
  if (freeTrialTextOnly) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('free_trial_used')
      .eq('id', user.id)
      .maybeSingle();
    if (profile && !profile.free_trial_used) {
      return NextResponse.json({ error: 'Video is not available in the free trial.' }, { status: 403 });
    }
  }

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('token_balance_cents')
    .eq('id', user.id)
    .single();
  if (pErr) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const balance = Number(profile.token_balance_cents ?? 0);
  if (balance < tokensCost) {
    return NextResponse.json(
      { error: 'Insufficient tokens', required: tokensCost, balance },
      { status: 402 }
    );
  }

  // Deduct tokens (atomic-ish via RPC would be better; keep simple with update)
  const { error: uErr } = await supabase
    .from('profiles')
    .update({ token_balance_cents: balance - tokensCost })
    .eq('id', user.id);
  if (uErr) return NextResponse.json({ error: 'Failed to reserve tokens' }, { status: 500 });

  // Call Edge Function to generate video (provider-specific). This is optional; if not configured, we still record the intent.
  const edgeFn = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
  let publicUrl: string | null = null;
  let providerName: string | null = null;
  let storagePath: string | null = null;

  try {
    const { data, error } = await supabase.functions.invoke(edgeFn, {
      body: {
        type: 'video',
        debateId,
        prompt,
        durationSec,
      },
    });
    if (!error && data) {
      publicUrl = data.publicUrl || null;
      providerName = data.providerName || null;
      storagePath = data.storagePath || null;
    }
  } catch {
    // Ignore: Edge function not configured yet.
  }

  const { data: asset, error: aErr } = await supabase
    .from('generated_assets')
    .insert({
      user_id: user.id,
      debate_id: debateId ?? null,
      asset_type: 'video',
      prompt: prompt ?? null,
      provider_name: providerName,
      storage_path: storagePath,
      public_url: publicUrl,
      cost_cents: tokensCost,
    })
    .select()
    .single();

  if (aErr) {
    // Roll back tokens on failure
    await supabase
      .from('profiles')
      .update({ token_balance_cents: balance })
      .eq('id', user.id);
    return NextResponse.json({ error: 'Failed to record asset' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    tokensCost,
    asset,
  });
}
