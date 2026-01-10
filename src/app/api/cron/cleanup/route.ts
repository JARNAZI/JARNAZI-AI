import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Disable Edge Runtime to avoid Node.js API warnings
export const runtime = 'nodejs';

export async function GET(req: Request) {
    // Initialize Supabase client inside the handler to avoid build-time errors
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    try {
        const { searchParams } = new URL(req.url);
        const secret = req.headers.get('authorization')?.split(' ')[1];

        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results: any = {};

        // 1. Delete Old Debates (and implicitly Images/Videos in turns via cascade)
        // Rule: Delete > 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { error: debateError, count: debateCount } = await supabase
            .from('debates')
            .delete({ count: 'exact' })
            .lt('created_at', twentyFourHoursAgo);

        if (debateError) throw debateError;
        results.deletedDebates = debateCount;

        // 2. Cleanup Notifications (Keep 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { count: notifCount } = await supabase
            .from('notifications')
            .delete({ count: 'exact' })
            .lt('created_at', thirtyDaysAgo);
        results.deletedNotifications = notifCount;

        // 3. Delete Unverified Accounts (> 30 mins)
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000); // Date Object

        // Supabase Admin API for Users
        // Getting users is paginated, default 50. We might need to loop if many.
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) throw userError;

        let deletedUsers = 0;
        for (const user of users) {
            const created = new Date(user.created_at);
            // If not confirmed (email_confirmed_at is null or empty) and older than 30m
            if (!user.email_confirmed_at && created < thirtyMinsAgo) {
                await supabase.auth.admin.deleteUser(user.id);
                deletedUsers++;
            }
        }
        results.deletedUnverifiedUsers = deletedUsers;

// --- Auto-delete sessions/artifacts older than 3 days ---
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

const { data: oldDebates, error: oldErr } = await supabase
    .from('debates')
    .select('id,user_id,topic,created_at')
    .lt('created_at', threeDaysAgo)
    .limit(500);

if (!oldErr && oldDebates?.length) {
    for (const d of oldDebates) {
        // Notify user about deletion (best-effort)
        await supabase.from('notifications').insert({
            user_id: d.user_id,
            message: `Your session "${(d.topic || '').slice(0, 60)}" was deleted automatically (3-day retention).`,
            type: 'info',
            link: null
        });
        await supabase.from('debate_turns').delete().eq('debate_id', d.id);
        await supabase.from('debates').delete().eq('id', d.id);
    }
    results.deletedOldSessions = oldDebates.length;
}


        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Cron Cleanup Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
