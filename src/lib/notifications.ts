import { createClient } from '@/lib/supabase/server';
import { sendAdminAlert } from './email';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export async function createNotification(userId: string, message: string, type: NotificationType = 'info', link?: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            message,
            type,
            link
        });

        if (error) throw error;

        // Keep only the newest 10 notifications per user (Phase 10)
        const { data: ids, error: selErr } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!selErr && ids && ids.length > 10) {
            const toDelete = ids.slice(10).map(r => r.id);
            await supabase.from('notifications').delete().in('id', toDelete);
        }
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
}

export async function notifyAdmin(subject: string, message: string) {
    const supabase = await createClient();

    // In-app notifications for admins (preferred)
    try {
        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin']);

        if (admins?.length) {
            await supabase.from('notifications').insert(
                admins.map(a => ({
                    user_id: a.id,
                    message: `${subject}: ${message}`,
                    type: 'error',
                    link: '/admin'
                }))
            );
        }
    } catch (e) {
        console.error('Failed to notify admins in-app:', e);
    }

    // Email alert (optional fallback)
    await sendAdminAlert(subject, message);
}
