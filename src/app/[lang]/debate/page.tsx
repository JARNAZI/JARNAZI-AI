import { getDictionary } from '@/i18n/get-dictionary';
import DebateDashboard from './DebateDashboard';

export const dynamic = 'force-dynamic';

export default async function DebatePage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return (
        <DebateDashboard
            params={props.params}
            dict={dict}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
        />
    );
}
