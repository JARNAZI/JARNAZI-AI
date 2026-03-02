'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminDbClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function updateSetting(key: string, value: string) {
    const supabaseUser = await createClient();

    // Check Permission via user client
    const { data: { user } } = await supabaseUser.auth.getUser();
    const { data: profile } = await supabaseUser.from('profiles').select('role').eq('id', user?.id).single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    // Bypass RLS for actual update since we manually verified admin role
    const supabaseAdmin = createAdminDbClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Supports both schemas:
    // A) KV schema: upsert { key, value }
    // B) Alternate KV: upsert { setting_key, setting_value }
    // C) Single-row schema: update JSONB `features`
    let error: any = null;

    try {
        console.log(`[Admin/Settings] Attempting upsert for key: ${key}`);

        // Strategy 1: Try { key, value } - matches settings_v2.sql
        const res1 = await supabaseAdmin.from('site_settings').upsert({
            key,
            value,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

        if (res1.error) {
            console.warn(`[Admin/Settings] Upsert strategy 1 failed: ${res1.error.message}. Trying strategy 2...`);

            // Strategy 2: Try { setting_key, setting_value } - matches site_settings_schema.sql
            const res2 = await supabaseAdmin.from('site_settings').upsert({
                setting_key: key,
                setting_value: value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'setting_key' });

            if (res2.error) {
                console.error(`[Admin/Settings] All KV upsert strategies failed.`);
                error = res2.error;
            }
        }
    } catch (upsertCatch: any) {
        console.error(`[Admin/Settings] Exception during KV upsert:`, upsertCatch.message);
        error = upsertCatch;
    }

    if (error) {
        console.log(`[Admin/Settings] Falling back to single-row JSONB 'features' update...`);
        // Fallback: single-row `features` JSONB
        const { data: row, error: readErr } = await supabaseAdmin.from('site_settings').select('id,features').limit(1).maybeSingle();
        if (readErr) {
            console.error(`[Admin/Settings] Fallback READ failed:`, readErr.message);
            throw readErr;
        }

        const id = (row as any)?.id;
        const features = { ...((row as any)?.features || {}), [key]: value };

        if (id) {
            const { error: updErr } = await supabaseAdmin.from('site_settings').update({
                features,
                updated_at: new Date().toISOString()
            }).eq('id', id);
            if (updErr) throw updErr;
        } else {
            // First time saving in single-row mode
            const { error: insErr } = await supabaseAdmin.from('site_settings').insert({
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
