import { createAdminClient } from '@/lib/supabase/server-admin';
import AdminSettingsForm from './AdminSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const supabase = await createAdminClient();

    // Fetch settings (supports both schemas)
    let settingMap: Record<string, any> = {};
    try {
        // KV schema
        const { data: settings } = await supabase.from('site_settings').select('*').order('label');
        if (Array.isArray(settings) && settings.length > 0 && (settings as any)[0]?.key != null) {
            settingMap = (settings as any[]).reduce((acc: any, curr) => {
                acc[curr.key] = curr;
                return acc;
            }, {}) || {};
        }
    } catch (_) { }

    if (Object.keys(settingMap).length === 0) {
        // Single-row schema with `features` JSONB
        const { data } = await supabase.from('site_settings').select('features').limit(1).maybeSingle();
        const features = (data as any)?.features || {};
        for (const [k, v] of Object.entries(features)) {
            settingMap[k] = { key: k, value: v };
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Global Settings</h1>
            <p className="text-gray-400 mb-8">Manage site configuration, free trials, and content.</p>

            <AdminSettingsForm initialSettings={settingMap} />
        </div>
    );
}
