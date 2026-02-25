import { getDictionary } from '@/i18n/get-dictionary';
import ProfileSettingsClient from './ProfileSettingsClient';

export default async function ProfileSettingsPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return (
        <ProfileSettingsClient
            lang={params.lang}
            dict={dict}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
        />
    );
}

