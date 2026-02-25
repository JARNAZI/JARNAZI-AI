import { getDictionary } from '@/i18n/get-dictionary';
import ProcessingClient from './ProcessingClient';

export const dynamic = 'force-dynamic';

export default async function ProcessingPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    return (
        <ProcessingClient
            dict={dict}
            lang={params.lang}
        />
    );
}
