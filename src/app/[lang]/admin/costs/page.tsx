import { createClient } from '@/lib/supabase/server';
import AdminManageCosts from './AdminManageCosts';
import { getDictionary } from '@/i18n/get-dictionary';

export const dynamic = 'force-dynamic';

export default async function AdminCostsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  const supabase = await createClient();
  const { data: costs } = await supabase
    .from('ai_costs')
    .select('*')
    .order('provider', { ascending: true })
    .order('cost_type', { ascending: true })
    .order('model', { ascending: true });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{dict?.adminCosts?.title ?? 'AI Cost Rates'}</h1>
      <p className="text-muted-foreground mb-8">
        {dict?.adminCosts?.subtitle ??
          'Manage per-unit USD rates used by the pricing engine (75% cost / 25% margin).'}
      </p>
      <AdminManageCosts initialCosts={costs || []} />
    </div>
  );
}
