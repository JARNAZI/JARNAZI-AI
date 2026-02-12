import { getDictionary } from '@/i18n/get-dictionary';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    // Runtime injection: Read from process.env on the server (Cloud Run) and pass to client
    // Support both naming conventions (env.example vs ENV_SETUP) to prevent "Key Missing"
    const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return (
        <LoginClient
            lang={params.lang}
            dict={dict}
            siteKey={turnstileSiteKey}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
        />
    );
}

