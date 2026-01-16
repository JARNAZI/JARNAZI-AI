import { createClient } from '@/lib/supabase/server';
import AdminManageModels from './AdminManageModels';

export const dynamic = 'force-dynamic';

export default async function AdminModelsPage(props: { params: Promise<{ lang: string }> }) {
  await props.params;
  const supabase = await createClient();
  const { data: models } = await supabase.from('ai_models').select('*').order('priority', { ascending: true });
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Model Registry</h1>
      <p className="text-gray-400 mb-8">
        Only enabled models here can be used by the Orchestrator. Add or disable models without code changes.
      </p>
      <AdminManageModels initialModels={models || []} />
    </div>
  );
}
