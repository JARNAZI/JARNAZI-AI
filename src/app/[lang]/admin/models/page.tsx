import { createServiceRoleClient } from '@/lib/supabase/server-admin';
import AdminManageModels from './AdminManageModels';
import { getDictionary } from '@/i18n/get-dictionary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminModelsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  const supabase = await createServiceRoleClient();
  const { data: models, error } = await supabase.from('ai_models').select('*');
  console.log("ai_models fetch result:", { modelsLength: models?.length, error });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{dict.adminModels?.title ?? 'Model Registry'}</h1>
      <p className="text-muted-foreground mb-8">
        {dict.adminModels?.subtitle ??
          'Only enabled models here can be used by the Orchestrator. Add or disable models without code changes.'}
      </p>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-4 border border-red-500/20 font-mono text-sm max-w-full overflow-auto">
          Database Error: {error.message}
          <br />Hint: {error.hint || 'N/A'}
        </div>
      )}

      <AdminManageModels initialModels={models || []} />
    </div>
  );
}
