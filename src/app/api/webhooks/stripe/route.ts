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
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK!);
  } catch (err: unknown) {
    console.error('Stripe webhook signature verification failed:', (err instanceof Error ? err.message : String(err)));
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object;
    const userId = session?.metadata?.user_id || session?.metadata?.userId;
    const tokensStr = session?.metadata?.tokens_to_add || session?.metadata?.credits_cents;

    if (userId && tokensStr) {
      const tokensToAdd = parseInt(tokensStr, 10);
      if (!isNaN(tokensToAdd) && tokensToAdd > 0) {
        const eventId = event.id as string;

        // Idempotency check with payment_events
        const { data: existingEvent } = await supabaseAdmin
          .from('payment_events')
          .select('id')
          .eq('event_id', eventId)
          .eq('provider', 'stripe')
          .maybeSingle();

        if (existingEvent) {
          return NextResponse.json({ ok: true, duplicate: true });
        }

        // Record event
        await supabaseAdmin.from('payment_events').insert({
          provider: 'stripe',
          event_id: eventId,
          processed: false,
        });

        // Update balance
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('token_balance')
          .eq('id', userId)
          .maybeSingle();

        const newBalance = (profile?.token_balance || 0) + tokensToAdd;
        await supabaseAdmin.from('profiles').update({ token_balance: newBalance }).eq('id', userId);

        // Record in ledger
        await supabaseAdmin.from('token_ledger').insert({
          user_id: userId,
          amount: tokensToAdd,
          description: `Stripe Payment: ${eventId}`
        });

        // Mark processed
        await supabaseAdmin.from('payment_events')
          .update({ processed: true })
          .eq('provider', 'stripe')
          .eq('event_id', eventId);

        // Email invoice
        if (session.customer_details?.email) {
          const amountFormatted = (session.amount_total / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: session.currency || 'usd',
          });
          await sendTokenPurchaseInvoice(session.customer_details.email, amountFormatted, tokensToAdd, 'en', session.id);
        }

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
