import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const bucket = 'videos'; // reuse existing bucket
    const kind = inferKindFromMime(file.type || '');
    const safeName = sanitizeFileName(file.name || 'upload.bin');
    const path = `user_uploads/${userRes.user.id}/${Date.now()}_${safeName}`;

    const buf = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, buf, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

    if (upErr) {
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
      mime: file.type,
      size: file.size,
      signedUrl: signed.signedUrl,
      filename: safeName,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
