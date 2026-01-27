import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { amountToTokens, isValidPurchaseAmount, normalizeAmount } from '@/lib/tokens';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_LIVE_KEY || process.env.STRIPE_TEST_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = normalizeAmount(body?.amount);
    const returnToRaw = typeof body?.returnTo === 'string' ? body.returnTo : null;
    const pendingId = typeof body?.pendingId === 'string' ? body.pendingId : null;
    const returnTo = returnToRaw && returnToRaw.startsWith('/') ? returnToRaw : null;
    if (amount === null || !isValidPurchaseAmount(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum is $14.00.' },
        { status: 400 }
      );
    }

    const tokensToAdd = amountToTokens(amount);
    const amountCents = Math.round(amount * 100);

    // Auth (server side)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase admin credentials missing' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(url, serviceKey);
    const { data: { user }, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' } as any);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Buy Tokens',
              description: `Adds ${tokensToAdd} tokens to your balance`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        tokens_to_add: String(tokensToAdd),
        amount_usd: String(amount),
      },
      success_url: returnTo
        ? `${appUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}purchase=success${pendingId ? `&pendingId=${pendingId}` : ''}`
        : `${appUrl}/${body?.lang || 'en'}/debate?purchase=success`,
      cancel_url: returnTo
        ? `${appUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}purchase=cancel`
        : `${appUrl}/${body?.lang || 'en'}/buy-tokens?purchase=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('buy-tokens checkout error', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Checkout failed' }, { status: 500 });
  }
}
