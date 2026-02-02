import { createClient } from '@/lib/supabase/server';
import { sendAdminAlert } from './email';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export async function createNotification(userId: string, body: string, type: NotificationType = 'info', title: string = 'Update') {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            title,
            body,
            type,
            is_read: false
        });

        if (error) throw error;

        // Keep only the newest 10 notifications per user
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

    try {
        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin']);

        if (admins?.length) {
            await supabase.from('notifications').insert(
                admins.map(a => ({
                    user_id: a.id,
                    title: subject,
                    body: message,
                    type: 'error',
                    is_read: false
                }))
            );
        }
    } catch (e) {
        console.error('Failed to notify admins in-app:', e);
    }

    await sendAdminAlert(subject, message);
}
