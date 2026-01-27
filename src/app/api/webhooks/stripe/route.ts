import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendTokenPurchaseInvoice } from '@/lib/email';
import { processPendingForUser } from '@/lib/pending/processPending';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const sig = (await headers()).get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    console.error('Stripe webhook signature verification failed:', (err instanceof Error ? err.message : String(err)));
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object;

    // New Buy Tokens flow (Phase 3)
    const userId = session?.metadata?.user_id || session?.metadata?.userId;
    const tokensStr = session?.metadata?.tokens_to_add || session?.metadata?.credits_cents;
    const planName = session?.metadata?.planName || 'Buy Tokens';

    if (userId && tokensStr) {
      const tokensToAdd = parseInt(tokensStr, 10);
      if (!isNaN(tokensToAdd) && tokensToAdd > 0) {

// Idempotency: prevent double-grant if Stripe retries the webhook
const eventId = event.id as string;
const amountCents = typeof session?.amount_total === 'number' ? session.amount_total : null;

const { error: peInsertErr } = await supabaseAdmin.from('payment_events').insert({
  provider: 'stripe',
  event_id: eventId,
  user_id: userId,
  amount_cents: amountCents,
  tokens_added: tokensToAdd,
  status: 'received',
  raw: event as any,
});

if (peInsertErr) {
  const isDuplicate =
    (peInsertErr as any).code === '23505' || /duplicate key/i.test(peInsertErr.message || '');
  if (isDuplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  console.error('Failed to record payment event (stripe):', peInsertErr);
  return NextResponse.json({ error: 'Failed to record payment event' }, { status: 500 });
}
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('token_balance_cents')
          .eq('id', userId)
          .maybeSingle();

        if (!error) {
          const newBalance = (profile?.token_balance_cents || 0) + tokensToAdd;
          await supabaseAdmin.from('profiles').update({ token_balance_cents: newBalance }).eq('id', userId);
        } else {
          console.error('Failed to read profile for token grant:', error);
        }

        // Send invoice email (optional)
        if (session.customer_details?.email) {
          const amountFormatted = (session.amount_total / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: session.currency || 'usd',
          });

          await sendTokenPurchaseInvoice(
            session.customer_details.email,
            amountFormatted,
            tokensToAdd,
            'en',
            session.id
          );
        }

// Mark processed
await supabaseAdmin.from('payment_events')
  .update({ status: 'processed' })
  .eq('provider', 'stripe')
  .eq('event_id', eventId);

// Attempt server-side resume of latest pending request (if still valid)
try {
  await processPendingForUser(userId);
} catch (e) {
  console.error('Failed to auto-resume pending request:', e);
}
      }
    }
  }


  return NextResponse.json({ received: true });
}
