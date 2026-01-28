import { getDictionary } from '@/i18n/get-dictionary';
import LoginClient from './LoginClient';

export default async function LoginPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    return (
        <LoginClient
            lang={params.lang}
            dict={dict}
        />
    );
}

