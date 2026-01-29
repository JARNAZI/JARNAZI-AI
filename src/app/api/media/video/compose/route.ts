import { NextResponse } from 'next/server';
import { createClient as createBrowserServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

type VideoCostRate = { cost_per_unit: number; unit: string } | null;

async function getActiveComposeCostRate(admin: ReturnType<typeof getSupabaseAdmin>): Promise<VideoCostRate> {
  const { data, error } = await admin
    .from('ai_costs')
    .select('cost_per_unit, unit')
    .eq('is_active', true)
    .eq('cost_type', 'video_compose')
    .order('cost_per_unit', { ascending: true })
    .limit(1);

  if (error) return null;
  const row = Array.isArray(data) && data.length ? (data as any)[0] : null;
  if (!row) return null;
  const cpu = Number(row.cost_per_unit);
  const unit = String(row.unit ?? '').trim();
  if (!Number.isFinite(cpu) || cpu <= 0 || !unit) return null;
  return { cost_per_unit: cpu, unit };
}

function calcTokensFromRate(durationSec: number, rate: { cost_per_unit: number; unit: string }) {
  // Admin enters REAL cost. We charge: sell_cost = real_cost / 0.75 (75% cost, 25% profit)
  // Token price fixed: 42 tokens = $14 => tokens_per_usd = 3
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

function parseCanonFromSummary(summary: string | null | undefined): any | null {
  if (!summary) return null;
  const m = summary.match(/CANON_JSON:\s*```json\s*([\s\S]*?)\s*```/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

type CanonInput = {
  characters?: Array<{
    name: string;
    description?: string;
    attributes?: any;
    home?: { name: string; description?: string; attributes?: any };
    work?: { name: string; description?: string; attributes?: any };
  }>;
  locations?: Array<{ name: string; description?: string; attributes?: any }>;
  style?: any;
};

async function bestEffortSaveCanonToDb(admin: any, jobId: string, canon: CanonInput | null) {
  if (!canon) return;
  try {
    // Create location entities map
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
          attributes: loc.attributes ?? {},
        } as any)
        .select('id')
        .maybeSingle();
      if (error) return null;
      const id = (data as any)?.id as string | undefined;
      if (id) locIdByName.set(key, id);
      return id ?? null;
    }

    // Insert style (optional)
    if (canon.style) {
      await admin.from('story_entities').insert({
        video_job_id: jobId,
        type: 'style',
        name: 'Style',
        description: '',
        attributes: canon.style ?? {},
      } as any);
    }

    // Insert extra locations
    if (Array.isArray(canon.locations)) {
      for (const loc of canon.locations) await ensureLocation(loc);
    }

    // Insert characters + home/work links
    if (Array.isArray(canon.characters)) {
      for (const ch of canon.characters) {
        if (!ch?.name) continue;

        // ensure home/work locations exist
        const homeId = await ensureLocation(ch.home);
        const workId = await ensureLocation(ch.work);

        const { data: chRow } = await admin
          .from('story_entities')
          .insert({
            video_job_id: jobId,
            type: 'character',
            name: String(ch.name),
            description: String(ch.description ?? ''),
            attributes: {
              ...(ch.attributes ?? {}),
              home_location_id: homeId,
              work_location_id: workId,
              home_location_name: ch.home?.name ?? null,
              work_location_name: ch.work?.name ?? null,
            },
          } as any)
          .select('id')
          .maybeSingle();

        const chId = (chRow as any)?.id as string | undefined;
        if (!chId) continue;

        // Insert link rows if the links table exists. If not, skip quietly.
        if (homeId) {
          await admin.from('story_entity_links').insert({
            video_job_id: jobId,
            from_entity_id: chId,
            to_entity_id: homeId,
            link_type: 'home',
          } as any);
        }
        if (workId) {
          await admin.from('story_entity_links').insert({
            video_job_id: jobId,
            from_entity_id: chId,
            to_entity_id: workId,
            link_type: 'work',
          } as any);
        }
      }
    }
  } catch {
    // ignore - never block compose
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createBrowserServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const canonFromClient = (body?.canon ?? null) as any | null;
    const debateId: string | null = body?.debateId ?? null;
    const assetIds: string[] = Array.isArray(body?.assetIds) ? body.assetIds.map(String) : [];
    const durationSecFromClient = Number(body?.durationSec ?? NaN);

    if (!debateId || !assetIds.length) {
      return NextResponse.json({ error: 'Missing debateId or assetIds' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // ---- Token gate (optional): video_compose cost_type
    // If no active cost is configured, compose is free.
    let requiredTokens = 0;
    let reservedTokens = 0;
    try {
      const rate = await getActiveComposeCostRate(admin);
      if (rate) {
        const estDurationSec = Number.isFinite(durationSecFromClient) && durationSecFromClient > 0
          ? durationSecFromClient
          : assetIds.length * 600; // conservative fallback
        const t = calcTokensFromRate(estDurationSec, rate);
        if (typeof t === 'number' && Number.isFinite(t) && t > 0) requiredTokens = t;
      }
    } catch {
      // ignore: fallback to free
    }

    if (requiredTokens > 0) {
      const { data: prof, error: pErr } = await admin
        .from('profiles')
        .select('token_balance_cents')
        .eq('id', user.id)
        .maybeSingle();

      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

      const tokenBalance = Number((prof as any)?.token_balance_cents ?? 0);
      const missingTokens = Math.max(0, requiredTokens - tokenBalance);

      if (missingTokens > 0) {
        // create pending request for "buy then resume"
        const payload = { debateId, assetIds, durationSec: Number.isFinite(durationSecFromClient) ? durationSecFromClient : null };
        try {
          const { data: pendingId, error: pendErr } = await admin.rpc('create_pending_request', {
            p_user_id: user.id,
            p_kind: 'video_compose',
            p_payload: payload,
            p_required_tokens: requiredTokens,
            p_missing_tokens: missingTokens,
            p_ttl_minutes: 10,
          } as any);

          if (!pendErr && pendingId) {
            const { data: latest } = await admin.rpc('get_latest_pending', { p_user_id: user.id } as any);
            const expiresAt = Array.isArray(latest) && latest.length ? (latest[0] as any).expires_at : null;

            return NextResponse.json(
              {
                error: 'INSUFFICIENT_TOKENS',
                tokensNeeded: requiredTokens,
                tokenBalance,
                missingTokens,
                pendingId,
                expiresAt,
              },
              { status: 402 }
            );
          }
        } catch {
          // ignore
        }

        return NextResponse.json(
          { error: 'INSUFFICIENT_TOKENS', tokensNeeded: requiredTokens, tokenBalance, missingTokens },
          { status: 402 }
        );
      }

      // Reserve tokens atomically
      const { data: ok, error: rErr } = await admin.rpc('reserve_tokens', {
        p_user_id: user.id,
        p_tokens: requiredTokens,
        p_reason: 'video_compose',
        p_meta: { debateId, assetCount: assetIds.length },
      } as any);

      if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });
      if (!ok) return NextResponse.json({ error: 'INSUFFICIENT_TOKENS', tokensNeeded: requiredTokens, tokenBalance }, { status: 402 });


      reservedTokens = requiredTokens;
    }

    // Fetch storage paths for the requested segment assets
    const { data: assets, error: aErr } = await admin
      .from('generated_assets')
      .select('id,storage_path,meta')
      .eq('user_id', user.id)
      .eq('debate_id', debateId)
      .eq('asset_type', 'video')
      .in('id', assetIds);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
    const paths = (assets ?? [])
      .map((a: any) => a?.storage_path)
      .filter((p: any) => typeof p === 'string' && p.length > 0);

    if (!paths.length) {
      return NextResponse.json({ error: 'No storage paths found for assets' }, { status: 400 });
    }

    // Create short-lived signed URLs for composer to download the segments.
    const { data: signed, error: sErr } = await admin.storage.from('videos').createSignedUrls(paths, 60 * 60);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    const inputUrls = (signed ?? [])
      .map((x: any) => x?.signedUrl)
      .filter((u: any) => typeof u === 'string' && u.length > 0);

    if (!inputUrls.length) return NextResponse.json({ error: 'Failed to sign segment urls' }, { status: 500 });

    const jobId = crypto.randomUUID();
    const outputPath = `${user.id}/final/${jobId}.mp4`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    // Create job row in video_jobs (preferred)
    const { error: jErr } = await admin.from('video_jobs').insert({
      id: jobId,
      user_id: user.id,
      status: 'running',
      source_asset_ids: assetIds,
      source_count: assetIds.length,
      final_path: outputPath,
      tokens_reserved: reservedTokens,
      refunded: false,
      expires_at: expiresAt,
    } as any);

    if (jErr) return NextResponse.json({ error: jErr.message }, { status: 500 });

    // Best-effort: extract CANON_JSON from debate summary if client didn't send it
    let canonToSave: any | null = canonFromClient;
    if (!canonToSave) {
      try {
        const { data: drow } = await admin.from('debates').select('summary').eq('id', debateId).maybeSingle();
        canonToSave = parseCanonFromSummary((drow as any)?.summary ?? null);
      } catch {
        canonToSave = null;
      }
    }
    await bestEffortSaveCanonToDb(admin, jobId, canonToSave);



    const composerUrl = process.env.CLOUD_RUN_COMPOSER_URL;
    const composerSecret = process.env.CLOUD_RUN_COMPOSER_SECRET;

    if (!composerUrl || !composerSecret) {
      // refund reserved tokens (if any)
      if (reservedTokens > 0) {
        await admin.rpc('refund_tokens', { p_user_id: user.id, p_tokens: reservedTokens, p_reason: 'video_compose_failed', p_meta: { jobId } } as any);
      }
      await (admin.from('video_jobs') as any).update({ status: 'failed', refunded: reservedTokens > 0, error: 'Missing CLOUD_RUN_COMPOSER_URL/SECRET' }).eq('id', jobId);
      return NextResponse.json({ error: 'Composer service is not configured' }, { status: 500 });
    }

    // Dispatch composition (composer will update video_jobs when done)
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
      if (reservedTokens > 0) {
        await admin.rpc('refund_tokens', { p_user_id: user.id, p_tokens: reservedTokens, p_reason: 'video_compose_failed', p_meta: { jobId, stage: 'dispatch' } } as any);
      }
      await (admin.from('video_jobs') as any).update({ status: 'failed', refunded: reservedTokens > 0, error: `Composer dispatch failed: ${dispatch.status} ${t}` }).eq('id', jobId);
      return NextResponse.json({ error: 'Composer dispatch failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, jobId, outputPath }, { status: 202 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
