import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendTokenPurchaseInvoice } from '@/lib/email';

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
    const session: unknown = event.data.object;

    // New Buy Tokens flow (Phase 3)
    const userId = session?.metadata?.user_id || session?.metadata?.userId;
    const tokensStr = session?.metadata?.tokens_to_add || session?.metadata?.credits_cents;
    const planName = session?.metadata?.planName || 'Buy Tokens';

    if (userId && tokensStr) {
      const tokensToAdd = parseInt(tokensStr, 10);
      if (!isNaN(tokensToAdd) && tokensToAdd > 0) {
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
            planName,
            amountFormatted,
            tokensToAdd,
            'en'
          );
        }
      }
    }
  }


  return NextResponse.json({ received: true });
}
