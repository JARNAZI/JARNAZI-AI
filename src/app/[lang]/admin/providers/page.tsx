import { createClient } from '@/lib/supabase/server';
import AdminManageProviders from './AdminManageProviders';

export const dynamic = 'force-dynamic';

export default async function AdminProvidersPage() {
    const supabase = await createClient();

    // Fetch DB providers
    const { data: providers } = await supabase.from('ai_providers').select('*').order('priority');

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">AI Providers</h1>
            <p className="text-gray-400 mb-8">Configure models and priorities available to the Orchestrator.</p>

            <AdminManageProviders initialProviders={providers || []} />
        </div>
    );
}
