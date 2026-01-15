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

        // Read retention settings (fallbacks)
        const { data: retentionRow } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'retention')
            .maybeSingle();

        const retentionDays = Number(retentionRow?.value?.sessions_retention_days ?? 3);
        const unverifiedDeleteMinutes = Number(retentionRow?.value?.unverified_delete_minutes ?? 30);

        const cutoffISO = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

        // 1. Cleanup Notifications (Keep 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        try {
            const { count: notifCount } = await supabase
                .from('notifications')
                .delete({ count: 'exact' })
                .lt('created_at', thirtyDaysAgo);
            results.deletedNotifications = notifCount;
        } catch {
            results.deletedNotifications = 0;
        }

        // 2. Delete Unverified Accounts (> configured minutes)
        const unverifiedCutoff = new Date(Date.now() - unverifiedDeleteMinutes * 60 * 1000);

        // Supabase Admin API for Users
        // Getting users is paginated, default 50. We might need to loop if many.
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) throw userError;

        let deletedUsers = 0;
        for (const user of users) {
            const created = new Date(user.created_at);
            // If not confirmed (email_confirmed_at is null or empty) and older than 30m
            if (!user.email_confirmed_at && created < unverifiedCutoff) {
                await supabase.auth.admin.deleteUser(user.id);
                deletedUsers++;
            }
        }
        results.deletedUnverifiedUsers = deletedUsers;

        // 3. Auto-delete sessions/artifacts older than retentionDays with notification (best-effort)
        const threeDaysAgo = cutoffISO;

const { data: oldDebates, error: oldErr } = await supabase
    .from('debates')
    .select('id,user_id,topic,created_at')
    .lt('created_at', threeDaysAgo)
    .limit(500);

        if (!oldErr && oldDebates?.length) {
            for (const d of oldDebates) {
                // Notifications table is added in Phase 10; ignore errors if missing.
                await supabase.from('notifications').insert({
                    user_id: d.user_id,
                    message: `Your session "${(d.topic || '').slice(0, 60)}" was deleted automatically (${retentionDays}-day retention).`,
                    type: 'info',
                    link: null
                }).catch(() => null);

                await supabase.from('generated_assets').delete().eq('debate_id', d.id);
                await supabase.from('debate_turns').delete().eq('debate_id', d.id);
                await supabase.from('debates').delete().eq('id', d.id);
            }
            results.deletedOldSessions = oldDebates.length;
            results.deletedDebates = oldDebates.length;
        }


        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Cron Cleanup Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
