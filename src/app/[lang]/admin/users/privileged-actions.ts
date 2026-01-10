'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to get admin client
import { createClient as createClientPrimitive } from '@supabase/supabase-js';

const getServiceRoleClient = () => {
    return createClientPrimitive(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export async function deleteUser(userId: string) {
    const supabase = await createClient();

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'super_admin') {
        throw new Error('Only Super Admin can delete users');
    }

    // Auth Admin required to delete from auth.users
    // Since we don't have direct access to supabase.auth.admin in the standard client, 
    // we use the Service Role Key client specifically for this action.
    return await performDeleteUser(userId);
}

export async function performDeleteUser(userId: string) {
    const supabase = getServiceRoleClient();

    // 1. Delete from Auth (Cascade should handle profile, debates, etc)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        console.error('Delete User Error:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin/users');
    return { success: true };
}

export async function impersonateUser(userId: string) {
    const supabase = getServiceRoleClient();

    // Generate magic link
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();

    if (!profile?.email) throw new Error('User email not found');

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: profile.email
    });

    if (error) throw error;
    if (!data?.properties?.action_link) throw new Error('Failed to generate magic link');

    // Return the action link (verify_redirect)
    return { success: true, url: data.properties.action_link };
}

export async function toggleBanUser(userId: string, isBanned: boolean) {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').update({ is_banned: isBanned }).eq('id', userId);
    if (error) throw error;
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}

