import { getDictionary } from '@/i18n/get-dictionary';
import RegisterClient from './RegisterClient';

export default async function RegisterPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    // Runtime injection: Read from process.env on the server (Cloud Run) and pass to client
    // Support both naming conventions (env.example vs ENV_SETUP) to prevent "Key Missing"
    const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY;

    return (
        <RegisterClient
            lang={params.lang}
            dict={dict}
            siteKey={turnstileSiteKey}
        />
    );
}

