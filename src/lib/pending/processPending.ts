import { createClient } from '@supabase/supabase-js';

type AdminClient = ReturnType<typeof createClient>;

type PendingRow = {
  id: string;
  kind: string;
  payload: any;
  required_tokens: number;
  missing_tokens: number;
  status: string;
  expires_at: string;
};

function getAdmin(): AdminClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function getLatestPending(admin: AdminClient, userId: string): Promise<PendingRow | null> {
  const { data, error } = await admin.rpc('get_latest_pending', { p_user_id: userId } as any);
  if (error) return null;
  // Supabase RPC can return an array or a single object depending on function; handle both.
  const row = Array.isArray(data) ? (data[0] as any) : (data as any);
  if (!row || !row.id) return null;
  return {
    id: String(row.id),
    kind: String(row.kind ?? ''),
    payload: row.payload ?? {},
    required_tokens: Number(row.required_tokens ?? 0),
    missing_tokens: Number(row.missing_tokens ?? 0),
    status: String(row.status ?? ''),
    expires_at: String(row.expires_at ?? ''),
  };
}

async function reserveTokens(admin: AdminClient, userId: string, tokens: number, reason: string, meta: any) {
  if (!tokens || tokens <= 0) return { ok: true };
  const { data: ok, error } = await admin.rpc('reserve_tokens', {
    p_user_id: userId,
    p_tokens: tokens,
    p_reason: reason,
    p_meta: meta ?? {},
  } as any);
  if (error) return { ok: false, error: error.message };
  if (!ok) return { ok: false, error: 'INSUFFICIENT_TOKENS' };
  return { ok: true };
}

async function runVideoComposeFromPending(admin: AdminClient, userId: string, pending: PendingRow) {
  const debateId = String(pending.payload?.debateId ?? '');
  const assetIds: string[] = Array.isArray(pending.payload?.assetIds) ? pending.payload.assetIds.map(String) : [];
  const durationSec = Number(pending.payload?.durationSec ?? NaN);

  if (!debateId || assetIds.length === 0) {
    return { ok: false, error: 'Invalid pending payload for video_compose' };
  }

  // Ensure user has tokens now; reserve the required amount
  if (pending.required_tokens > 0) {
    const r = await reserveTokens(admin, userId, pending.required_tokens, 'video_compose', { debateId, assetCount: assetIds.length, pendingId: pending.id });
    if (!r.ok) return { ok: false, error: r.error || 'INSUFFICIENT_TOKENS' };
  }

  // Fetch storage paths for segment assets
  const { data: assets, error: aErr } = await admin
    .from('generated_assets')
    .select('id,storage_path')
    .eq('user_id', userId)
    .eq('debate_id', debateId)
    .eq('asset_type', 'video')
    .in('id', assetIds);

  if (aErr) return { ok: false, error: aErr.message };

  const paths = (assets ?? [])
    .map((a: any) => a?.storage_path)
    .filter((p: any) => typeof p === 'string' && p.length > 0);

  if (!paths.length) return { ok: false, error: 'No storage paths found for assets' };

  // Sign URLs for composer
  const { data: signed, error: sErr } = await admin.storage.from('videos').createSignedUrls(paths, 60 * 60);
  if (sErr) return { ok: false, error: sErr.message };

  const inputUrls = (signed ?? [])
    .map((x: any) => x?.signedUrl)
    .filter((u: any) => typeof u === 'string' && u.length > 0);

  if (!inputUrls.length) return { ok: false, error: 'Failed to sign segment urls' };

  const jobId = crypto.randomUUID();
  const outputPath = `${userId}/final/${jobId}.mp4`;
  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  // Create job row
  const { error: jErr } = await admin.from('video_jobs').insert({
    id: jobId,
    user_id: userId,
    status: 'running',
    source_asset_ids: assetIds,
    source_count: assetIds.length,
    final_path: outputPath,
    tokens_reserved: pending.required_tokens > 0 ? pending.required_tokens : 0,
    refunded: false,
    expires_at: expiresAt,
  } as any);
  if (jErr) return { ok: false, error: jErr.message };

  const composerUrl = process.env.CLOUD_RUN_COMPOSER_URL;
  const composerSecret = process.env.CLOUD_RUN_COMPOSER_SECRET;
  if (!composerUrl || !composerSecret) {
    // mark job failed
    await admin.from('video_jobs').update({ status: 'failed', error: 'Missing CLOUD_RUN_COMPOSER_URL/SECRET' }).eq('id', jobId);
    return { ok: false, error: 'Composer not configured' };
  }

  const dispatch = await fetch(`${composerUrl.replace(/\/$/, '')}/compose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Composer-Secret': composerSecret,
    },
    body: JSON.stringify({ jobId, inputUrls, outputPath }),
  });

  if (!dispatch.ok) {
    const t = await dispatch.text().catch(() => '');
    await admin.from('video_jobs').update({ status: 'failed', error: `Composer dispatch failed: ${dispatch.status} ${t}` }).eq('id', jobId);
    return { ok: false, error: 'Composer dispatch failed' };
  }

  // Mark pending as done (job created)
  await admin.from('pending_requests').update({ status: 'done', last_error: `job:${jobId}` }).eq('id', pending.id);

  return { ok: true, jobId, outputPath };
}

/**
 * Attempt to resume the latest pending request for a user, server-side.
 * This is safe to call from payment webhooks.
 */
export async function processPendingForUser(userId: string) {
  const admin = getAdmin();
  const pending = await getLatestPending(admin, userId);
  if (!pending) return { ok: true, resumed: false };

  // Avoid running expired items
  const exp = Date.parse(pending.expires_at);
  if (Number.isFinite(exp) && exp <= Date.now()) {
    await admin.from('pending_requests').update({ status: 'expired' }).eq('id', pending.id);
    return { ok: true, resumed: false, expired: true };
  }

  if (pending.kind === 'video_compose') {
    const res = await runVideoComposeFromPending(admin, userId, pending);
    return { ...res, resumed: res.ok };
  }

  // Other kinds can be added later
  return { ok: true, resumed: false, kind: pending.kind };
}
