import { getDictionary } from '@/i18n/get-dictionary';
import DebateClient from './DebateClient';

export default async function DebatePage(props: { params: Promise<{ lang: string, id: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return (
        <DebateClient
            lang={params.lang}
            dict={dict}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
        />
    );
}

