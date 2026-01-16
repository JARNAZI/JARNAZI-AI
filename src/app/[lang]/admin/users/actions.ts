'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendAdminTokenGrant } from '@/lib/email';

export async function toggleUserBan(userId: string, isBanned: boolean) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: !isBanned })
            .eq('id', userId);

        if (error) throw error;

        revalidatePath('/admin/users');
    } catch (error: unknown) {
        throw new Error('Failed to update user status: ' + (error instanceof Error ? error.message : String(error)));
    }
}

export async function grantTokens(userId: string, tokens: number, reason: string) {
    const supabase = await createClient();

    try {
        // 1. Get profile for email and current balance
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('token_balance, email')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) throw new Error('User not found');

        // 2. Update balance
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ token_balance: (profile.token_balance || 0) + tokens })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 3. Log transaction
        await supabase.from('transactions').insert({
            user_id: userId,
            amount: 0,
            currency: 'USD',
            provider: 'admin_grant',
            status: 'completed',
            tokens_granted: tokens,
            external_id: `grant_${Date.now()}`
        });

        // 4. Send Email
        if (profile.email) {
            await sendAdminTokenGrant(profile.email, tokens, reason);
        }

        revalidatePath('/admin/users');
    } catch (error: unknown) {
        throw new Error('Failed to grant tokens: ' + (error instanceof Error ? error.message : String(error)));
    }
}
