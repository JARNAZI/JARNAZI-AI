import { getDictionary } from '@/i18n/get-dictionary';
import RegisterClient from './RegisterClient';

export default async function RegisterPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang as any);

    return (
        <RegisterClient
            lang={params.lang}
            dict={dict}
        />
    );
}
