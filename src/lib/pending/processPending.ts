import { createClient } from '@supabase/supabase-js';

type AdminClient = ReturnType<typeof createClient>;

type PendingRow = {
  id: string;
  kind: string;
  payload: any;
  tokens_required: number;
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
  return {
    id: data.id,
    kind: data.kind ?? '',
    payload: data.payload ?? {},
    tokens_required: data.tokens_required ?? 0,
    expires_at: data.expires_at ?? '',
  };
}

async function reserveTokens(admin: AdminClient, userId: string, tokens: number) {
  if (!tokens || tokens <= 0) return { ok: true };
  const { error } = await admin.rpc('reserve_tokens', {
    p_user_id: userId,
    p_tokens: tokens,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function runVideoComposeFromPending(admin: AdminClient, userId: string, pending: PendingRow) {
  const debateId = String(pending.payload?.debateId ?? '');

  if (!debateId) {
    return { ok: false, error: 'Invalid pending payload' };
  }

  if (pending.tokens_required > 0) {
    const r = await reserveTokens(admin, userId, pending.tokens_required);
    if (!r.ok) return { ok: false, error: r.error || 'INSUFFICIENT_TOKENS' };
  }

  const jobId = crypto.randomUUID();

  // Create video_job record first
  const { error: jErr } = await admin.from('video_jobs').insert({
    id: jobId,
    user_id: userId,
    debate_id: debateId,
    status: 'pending'
  });
  if (jErr) return { ok: false, error: jErr.message };

  // Create a job_run to track execution
  const { error: runErr } = await admin.from('job_runs').insert({
    video_job_id: jobId,
    run_type: 'compose',
    status: 'starting',
    metadata: pending.payload
  });
  if (runErr) return { ok: false, error: runErr.message };

  // Delete pending request as it is now processed (since status col is missing)
  await admin.from('pending_requests').delete().eq('id', pending.id);

  return { ok: true, jobId };
}

export async function processPendingForUser(userId: string) {
  const admin = getAdmin();
  const pending = await getLatestPending(admin, userId);
  if (!pending) return { ok: true, resumed: false };

  // Check expiry
  if (new Date(pending.expires_at) <= new Date()) {
    await admin.from('pending_requests').delete().eq('id', pending.id);
    return { ok: true, resumed: false, expired: true };
  }

  if (pending.kind === 'video_compose' || pending.kind === 'video') {
    const res = await runVideoComposeFromPending(admin, userId, pending);
    return { ...res, resumed: res.ok };
  }

  return { ok: true, resumed: false, kind: pending.kind };
}
