import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { triggerComposerJob, authenticatedFetch } from '@/lib/cloud-run';

type AdminClient = SupabaseClient<Database>;

type PendingRow = {
  id: string;
  kind: string;
  payload: any;
  tokens_required: number;
  expires_at: string;
};

function getAdmin(): AdminClient {
  return createClient<Database>(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function getLatestPending(admin: AdminClient, userId: string): Promise<PendingRow | null> {
  // Using RPC if exists, but falling back to direct query if not, 
  // following the strict snapshot that pending_requests is the source.
  const { data, error } = await admin
    .from('pending_requests')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const d = data as any;
  return {
    id: d.id,
    kind: d.kind ?? '',
    payload: d.payload ?? {},
    tokens_required: d.tokens_required ?? 0,
    expires_at: d.expires_at ?? '',
  };
}

async function reserveTokens(admin: AdminClient, userId: string, tokens: number) {
  if (!tokens || tokens <= 0) return { ok: true };
  const { error } = await (admin.rpc as any)('reserve_tokens', {
    p_user_id: userId,
    p_tokens: tokens,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function runVideoComposeFromPending(admin: AdminClient, userId: string, pending: PendingRow) {
  const debateId = String(pending.payload?.debateId ?? '');
  const assetIds = (pending.payload?.assetIds ?? []) as string[];

  if (!debateId || !assetIds.length) {
    return { ok: false, error: 'Invalid pending payload' };
  }

  if (pending.tokens_required > 0) {
    const r = await reserveTokens(admin, userId, pending.tokens_required);
    if (!r.ok) return { ok: false, error: r.error || 'INSUFFICIENT_TOKENS' };
  }

  const jobId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const outputPath = `${userId}/final/${jobId}.mp4`;

  // 1. Get storage paths for assets
  const { data: assets } = await admin
    .from('generated_assets')
    .select('id, storage_path')
    .eq('user_id', userId)
    .in('id', assetIds);

  const paths = assetIds
    .map((id: string) => (assets ?? []).find((a: any) => a.id === id)?.storage_path)
    .filter((p: any) => typeof p === 'string' && p.length > 0);

  if (!paths.length) return { ok: false, error: 'No source files found' };

  // 2. Generate signed URLs
  const { data: signed } = await admin.storage.from('videos').createSignedUrls(paths, 60 * 60);
  const inputUrls = (signed ?? []).map((x: any) => x?.signedUrl).filter(Boolean);

  // 3. Create video_job record
  const { error: jErr } = await (admin.from('video_jobs') as any).insert({
    id: jobId,
    user_id: userId,
    debate_id: debateId,
    status: 'pending',
    output_url: outputPath
  });
  if (jErr) return { ok: false, error: jErr.message };

  // 4. Create a job_run to track execution with COMPLETE metadata
  const { error: runErr } = await (admin.from('job_runs') as any).insert({
    id: runId,
    video_job_id: jobId,
    run_type: 'compose',
    status: 'starting',
    metadata: {
      ...pending.payload,
      outputPath,
      inputUrls
    }
  });
  if (runErr) return { ok: false, error: runErr.message };

  // 5. Call Cloud Run Job Trigger
  const jobTriggered = await triggerComposerJob(jobId, runId);
  if (jobTriggered) {
    await admin.from('video_jobs').update({ status: 'composing' } as any).eq('id', jobId);
    await admin.from('job_runs').update({ status: 'running' } as any).eq('id', runId);
  } else {
    await admin.from('video_jobs').update({ status: 'failed' } as any).eq('id', jobId);
    await admin.from('job_runs').update({ status: 'failed', error_message: 'Trigger failed' } as any).eq('id', runId);
  }

  // Delete pending request
  await (admin.from('pending_requests') as any).delete().eq('id', pending.id);

  return { ok: true, jobId };
}

async function runVideoGenerateFromPending(admin: AdminClient, userId: string, pending: PendingRow) {
  const debateId = String(pending.payload?.debateId ?? '');
  if (!debateId) return { ok: false, error: 'Invalid pending payload' };

  if (pending.tokens_required > 0) {
    const r = await reserveTokens(admin, userId, pending.tokens_required);
    if (!r.ok) return { ok: false, error: r.error || 'INSUFFICIENT_TOKENS' };
  }

  // Trigger Edge Function
  const fnName = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
  try {
    const { error: fnErr } = await admin.functions.invoke(fnName, {
      body: {
        kind: 'video_generate',
        requestType: 'video',
        user_id: userId,
        debate_id: debateId,
        prompt: pending.payload.prompt,
        durationSec: pending.payload.durationSec,
        aspect: pending.payload.aspect,
      },
    });
    if (fnErr) console.error('[Pending] Video Gen failed:', fnErr);
  } catch (e) {
    console.error('[Pending] Video Gen error:', e);
  }

  await (admin.from('pending_requests') as any).delete().eq('id', pending.id);
  return { ok: true };
}

async function runImageGenerateFromPending(admin: AdminClient, userId: string, pending: PendingRow) {
  const debateId = String(pending.payload?.debateId ?? '');
  if (!debateId) return { ok: false, error: 'Invalid pending payload' };

  if (pending.tokens_required > 0) {
    const r = await reserveTokens(admin, userId, pending.tokens_required);
    if (!r.ok) return { ok: false, error: r.error || 'INSUFFICIENT_TOKENS' };
  }

  // Trigger Edge Function
  const fnName = process.env.MEDIA_EDGE_FUNCTION || 'media-generate';
  try {
    const { error: fnErr } = await admin.functions.invoke(fnName, {
      body: {
        kind: 'image_generate',
        requestType: 'image',
        user_id: userId,
        debate_id: debateId,
        prompt: pending.payload.prompt,
        style: pending.payload.style,
        aspect: pending.payload.aspect,
        quality: pending.payload.quality,
      },
    });
    if (fnErr) console.error('[Pending] Image Gen failed:', fnErr);
  } catch (e) {
    console.error('[Pending] Image Gen error:', e);
  }

  await (admin.from('pending_requests') as any).delete().eq('id', pending.id);
  return { ok: true };
}

export async function processPendingForUser(userId: string) {
  const admin = getAdmin();
  const pending = await getLatestPending(admin, userId);
  if (!pending) return { ok: true, resumed: false };

  // Check expiry
  const expiresAt = new Date(pending.expires_at);
  if (expiresAt <= new Date()) {
    await (admin.from('pending_requests') as any).delete().eq('id', pending.id);
    return { ok: true, resumed: false, expired: true };
  }

  if (pending.kind === 'video_compose') {
    const res = await runVideoComposeFromPending(admin, userId, pending);
    return { ...res, resumed: res.ok };
  }

  if (pending.kind === 'video') {
    const res = await runVideoGenerateFromPending(admin, userId, pending);
    return { ...res, resumed: res.ok };
  }

  if (pending.kind === 'image') {
    const res = await runImageGenerateFromPending(admin, userId, pending);
    return { ...res, resumed: res.ok };
  }

  return { ok: true, resumed: false, kind: pending.kind };
}

