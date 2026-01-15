import { getDictionary } from '@/i18n/get-dictionary';
import DebateClient from './DebateClient';

export default async function DebatePage(props: { params: Promise<{ lang: string, id: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang as any);

    return (
        <DebateClient
            lang={params.lang}
            dict={dict}
        />
    );
}
