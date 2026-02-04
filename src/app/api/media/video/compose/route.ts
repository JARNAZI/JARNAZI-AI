import { NextResponse } from 'next/server';
import { createClient as createBrowserServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { triggerComposerJob, authenticatedFetch } from '@/lib/cloud-run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

type VideoCostRate = { cost_per_unit: number; unit: string } | null;

async function getActiveComposeCostRate(admin: any): Promise<VideoCostRate> {
  const { data, error } = await admin
    .from('ai_costs')
    .select('cost_per_unit, unit')
    .eq('is_active', true)
    .eq('cost_type', 'video_compose')
    .order('cost_per_unit', { ascending: true })
    .limit(1);

  if (error) return null;
  const row = Array.isArray(data) && data.length ? data[0] : null;
  if (!row) return null;
  const cpu = Number(row.cost_per_unit);
  const unit = String(row.unit ?? '').trim();
  if (!Number.isFinite(cpu) || cpu <= 0 || !unit) return null;
  return { cost_per_unit: cpu, unit };
}

function calcTokensFromRate(durationSec: number, rate: { cost_per_unit: number; unit: string }) {
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

async function bestEffortSaveCanonToDb(admin: any, jobId: string, canon: any | null) {
  if (!canon) return;
  try {
    const locIdByName = new Map<string, string>();

    async function ensureLocation(loc: any): Promise<string | null> {
      if (!loc?.name) return null;
      const key = String(loc.name).trim().toLowerCase();
      if (locIdByName.has(key)) return locIdByName.get(key)!;
      const { data, error } = await admin
        .from('story_entities')
        .insert({
          video_job_id: jobId,
          type: 'location',
          name: String(loc.name),
          description: String(loc.description ?? ''),
        })
        .select('id')
        .maybeSingle();
      if (error) return null;
      const id = data?.id;
      if (id) locIdByName.set(key, id);
      return id ?? null;
    }

    if (Array.isArray(canon.locations)) {
      for (const loc of canon.locations) await ensureLocation(loc);
    }

    if (Array.isArray(canon.characters)) {
      for (const ch of canon.characters) {
        if (!ch?.name) continue;
        const homeId = await ensureLocation(ch.home);
        const workId = await ensureLocation(ch.work);

        const { data: chRow } = await admin
          .from('story_entities')
          .insert({
            video_job_id: jobId,
            type: 'character',
            name: String(ch.name),
            description: String(ch.description ?? ''),
          })
          .select('id')
          .maybeSingle();

        const chId = chRow?.id;
        if (!chId) continue;

        if (homeId) {
          await admin.from('story_entity_links').insert({
            video_job_id: jobId,
            from_entity_id: chId,
            to_entity_id: homeId,
            relation_type: 'home',
          });
        }
        if (workId) {
          await admin.from('story_entity_links').insert({
            video_job_id: jobId,
            from_entity_id: chId,
            to_entity_id: workId,
            relation_type: 'work',
          });
        }
      }
    }
  } catch {
    // ignore
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createBrowserServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const debateId: string | null = body?.debateId ?? null;
    const assetIds: string[] = Array.isArray(body?.assetIds) ? body.assetIds.map(String) : [];
    const durationSecFromClient = Number(body?.durationSec ?? NaN);

    if (!debateId || !assetIds.length) {
      return NextResponse.json({ error: 'Missing debateId or assetIds' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Idempotency check: Don't start a new job if one is already active for this debate
    const { data: existingActiveJob } = await admin
      .from('video_jobs')
      .select('id, status')
      .eq('debate_id', debateId)
      .in('status', ['composing', 'pending'])
      .maybeSingle();

    if (existingActiveJob) {
      console.log(`[Idempotency] Active job already exists for debate ${debateId}: ${existingActiveJob.id}`);
      return NextResponse.json({ ok: true, jobId: existingActiveJob.id, status: existingActiveJob.status, alreadyRunning: true }, { status: 200 });
    }

    let requiredTokens = 0;
    try {
      const rate = await getActiveComposeCostRate(admin);
      if (rate) {
        const estDurationSec = Number.isFinite(durationSecFromClient) && durationSecFromClient > 0
          ? durationSecFromClient
          : assetIds.length * 600;
        const t = calcTokensFromRate(estDurationSec, rate);
        if (t) requiredTokens = t;
      }
    } catch { }

    if (requiredTokens > 0) {
      console.log(`[TokenCheck] User ${user.id} needs ${requiredTokens} tokens for compose job`);
      const { data: prof } = await admin
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .maybeSingle();

      const tokenBalance = Number(prof?.token_balance ?? 0);
      console.log(`[TokenCheck] Current balance for ${user.id}: ${tokenBalance}`);

      if (tokenBalance < requiredTokens) {
        console.warn(`[TokenCheck] Insufficient tokens. Needed: ${requiredTokens}, Has: ${tokenBalance}`);
        return NextResponse.json({ error: 'INSUFFICIENT_TOKENS', tokensNeeded: requiredTokens, tokenBalance }, { status: 402 });
      }

      console.log(`[TokenDebit] Atomically reserving ${requiredTokens} tokens for user ${user.id}`);
      const { error: rErr } = await admin.rpc('reserve_tokens', {
        p_user_id: user.id,
        p_tokens: requiredTokens,
      });
      if (rErr) {
        console.error(`[TokenDebit] Failed to reserve tokens: ${rErr.message}`);
        return NextResponse.json({ error: rErr.message }, { status: 500 });
      }
      console.log(`[TokenDebit] Successfully reserved ${requiredTokens} tokens (once)`);
    } else {
      console.log(`[TokenCheck] No tokens required for this compose request`);
    }

    const { data: assets, error: aErr } = await admin
      .from('generated_assets')
      .select('id, storage_path')
      .eq('user_id', user.id)
      .eq('debate_id', debateId)
      .eq('asset_type', 'video')
      .in('id', assetIds);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
    const paths = (assets ?? [])
      .map((a: any) => a?.storage_path)
      .filter((p: any) => typeof p === 'string' && p.length > 0);

    if (!paths.length) return NextResponse.json({ error: 'No storage paths found' }, { status: 400 });

    const { data: signed, error: sErr } = await admin.storage.from('videos').createSignedUrls(paths, 60 * 60);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    const inputUrls = (signed ?? []).map((x: any) => x?.signedUrl).filter(Boolean);
    const jobId = crypto.randomUUID();
    const outputPath = `${user.id}/final/${jobId}.mp4`;

    const { error: jErr } = await admin.from('video_jobs').insert({
      id: jobId,
      user_id: user.id,
      debate_id: debateId,
      status: 'pending',
      output_url: outputPath
    });

    if (jErr) {
      console.error(`[DB] Failed to create video_job: ${jErr.message}`);
      return NextResponse.json({ error: jErr.message }, { status: 500 });
    }

    const runId = crypto.randomUUID();
    const { error: runErr } = await admin.from('job_runs').insert({
      id: runId,
      video_job_id: jobId,
      run_type: 'compose',
      status: 'starting',
      cloud_run_job_name: 'jarnazi-composer-job',
      metadata: { debateId, assetIds, outputPath, inputUrls }
    } as any);

    if (runErr) {
      console.warn(`[DB] Failed to create job_run record: ${runErr.message}`);
      // Continue anyway, but log it
    }

    await bestEffortSaveCanonToDb(admin, jobId, body?.canon);

    const composerUrl = process.env.COMPOSER_BASE_URL;
    const composerSecret = process.env.CLOUD_RUN_COMPOSER_SECRET;

    if (!composerUrl) {
      console.error('[Composer] COMPOSER_BASE_URL is not defined');
      await admin.from('video_jobs').update({ status: 'failed' }).eq('id', jobId);
      return NextResponse.json({ error: 'Composer service not configured' }, { status: 500 });
    }

    console.log(`[Composer] Initiating connection to jarnazi-composer at: ${composerUrl}`);

    let dispatchOk = false;
    try {
      const dispatch = await authenticatedFetch(`${composerUrl.replace(/\/$/, '')}/compose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(composerSecret ? { 'X-Composer-Secret': composerSecret } : {}),
        },
        body: JSON.stringify({ jobId, inputUrls, outputPath }),
      });

      if (dispatch.ok) {
        dispatchOk = true;
      }
    } catch (err) {
      console.error(`[Composer] Failed to reach service:`, err);
    }

    // Trigger Cloud Run Job
    console.log(`[CloudRunJob] Triggering jarnazi-composer-job for jobId: ${jobId}, runId: ${runId}`);
    const jobTriggered = await triggerComposerJob(jobId, runId);

    if (jobTriggered) {
      console.log(`[CloudRunJob] Cloud Run Job triggered SUCCESSFULLY for jobId: ${jobId}`);
      await admin.from('video_jobs').update({ status: 'composing' }).eq('id', jobId);
      if (runId) await admin.from('job_runs').update({ status: 'running' }).eq('id', runId);
    } else {
      console.error(`[CloudRunJob] Cloud Run Job trigger FAILED for jobId: ${jobId}`);
      await admin.from('video_jobs').update({ status: 'failed' }).eq('id', jobId);
      if (runId) await admin.from('job_runs').update({ status: 'failed', error_message: 'Trigger failed' }).eq('id', runId);
    }

    if (!dispatchOk && !jobTriggered) {
      return NextResponse.json({ error: 'Composer dispatch and Job trigger failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, jobId, runId, outputPath, jobTriggered }, { status: 202 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
