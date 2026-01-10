'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendAdminTokenGrant } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

export async function grantTokens(userId: string, tokens: number, reason: string, notifyUser: boolean) {
    const supabase = await createClient();

    // 1. Verify Super Admin Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: executorProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (executorProfile?.role !== 'super_admin') {
        throw new Error('Only Super Admins can grant tokens manually.');
    }

    try {
        // 2. Call Database Function (Atomic Transaction)
        const { error } = await supabase.rpc('admin_grant_tokens', {
            target_user_id: userId,
            token_amount: tokens,
            grant_reason: reason,
            admin_id: user.id
        });

        if (error) throw error;

        // 3. Optional Notification
        if (notifyUser) {
            // Fetch user email
            const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single();
            if (targetProfile?.email) {
                // Email
                await sendAdminTokenGrant(targetProfile.email, tokens, reason);
                // In-app
                await createNotification(userId, `You received ${tokens} tokens! Reason: ${reason}`, 'success', '/settings/billing');
            }
        }

        revalidatePath(`/admin/users/${userId}`);
    } catch (error: any) {
        console.error('Grant Token Error:', error);
        throw new Error(error.message || 'Failed to grant tokens');
    }
}
