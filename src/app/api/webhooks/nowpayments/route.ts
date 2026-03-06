import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendTokenPurchaseInvoice } from '@/lib/email';
import { processPendingForUser } from '@/lib/pending/processPending';

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET_KEY!;

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const supabaseAdmin = createClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    try {
        const bodyText = await req.text();
        const signature = req.headers.get('x-nowpayments-sig');

        if (!IPN_SECRET || !signature) {
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        // Verify Signature
        const hmac = crypto.createHmac('sha512', IPN_SECRET);
        hmac.update(bodyText);
        const computed = hmac.digest('hex');
        if (computed !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        const data = JSON.parse(bodyText);

        if (data.payment_status === 'finished' || data.payment_status === 'partially_paid') {
            console.log(`[NowPayments Webhook] Processing finished payment: ${data.payment_id}`);

            // Grant Tokens
            // order_id format: "USERID_TOKENS_TS"
            const parts = (data.order_id || "").split('_');
            const userId = parts[0];
            const tokensStr = parts[1];

            if (userId && tokensStr) {
                const tokensToAdd = parseInt(tokensStr, 10);
                const eventId = String(data.payment_id || data.invoice_id || data.order_id || '');

                console.log('[NowPayments Webhook] Data:', { userId, tokensToAdd, eventId, status: data.payment_status });

                if (isNaN(tokensToAdd) || tokensToAdd <= 0) {
                    console.warn('[NowPayments Webhook] Invalid tokensToAdd:', tokensStr);
                    return NextResponse.json({ received: true, error: 'invalid_tokens' });
                }

                // Idempotency check
                const { data: existingEvent } = await supabaseAdmin
                    .from('payment_events')
                    .select('status')
                    .eq('provider', 'nowpayments')
                    .eq('event_id', eventId)
                    .maybeSingle();

                if (existingEvent?.status === 'processed') {
                    console.log('[NowPayments Webhook] Already processed. Skipping.');
                    return NextResponse.json({ ok: true, duplicate: true });
                }

                const amountCents = (typeof data.price_amount === 'number' || typeof data.price_amount === 'string')
                    ? Math.round(parseFloat(String(data.price_amount)) * 100)
                    : null;

                try {
                    // Record / Update event
                    if (!existingEvent) {
                        const { error: peErr } = await supabaseAdmin.from('payment_events').insert({
                            provider: 'nowpayments',
                            event_id: eventId,
                            user_id: userId,
                            amount_cents: amountCents,
                            tokens_added: tokensToAdd,
                            status: 'received',
                            raw: data,
                        });
                        if (peErr) {
                            if (peErr.code === '23505') return NextResponse.json({ ok: true, conflict: true });
                            throw peErr;
                        }
                    }

                    // Grant tokens
                    console.log(`[NowPayments Webhook] Granting ${tokensToAdd} tokens to ${userId}`);

                    const { error: rpcErr } = await supabaseAdmin.rpc('refund_tokens', {
                        p_user_id: userId,
                        p_tokens: tokensToAdd
                    });

                    if (rpcErr) {
                        console.warn('[NowPayments Webhook] RPC failed, fallback to manual update:', rpcErr.message);
                        const { data: profile, error: profErr } = await supabaseAdmin.from('profiles').select('token_balance').eq('id', userId).single();
                        if (profErr || !profile) throw new Error(`Profile not found: ${profErr?.message || 'unknown'}`);

                        const { error: updErr } = await supabaseAdmin.from('profiles').update({
                            token_balance: (Number(profile.token_balance) || 0) + tokensToAdd
                        }).eq('id', userId);

                        if (updErr) {
                            console.error('[NowPayments Webhook] Manual update failed:', updErr);
                            throw updErr;
                        }
                    }

                    // Ledger
                    const { error: ledgerErr } = await supabaseAdmin.from('token_ledger').insert({
                        user_id: userId,
                        delta_tokens: tokensToAdd,
                        reason: 'purchase',
                        reference: eventId,
                        meta: { nowpayments_id: data.payment_id, pay_currency: data.pay_currency }
                    });
                    if (ledgerErr) {
                        console.error('[NowPayments Webhook] Ledger insert failed:', ledgerErr.message);
                    }

                    // Invoice Email
                    const { data: uData } = await supabaseAdmin.auth.admin.getUserById(userId);
                    if (uData?.user?.email) {
                        try {
                            const amountStr = `${data.price_amount} ${data.price_currency || 'USD'}`;
                            await sendTokenPurchaseInvoice(uData.user.email, amountStr, tokensToAdd, 'en', eventId);
                        } catch (emailErr) {
                            console.warn('[NowPayments Webhook] Email failed:', emailErr);
                        }
                    }

                    // Notifications
                    await supabaseAdmin.from('notifications').insert({
                        user_id: userId,
                        title: 'Purchase Successful',
                        body: `Successfully purchased ${tokensToAdd} tokens via NOWPayments.`,
                        type: 'success',
                        is_read: false
                    });

                    // Update Event Status
                    await supabaseAdmin.from('payment_events')
                        .update({ status: 'processed' })
                        .eq('provider', 'nowpayments')
                        .eq('event_id', eventId);

                    // Resume Pending
                    try {
                        await processPendingForUser(userId);
                    } catch (e: any) {
                        console.warn('[NowPayments Webhook] Resume pending failed:', e.message);
                    }

                    console.log('[NowPayments Webhook] Successfully processed:', eventId);
                    return NextResponse.json({ ok: true });

                } catch (err: any) {
                    console.error('[NowPayments Webhook] Critical Error:', err.message);
                    await supabaseAdmin.from('payment_events')
                        .update({ status: 'failed' })
                        .eq('provider', 'nowpayments')
                        .eq('event_id', eventId);
                    return NextResponse.json({ error: err.message }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ success: true, processed: false });

    } catch (error: unknown) {
        console.error('NowPayments Webhook Outer Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
