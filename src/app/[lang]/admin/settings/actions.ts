'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateSetting(key: string, value: string) {
    const supabase = await createClient();

    // Check Permission
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase.from('site_settings').upsert({
        key,
        value,
        updated_at: new Date().toISOString()
    });

    if (error) throw error;
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

export async function updateAdminProfile(data: { email?: string, password?: string }) {
    const supabase = await createClient();

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Update User
    const updates: any = {};
    if (data.email) updates.email = data.email;
    if (data.password) updates.password = data.password;

    const { error } = await supabase.auth.updateUser(updates);
    if (error) throw error;

    return { success: true };
}
