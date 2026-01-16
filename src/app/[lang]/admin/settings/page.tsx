import { createClient } from '@/lib/supabase/server';
import AdminSettingsForm from './AdminSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const supabase = await createClient();

    // Fetch all settings
    const { data: settings } = await supabase.from('site_settings').select('*').order('label');

    // Transform to simple object for ease of use initially, but array is fine for mapping
    const settingMap = settings?.reduce((acc: any, curr) => {
        acc[curr.key] = curr;
        return acc;
    }, {}) || {};

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Global Settings</h1>
            <p className="text-gray-400 mb-8">Manage site configuration, free trials, and content.</p>

            <AdminSettingsForm initialSettings={settingMap} />
        </div>
    );
}
