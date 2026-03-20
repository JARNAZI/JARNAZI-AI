'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to get admin client
import { createClient as createClientPrimitive } from '@supabase/supabase-js';

const getServiceRoleClient = () => {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase Service Role Key");
    return createClientPrimitive(url, key);
};

export async function deleteUser(userId: string) {
    const supabase = await createClient();

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role || user.app_metadata?.role;

    if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('Only Admin or Super Admin can delete users');
    }

    // Auth Admin required to delete from auth.users
    // Since we don't have direct access to supabase.auth.admin in the standard client, 
    // we use the Service Role Key client specifically for this action.
    return await performDeleteUser(userId);
}

export async function performDeleteUser(userId: string) {
    const contextClient = await createClient();
    const { data: { user } } = await contextClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await contextClient.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role || user.app_metadata?.role;

    if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('Only Admin or Super Admin can delete users');
    }

    const supabase = getServiceRoleClient();

    // 1. Delete dependent profile data in case ON DELETE CASCADE is missing
    await supabase.from('generated_assets').delete().eq('user_id', userId);
    await supabase.from('debates').delete().eq('user_id', userId);
    await supabase.from('debate_turns').delete().eq('user_id', userId);
    await supabase.from('contact_messages').delete().eq('user_id', userId);
    await supabase.from('token_ledger').delete().eq('user_id', userId);
    await supabase.from('notifications').delete().eq('user_id', userId);
    await supabase.from('user_canons').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);

    // 2. Delete from Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        console.error('Delete User Error:', error);
        throw new Error(error.message);
    }

    revalidatePath('/[lang]/admin/users', 'layout');
    return { success: true };
}

export async function impersonateUser(userId: string) {
    const contextClient = await createClient();
    const { data: { user } } = await contextClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: requestorProfile } = await contextClient.from('profiles').select('role').eq('id', user.id).single();
    const role = requestorProfile?.role || user.app_metadata?.role;

    if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('Only Admin or Super Admin can impersonate users');
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: requestorProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = requestorProfile?.role || user.app_metadata?.role;

    if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('Only Admin or Super Admin can ban users');
    }

    const adminClient = getServiceRoleClient();
    const { error } = await adminClient.from('profiles').update({ is_banned: isBanned }).eq('id', userId);
    if (error) throw error;

    revalidatePath('/[lang]/admin/users', 'layout');
    return { success: true };
}

