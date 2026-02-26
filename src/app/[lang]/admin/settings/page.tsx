import { createServiceRoleClient } from '@/lib/supabase/server-admin';
import AdminSettingsForm from './AdminSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const supabase = await createServiceRoleClient();

    // Fetch settings - merging both schemas for robustness
    let settingMap: Record<string, any> = {};
    
    // 1. Fetch from KV schema
    try {
        const { data: kvSettings } = await supabase.from('site_settings').select('*');
        if (Array.isArray(kvSettings)) {
            kvSettings.forEach(curr => {
                const rowKey = curr?.key || curr?.setting_key;
                const rowVal = curr?.value !== undefined ? curr?.value : curr?.setting_value;
                if (rowKey) {
                    settingMap[rowKey] = { key: rowKey, value: String(rowVal ?? '') };
                }
            });
        }
    } catch (_) { /* Table might not support KV schema */ }

    // 2. Fetch from Single-row (features JSONB) schema and merge
    try {
        const { data: srData } = await supabase.from('site_settings').select('features').limit(1).maybeSingle();
        if (srData?.features) {
            const features = srData.features as Record<string, any>;
            for (const [k, v] of Object.entries(features)) {
                // KV takes precedence if it already has the key
                if (!settingMap[k]) {
                    settingMap[k] = { key: k, value: String(v) };
                }
            }
        }
    } catch (_) { /* Table might not have features column */ }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Global Settings</h1>
            <p className="text-gray-400 mb-8">Manage site configuration, free trials, and content.</p>

            <AdminSettingsForm initialSettings={settingMap} />
        </div>
    );
}
