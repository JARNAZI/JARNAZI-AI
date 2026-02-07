import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { amountToTokens, isValidPurchaseAmount, normalizeAmount } from '@/lib/tokens';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.NOWPATMENTS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'NOWTokens is not configured' }, { status: 500 });
        }

        // Auth (server side)
        const url = process.env.SUPABASE_URL;
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

        const body = await req.json().catch(() => ({}));
        const amount = normalizeAmount(body?.amount);
        const lang = body?.lang;
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

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Prefer a stable server-to-server webhook (Supabase Edge Function) if provided.
        // This keeps NOWPayments token granting independent from the web host (Vercel/Cloud Run/etc.).
        const webhookUrl =
            process.env.NOWPAYMENTS_WEBHOOK_URL ||
            `${appUrl}/api/webhooks/nowpayments`;

        // Call NowPayments API
        // Doc: https://documenter.getpostman.com/view/7928690/TszD8dxc#create-invoice
        // We'll use the "invoice" endpoint or "payment" endpoint. "invoice" generates a link.
        const res = await fetch('https://api.nowpayments.io/v1/invoice', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                price_amount: amount,
                price_currency: 'usd',
                // Keep webhook parsing compatible: order_id = "<USER_ID>_<TOKENS_TO_ADD>"
                order_id: `${user.id}_${tokensToAdd}`,
                order_description: `Purchase Tokens (+${tokensToAdd}) (${amount} USD)`,
                ipn_callback_url: webhookUrl,
                success_url: returnTo
                    ? `${appUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}purchase=success${pendingId ? `&pendingId=${pendingId}` : ''}`
                    : `${appUrl}/${lang || 'en'}/debate?purchase=success`,
                cancel_url: returnTo
                    ? `${appUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}purchase=cancel`
                    : `${appUrl}/${lang || 'en'}/buy-tokens?purchase=cancel`,
            })
        });

        const json = await res.json();
        if (!res.ok) {
            throw new Error(json.message || 'Payment creation failed');
        }

        // invoice_url is usually returned
        return NextResponse.json({ url: json.invoice_url });

    } catch (err: unknown) {
        console.error('NOWPayments error', err);
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Payment failed' }, { status: 500 });
    }
}
