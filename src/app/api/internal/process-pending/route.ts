import { NextResponse } from 'next/server';
import { processPendingForUser } from '@/lib/pending/processPending';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-secret') || '';
  const expected = process.env.INTERNAL_WEBHOOK_SECRET || '';
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const userId = String(body?.userId ?? '');
  if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });

  const res = await processPendingForUser(userId);
  return NextResponse.json(res);
}
