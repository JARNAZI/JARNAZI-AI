import { NextResponse } from 'next/server';
import { createClient as createBrowserServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const supabase = await createBrowserServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId') ?? '';
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: row, error } = await admin
      .from('video_jobs')
      .select('status,final_path,error')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const status = (row as any).status ?? 'unknown';
    const finalPath = (row as any).final_path ?? null;

    let downloadUrl: string | null = null;
    if (status === 'done' && finalPath) {
      const { data: signed, error: sErr } = await admin.storage.from('videos').createSignedUrl(finalPath, 60 * 30);
      if (!sErr) downloadUrl = (signed as any)?.signedUrl ?? null;
    }

    return NextResponse.json({
      ok: true,
      status,
      error: (row as any).error ?? null,
      finalPath,
      downloadUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

