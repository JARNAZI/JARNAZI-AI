import { getDictionary } from '@/i18n/get-dictionary';
import LoginClient from './LoginClient';

export default async function LoginPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    // Runtime injection: Read from process.env on the server (Cloud Run) and pass to client
    const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY;

    return (
        <LoginClient
            lang={params.lang}
            dict={dict}
            siteKey={turnstileSiteKey}
        />
    );
}

