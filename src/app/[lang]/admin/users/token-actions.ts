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

    if (executorProfile?.role !== 'super_admin' && executorProfile?.role !== 'admin') {
        throw new Error('Only Admins can grant tokens manually.');
    }

    try {
        const { data: currentProfile, error: fetchErr } = await supabase
            .from('profiles')
            .select('token_balance')
            .eq('id', userId)
            .single();

        if (fetchErr || !currentProfile) throw new Error('User not found');

        const { error: updErr } = await supabase
            .from('profiles')
            .update({ token_balance: (currentProfile.token_balance || 0) + tokens })
            .eq('id', userId);

        if (updErr) throw updErr;

        const { error: ledgerErr } = await supabase.from('token_ledger').insert({
            user_id: userId,
            amount: tokens,
            description: `Admin Grant: ${reason}`
        });

        if (ledgerErr) throw ledgerErr;

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

        revalidatePath('/[lang]/admin/users', 'layout');
    } catch (error: unknown) {
        console.error('Grant Token Error:', error);
        throw new Error((error instanceof Error ? error.message : String(error)) || 'Failed to grant tokens');
    }
}
