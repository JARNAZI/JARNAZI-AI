import { createClient } from '@/lib/supabase/server';
import AdminManageProviders from './AdminManageProviders';
import { getDictionary } from '@/i18n/get-dictionary';

export const dynamic = 'force-dynamic';

export default async function AdminProvidersPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  const supabase = await createClient();

  // Fetch DB providers
  const { data: providers } = await supabase.from('ai_providers').select('*').order('name');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{dict.adminProviders?.title ?? 'AI Providers'}</h1>
      <p className="text-muted-foreground mb-8">
        {dict.adminProviders?.subtitle ?? 'Configure models and priorities available to the Orchestrator.'}
      </p>

      <AdminManageProviders initialProviders={providers || []} />
    </div>
  );
}
