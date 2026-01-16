'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createClientPrimitive } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const getServiceRoleClient = () => {
    return createClientPrimitive(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export async function createSupportStaff(email: string, password: string, name: string) {
    const supabase = await createClient();

    // 1. Verify Requestor is Admin+
    const { data: { user: requestor } } = await supabase.auth.getUser();
    if (!requestor) throw new Error('Unauthorized');

    const { data: requestorProfile } = await supabase.from('profiles').select('role').eq('id', requestor.id).single();
    if (!['admin', 'super_admin'].includes(requestorProfile?.role)) {
        throw new Error('Unauthorized');
    }

    const adminClient = getServiceRoleClient();

    // 2. Check if user exists
    // We cannot easily search by email in public API without checking if sign up works or search user.
    // adminClient.auth.admin.listUsers() is possible but might be heavy.
    // Try creating first.

    // Attempt Create
    const { data, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
    });

    let userId = data?.user?.id;

    if (createError) {
        // If "User already registered", fetch ID? 
        // We can't see the ID if we don't have it.
        // Actually we can query profiles if they exist in our DB.
        const { data: existingProfile } = await adminClient.from('profiles').select('id').eq('email', email).single();
        if (existingProfile) {
            userId = existingProfile.id;
        } else {
            throw new Error('User exists in Auth but not in Profiles, or creation failed: ' + createError.message);
        }
    }

    if (!userId) throw new Error('Failed to resolve User ID');

    // 3. Assign Role 'support'
    const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role: 'support' })
        .eq('id', userId);

    if (updateError) throw updateError;

    revalidatePath('/admin/users');
    return { success: true };
}

export async function promoteToStaff(userId: string) {
    const supabase = await createClient();
    const { data: { user: requestor } } = await supabase.auth.getUser();

    // Verify Requestor
    const { data: requestorProfile } = await supabase.from('profiles').select('role').eq('id', requestor?.id).single();
    if (!['admin', 'super_admin'].includes(requestorProfile?.role)) throw new Error('Unauthorized');

    const adminClient = getServiceRoleClient();

    const { error } = await adminClient
        .from('profiles')
        .update({ role: 'support' })
        .eq('id', userId);

    if (error) throw error;
    revalidatePath('/admin/users');
    return { success: true };
}

export async function revokeStaffAccess(userId: string) {
    const supabase = await createClient(); // Use context client to check auth first
    const { data: { user: requestor } } = await supabase.auth.getUser();

    // Verify Requestor
    const { data: requestorProfile } = await supabase.from('profiles').select('role').eq('id', requestor?.id).single();
    if (!['admin', 'super_admin'].includes(requestorProfile?.role)) throw new Error('Unauthorized');

    const adminClient = getServiceRoleClient();

    // Downgrade to 'user'
    const { error } = await adminClient
        .from('profiles')
        .update({ role: 'user' }) // Remove privileged access
        .eq('id', userId);

    if (error) throw error;
    revalidatePath('/admin/users');
    return { success: true };
}
