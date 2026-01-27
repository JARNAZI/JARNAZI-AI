import { getDictionary } from '@/i18n/get-dictionary';
import DebateDashboard from './DebateDashboard';

export default async function DebatePage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang as any);

    return (
        <DebateDashboard
            params={props.params}
            dict={dict}
        />
    );
}