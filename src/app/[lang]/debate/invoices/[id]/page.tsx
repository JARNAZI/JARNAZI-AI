import { getDictionary } from '@/i18n/get-dictionary';
import InvoiceDetailClient from './InvoiceDetailClient';

export default async function InvoiceDetailPage(props: { params: Promise<{ lang: string, id: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return (
        <InvoiceDetailClient
            id={params.id}
            lang={params.lang}
            dict={dict}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
        />
    );
}
