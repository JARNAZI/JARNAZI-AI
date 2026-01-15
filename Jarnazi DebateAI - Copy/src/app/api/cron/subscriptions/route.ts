import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Disable Edge Runtime to avoid Node.js API warnings
export const runtime = 'nodejs';

export async function GET(req: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const secret = req.headers.get('authorization')?.split(' ')[1];
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Monitor Subscription Status (Placeholder logic)
    // 1. Identify expired trial users or subscriptions
    // 2. We assume a 'tier' or 'subscription_end' column in profiles

    // Example: Downgrade expired Pro users to Free
    /*
    const now = new Date().toISOString();
    const { data: expiredUsers, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('tier', 'pro')
        .lt('subscription_end_at', now);

    if (expiredUsers && expiredUsers.length > 0) {
        for (const u of expiredUsers) {
            await supabase.from('profiles').update({ tier: 'free' }).eq('id', u.id);
        }
    }
    */

    return NextResponse.json({
        status: 'checked',
        message: 'Subscription monitoring active. No expired subscriptions found (Placeholder).'
    });
}
