import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendTokenPurchaseInvoice } from '@/lib/email';
import { processPendingForUser } from '@/lib/pending/processPending';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const sig = (await headers()).get('stripe-signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK;
  const webhookSecretTest = process.env.STRIPE_TEST_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_TEST || process.env.STRIPE_TEST_WEBHOOK || process.env.STRIPE_WEBHOOK_SECRET_TEST;

  let event;
  try {
    if (!sig) throw new Error('Missing stripe-signature');
    if (!webhookSecret && !webhookSecretTest) throw new Error('Stripe webhook secrets missing (both live and test)');

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } else {
        throw new Error('No live secret, trying test secret');
      }
    } catch (err: any) {
      if (webhookSecretTest) {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecretTest);
        console.log('[Stripe Webhook] Verified using Test Secret');
      } else {
        throw err;
      }
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object;
    const metadata = session.metadata || {};
    const userId = metadata.user_id || metadata.userId;
    const tokensStr = metadata.tokens_to_add || metadata.credits_cents || metadata.tokens;

    console.log('[Stripe Webhook] Processing session:', {
      sessionId: session.id,
      userId,
      tokensStr,
      amount: session.amount_total,
      currency: session.currency
    });

    if (!userId || !tokensStr) {
      console.warn('[Stripe Webhook] Missing userId or tokens in metadata. Skipping.');
      return NextResponse.json({ received: true, ignored: true, reason: 'missing_metadata' });
    }

    const tokensToAdd = parseInt(tokensStr, 10);
    if (isNaN(tokensToAdd) || tokensToAdd <= 0) {
      console.warn('[Stripe Webhook] Invalid tokensToAdd value:', tokensStr);
      return NextResponse.json({ received: true, ignored: true, reason: 'invalid_tokens' });
    }

    const eventId = event.id;

    // 1. Idempotency Check
    const { data: existingEvent, error: checkErr } = await supabaseAdmin
      .from('payment_events')
      .select('status')
      .eq('event_id', eventId)
      .maybeSingle();

    if (checkErr) {
      console.error('[Stripe Webhook] Failed to check for existing event:', checkErr);
      return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
    }

    if (existingEvent?.status === 'processed') {
      console.log('[Stripe Webhook] Event already processed. Skipping.');
      return NextResponse.json({ ok: true, duplicate: true });
    }

    try {
      // 2. Initial record (or update status to 'received' if it was ignored/failed)
      if (!existingEvent) {
        const { error: insErr } = await supabaseAdmin.from('payment_events').insert({
          provider: 'stripe',
          event_id: eventId,
          user_id: userId,
          amount_cents: session.amount_total,
          tokens_added: tokensToAdd,
          status: 'received',
          raw: session,
        });
        if (insErr) {
          console.error('[Stripe Webhook] Failed to record payment_event:', insErr);
          // If it's a conflict, maybe someone else is processing it
          if (insErr.code === '23505') return NextResponse.json({ ok: true, conflict: true });
          throw insErr;
        }
      }

      // 3. Update Balance
      console.log(`[Stripe Webhook] Granting ${tokensToAdd} tokens to user ${userId}`);

      // Try RPC first (Atomic)
      const { error: rpcErr } = await supabaseAdmin.rpc('refund_tokens', {
        p_user_id: userId,
        p_tokens: tokensToAdd
      });

      if (rpcErr) {
        console.warn('[Stripe Webhook] RPC refund_tokens failed, trying manual fallback:', rpcErr.message);
        const { data: profile, error: profErr } = await supabaseAdmin
          .from('profiles')
          .select('token_balance')
          .eq('id', userId)
          .single();

        if (profErr || !profile) {
          throw new Error(`User profile not found: ${profErr?.message || 'unknown'}`);
        }

        const { error: updErr } = await supabaseAdmin
          .from('profiles')
          .update({
            token_balance: (Number(profile.token_balance) || 0) + tokensToAdd
          })
          .eq('id', userId);

        if (updErr) {
          console.error('[Stripe Webhook] Manual balance update failed:', updErr);
          throw updErr;
        }
      }

      // 4. Ledger Record
      const { error: ledErr } = await supabaseAdmin.from('token_ledger').insert({
        user_id: userId,
        delta_tokens: tokensToAdd,
        amount: tokensToAdd, // for compatibility
        reason: 'purchase',
        reference: session.id,
        meta: { stripe_event_id: eventId, amount_total: session.amount_total }
      });
      if (ledErr) console.warn('[Stripe Webhook] Ledger record failed (non-blocking):', ledErr);

      // 5. Success Notification
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title: 'Purchase Successful',
        body: `Successfully purchased ${tokensToAdd} tokens.`,
        type: 'success',
        is_read: false
      });

      // 6. Send Invoice Email
      let recipientEmail = session.customer_details?.email;
      if (!recipientEmail) {
        const { data: uData } = await supabaseAdmin.auth.admin.getUserById(userId);
        recipientEmail = uData?.user?.email;
      }

      if (recipientEmail) {
        try {
          const amountFormatted = (session.amount_total / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: session.currency || 'usd',
          });
          await sendTokenPurchaseInvoice(recipientEmail, amountFormatted, tokensToAdd, 'en', session.id);
          console.log('[Stripe Webhook] Invoice email sent to:', recipientEmail);
        } catch (emailErr) {
          console.warn('[Stripe Webhook] Invoice email failed:', emailErr);
        }
      }

      // 7. Mark as processed
      await supabaseAdmin.from('payment_events')
        .update({ status: 'processed' })
        .eq('event_id', eventId);

      // 8. Auto-resume pending
      try {
        await processPendingForUser(userId);
      } catch (e: any) {
        console.warn('[Stripe Webhook] Auto-resume failed:', e.message);
      }

      console.log('[Stripe Webhook] Successfully processed session:', session.id);
      return NextResponse.json({ ok: true });

    } catch (dbErr: any) {
      console.error('[Stripe Webhook] Critical Database Error:', dbErr.message);
      await supabaseAdmin.from('payment_events')
        .update({ status: 'failed' })
        .eq('event_id', eventId);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

