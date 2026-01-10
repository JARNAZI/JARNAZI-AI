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
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
}

export async function notifyAdmin(subject: string, message: string) {
    // 1. Email Alert
    await sendAdminAlert(subject, message);

    // 2. We could also log to a specific 'admin_notifications' table or slack webhook here in the future
}
