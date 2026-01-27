import { createClient } from '@/lib/supabase/server';
import AdminManageModels from './AdminManageModels';
import { getDictionary } from '@/i18n/getDictionary';

export const dynamic = 'force-dynamic';

export default async function AdminModelsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  const supabase = await createClient();
  const { data: models } = await supabase.from('ai_models').select('*').order('priority', { ascending: true });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{dict.adminModels?.title ?? 'Model Registry'}</h1>
      <p className="text-muted-foreground mb-8">
        {dict.adminModels?.subtitle ??
          'Only enabled models here can be used by the Orchestrator. Add or disable models without code changes.'}
      </p>
      <AdminManageModels initialModels={models || []} />
    </div>
  );
}
