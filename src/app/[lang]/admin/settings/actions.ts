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

    // Supports both schemas:
// A) KV schema: upsert { key, value }
// B) Single-row schema: update JSONB `features`
let error: any = null;

try {
    const res = await supabase.from('site_settings').upsert({
        key,
        value,
        updated_at: new Date().toISOString()
    });
    error = (res as any).error;
    if (!error) {
        // ok
    }
} catch (_) {
    // fall through
}

    if (error) {
        // Fallback: single-row `features` JSONB
        const { data: row, error: readErr } = await supabase.from('site_settings').select('id,features').limit(1).maybeSingle();
        if (readErr) throw readErr;
        
        const id = (row as any)?.id;
        const features = { ...((row as any)?.features || {}), [key]: value };
        
        if (id) {
            const { error: updErr } = await supabase.from('site_settings').update({ 
                features, 
                updated_at: new Date().toISOString() 
            }).eq('id', id);
            if (updErr) throw updErr;
        } else {
            // First time saving in single-row mode
            const { error: insErr } = await supabase.from('site_settings').insert({ 
                features, 
                updated_at: new Date().toISOString() 
            });
            if (insErr) throw insErr;
        }
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
