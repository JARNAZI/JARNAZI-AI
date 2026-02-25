import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Auth
        const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        const authHeader = req.headers.get('authorization') || '';
        const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
        if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createClient(url, serviceKey);
        const { data: { user }, error: userErr } = await supabase.auth.getUser(accessToken);
        if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check payment_events for this user and orderId
        // In the webhook, event_id might be the order_id if payment_id/invoice_id are missing,
        // but usually we can find it in the 'raw' jsonb or we should have saved it somewhere.
        // HOWEVER, the webhook logic does:
        // const eventId = String(data.payment_id || data.invoice_id || data.order_id || '');
        // So searching by event_id = orderId IS correct if orderId was unique.

        const { data: event, error: eventErr } = await supabase
            .from('payment_events')
            .select('status, tokens_added')
            .eq('user_id', user.id)
            .eq('event_id', orderId)
            .maybeSingle();

        if (eventErr) {
            console.error('Status check error:', eventErr);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!event) {
            // Also check transactions table just in case
            const { data: tx } = await supabase
                .from('transactions')
                .select('status, tokens_granted')
                .eq('user_id', user.id)
                .eq('external_id', orderId) // We might have used order_id as external_id in some places
                .maybeSingle();

            if (tx && tx.status === 'completed') {
                return NextResponse.json({ status: 'finished', tokens: tx.tokens_granted });
            }

            return NextResponse.json({ status: 'pending' });
        }

        return NextResponse.json({
            status: event.status === 'processed' ? 'finished' : 'pending',
            tokens: event.tokens_added
        });

    } catch (err: unknown) {
        console.error('Status API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
