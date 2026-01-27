import { NextResponse } from 'next/server';

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 14,
  producer: 50,
  creator: 330,
};

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const planId = String(body?.planId ?? '').trim();
    const amount = PLAN_AMOUNTS[planId];

    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Reuse the new token checkout endpoint
    const res = await fetch(new URL('/api/buy-tokens/checkout', req.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: req.headers.get('authorization') ?? '',
      },
      body: JSON.stringify({ amount, lang: body?.lang }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
