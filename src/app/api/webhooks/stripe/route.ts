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
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object;
    const userId = session?.metadata?.userId;
    const creditsCentsStr = session?.metadata?.credits_cents;
    const planName = session?.metadata?.planName || 'Token Credits';

    if (userId && creditsCentsStr) {
      const creditsCents = parseInt(creditsCentsStr, 10);
      if (!isNaN(creditsCents) && creditsCents > 0) {
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('token_balance')
          .eq('id', userId)
          .maybeSingle();

        if (!error) {
          const newBalance = (profile?.token_balance || 0) + creditsCents;
          await supabaseAdmin.from('profiles').update({ token_balance: newBalance }).eq('id', userId);
        } else {
          console.error('Failed to read profile for token credit:', error);
        }

        // Send invoice email (optional)
        if (session.customer_details?.email) {
          const amountFormatted = (session.amount_total / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: session.currency || 'usd',
          });

          // pass "tokens" as a friendly display: $ credits
          await sendTokenPurchaseInvoice(
            session.customer_details.email,
            planName,
            amountFormatted,
            Math.round(creditsCents / 100),
            'en'
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
