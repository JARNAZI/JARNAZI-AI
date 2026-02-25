'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

export async function updateSetting(key: string, value: string) {
    const supabase = await createClient();

    // Check Permission
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    const adminSupabase = await createAdminClient();

    // Supports both schemas safely using admin client
    const { data: existing, error: checkErr } = await adminSupabase.from('site_settings').select('id, key').eq('key', key).maybeSingle();

    let dbError: any = null;
    if (existing) {
        const { error } = await adminSupabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('id', existing.id);
        dbError = error;
    } else if (!checkErr) {
        const { error } = await adminSupabase.from('site_settings').insert({ key, value, updated_at: new Date().toISOString() });
        dbError = error;
    } else {
        dbError = checkErr;
    }

    if (dbError) {
        // Fallback: single-row `features` JSONB
        const { data: row, error: readErr } = await adminSupabase.from('site_settings').select('id,features').limit(1).maybeSingle();
        if (readErr) throw new Error(`Schema A failed: ${dbError.message} AND Schema B failed: ${readErr.message}`);

        const id = row?.id;
        if (!id) throw new Error(`Failed to update setting: ${dbError.message}`);

        const features = { ...(row?.features || {}), [key]: value };
        const { error: updErr } = await adminSupabase.from('site_settings').update({ features, updated_at: new Date().toISOString() }).eq('id', id);
        if (updErr) throw updErr;
    }
    revalidatePath('/admin/settings');
    revalidatePath('/'); // Refresh home for logo/title changes
    return { success: true };
}

export async function uploadLogo(formData: FormData) {
    const supabase = await createClient();
    const file = formData.get('logo') as File;

    if (!file) throw new Error('No file provided');
    if (!file.type.startsWith('image/')) throw new Error('Invalid image type');

    // Upload to public-assets
    // Assuming we want to overwrite 'logo.jpg' or unique name?
    // Let's use unique name and update setting.
    const ext = file.name.split('.').pop();
    const filename = `logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('public-assets').upload(filename, file);
    if (uploadError) throw uploadError;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(filename);

    // Update Setting
    await updateSetting('logo_url', publicUrl);

    return { success: true, url: publicUrl };
}

export async function updateAdminProfile(data: { email?: string; password?: string }) {
    const supabase = await createClient();

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Update auth profile (email/password)
    const updates: { email?: string; password?: string } = {};
    if (data.email) updates.email = data.email;
    if (data.password) updates.password = data.password;

    if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
    }
}
