import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getSupabaseAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function inferKindFromMime(mime: string): 'image' | 'video' | 'file' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'file';
}

// POST multipart/form-data: file=<File>
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

    if (!jwt) {
      return NextResponse.json({ error: 'Missing Authorization Bearer token' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userRes, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let file: File | null = null;
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';

    if (isJson) {
      const body = await req.json();
      fileName = body.fileName;
      fileSize = body.fileSize;
      mimeType = body.mimeType;
      if (!fileName || !fileSize) return NextResponse.json({ error: 'Missing file info' }, { status: 400 });
    } else {
      const form = await req.formData();
      file = form.get('file') as File | null;
      if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
    }

    const bucket = 'videos'; // reuse existing bucket
    const kind = inferKindFromMime(mimeType || '');
    const safeName = sanitizeFileName(fileName || 'upload.bin');
    const path = `user_uploads/${userRes.user.id}/${Date.now()}_${safeName}`;

    // --- Token Charging Logic for Uploads ---
    const sizeMb = fileSize / (1024 * 1024);
    let tokensNeeded = 0;
    if (kind !== 'image') {
      tokensNeeded = Math.max(1000, Math.ceil(sizeMb / 10) * 1000);
    }

    const { data: profile } = await supabase.from('profiles').select('token_balance, free_trial_used').eq('id', userRes.user.id).single();
    const currentBalance = Number(profile?.token_balance || 0);

    const { data: stData } = await supabase.from('site_settings').select('value').eq('key', 'enable_free_trial').maybeSingle();
    const enableFreeTrial = (stData as any)?.value === 'true';

    // Free trial users cannot upload media, block them if they haven't bought tokens yet.
    if (enableFreeTrial && !profile?.free_trial_used) {
      return NextResponse.json({ error: 'FREE_TRIAL_TEXT_ONLY', message: 'Free trial is text-only. Buy tokens to upload media.' }, { status: 403 });
    }

    if (tokensNeeded > 0) {
      if (currentBalance < tokensNeeded) {
        return NextResponse.json({
          error: 'INSUFFICIENT_TOKENS',
          missingTokens: tokensNeeded - currentBalance,
          requiredTokens: tokensNeeded
        }, { status: 402 });
      }

      // Reserve tokens
      const { error: reserveErr } = await supabase.rpc('reserve_tokens', { p_user_id: userRes.user.id, p_tokens: tokensNeeded });
      if (reserveErr) {
        return NextResponse.json({ error: 'Failed to reserve tokens for upload' }, { status: 402 });
      }
    }
    // ----------------------------------------

    // IF JSON, generate signed upload URL (Bypass 100MB server payload limit)
    if (isJson) {
      const { data: uploadData, error: signErr } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

      if (signErr || !uploadData) {
        if (tokensNeeded > 0) await supabase.rpc('refund_tokens', { p_user_id: userRes.user.id, p_tokens: tokensNeeded });
        return NextResponse.json({ error: `Create upload url failed: ${signErr?.message || 'unknown'}` }, { status: 500 });
      }

      const { data: signedDownload } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 3);

      return NextResponse.json({
        ok: true,
        bucket,
        path,
        kind,
        mime: mimeType || 'application/octet-stream',
        filename: safeName,
        token: uploadData.token, // Upload token for JS client
        signedUploadUrl: uploadData.signedUrl,
        signedDownloadUrl: signedDownload?.signedUrl, // For read access later
        tokensDeducted: tokensNeeded
      });
    }

    // IF FORM DATA (Legacy route for smaller files)
    const buf = Buffer.from(await file!.arrayBuffer());

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, buf, {
      contentType: mimeType || 'application/octet-stream',
      upsert: false,
    });

    // If upload fails, try to refund tokens
    if (upErr) {
      if (tokensNeeded > 0) {
        await supabase.rpc('refund_tokens', { p_user_id: userRes.user.id, p_tokens: tokensNeeded });
      }
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    }

    // Signed URL valid for 3 days
    const { data: signed, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 3);
    if (sErr || !signed?.signedUrl) {
      return NextResponse.json({ error: `Signed URL failed: ${sErr?.message || 'unknown'}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      bucket,
      path,
      kind,
      mime: mimeType || 'application/octet-stream',
      filename: safeName,
      signedUrl: signed.signedUrl,
      tokensDeducted: tokensNeeded
    });
  } catch (err: any) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
