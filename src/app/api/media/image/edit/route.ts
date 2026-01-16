import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Placeholder image-edit handler: reserves tokens then delegates to a media Edge Function.
// Supports "smart edit" (text-guided) only for now.

function estimateEditTokens(prompt: string) {
  const len = (prompt || '').length;
  return Math.min(45, 10 + Math.ceil(len / 200) * 5);
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { debateId, prompt, sourceImageUrl, confirmed = false } = body || {};
  if (!debateId || !prompt || !sourceImageUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const tokensNeeded = estimateEditTokens(prompt);
  if (!confirmed) return NextResponse.json({ ok: true, tokensNeeded });

  const { data: profile } = await supabase.from('profiles').select('token_balance_cents,free_trial_used').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.free_trial_used) return NextResponse.json({ error: 'Image editing is not available on the free trial.' }, { status: 403 });
  if ((profile.token_balance_cents || 0) < tokensNeeded) return NextResponse.json({ error: 'Insufficient tokens' }, { status: 402 });

  const { data: updated, error: updErr } = await supabase
    .from('profiles')
    .update({ token_balance_cents: (profile.token_balance_cents || 0) - tokensNeeded })
    .eq('id', user.id)
    .select('token_balance_cents')
    .single();
  if (updErr) return NextResponse.json({ error: 'Failed to reserve tokens' }, { status: 500 });

  const fnName = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
  const { data: fnData, error: fnError } = await supabase.functions.invoke(fnName, {
    body: {
      type: 'image_edit',
      prompt,
      sourceImageUrl,
      debateId,
      userId: user.id,
    },
  });

  if (fnError) return NextResponse.json({ error: 'Image editing failed', details: fnError.message }, { status: 502 });

  const { data: asset, error: assetErr } = await supabase
    .from('generated_assets')
    .insert({
      user_id: user.id,
      debate_id: debateId,
      asset_type: 'image',
      prompt,
      provider_name: (fnData as unknown)?.provider || 'unknown',
      storage_path: (fnData as unknown)?.storage_path || null,
      public_url: (fnData as unknown)?.public_url || (fnData as unknown)?.url || null,
      cost_cents: tokensNeeded,
    })
    .select('*')
    .single();

  if (assetErr) return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
  return NextResponse.json({ ok: true, tokensDeducted: tokensNeeded, tokenBalance: updated?.token_balance_cents, asset });
}
