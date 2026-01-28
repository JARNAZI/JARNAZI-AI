import { getDictionary } from '@/i18n/get-dictionary';
import UsageClient from './UsageClient';

export default async function UsagePage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    return (
        <UsageClient
            lang={params.lang}
            dict={dict}
        />
    );
}

