import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendTokenPurchaseInvoice } from '@/lib/email';
import { processPendingForUser } from '@/lib/pending/processPending';

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET_KEY!;

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
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

        if (data.payment_status === 'finished') {
            // Grant Tokens
            // We need to parse custom_id or order_id to get userId and tokens
            // order_id format: "USERID_TOKENS" ideally
            const [userId, tokensStr] = (data.order_id || "").split('_');

            if (userId && tokensStr) {
                const tokensToAdd = parseInt(tokensStr);

                const eventId = String(data.payment_id || data.invoice_id || data.order_id || '');
                if (!eventId) {
                    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
                }

                // Idempotency: prevent double-grant if NowPayments retries the IPN
                const amountCents = (typeof data.price_amount === 'number' || typeof data.price_amount === 'string')
                    ? Math.round(parseFloat(String(data.price_amount)) * 100)
                    : null;

                const { error: peInsertErr } = await supabaseAdmin.from('payment_events').insert({
                    provider: 'nowpayments',
                    event_id: eventId,
                    user_id: userId,
                    amount_cents: amountCents,
                    tokens_added: tokensToAdd,
                    status: 'received',
                    raw: data,
                });

                if (peInsertErr) {
                    const isDuplicate = (peInsertErr as any).code === '23505' || /duplicate key/i.test(peInsertErr.message || '');
                    if (isDuplicate) {
                        return NextResponse.json({ ok: true, duplicate: true });
                    }
                    console.error('Failed to record payment event (nowpayments):', peInsertErr);
                    return NextResponse.json({ error: 'Failed to record payment event' }, { status: 500 });
                }
                const { data: profile } = await supabaseAdmin.from('profiles').select('token_balance_cents').eq('id', userId).single();

                if (profile) {
                    await supabaseAdmin.from('profiles').update({
                        token_balance_cents: ((profile as any).token_balance_cents || 0) + tokensToAdd
                    }).eq('id', userId);

                    await supabaseAdmin.from('transactions').insert({
                        user_id: userId,
                        amount: data.price_amount,
                        currency: data.pay_currency,
                        provider: 'nowpayments',
                        status: 'completed',
                        tokens_granted: tokensToAdd,
                        external_id: data.payment_id
                    });

                    // Send Invoice Email
                    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
                    if (user && user.email) {
                        const amountStr = `${data.price_amount} ${data.pay_currency}`;
                        await sendTokenPurchaseInvoice(
                            user.email,
                            amountStr,
                            tokensToAdd
                        );
                    }

                    // Mark processed
                    await supabaseAdmin.from('payment_events')
                        .update({ status: 'processed' })
                        .eq('provider', 'nowpayments')
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

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('NowPayments Webhook Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}