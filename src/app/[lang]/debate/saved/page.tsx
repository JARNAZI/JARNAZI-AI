import { getDictionary } from '@/i18n/get-dictionary';
import SavedAssetsClient from './SavedAssetsClient';

export default async function SavedAssetsPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang);

    return (
        <SavedAssetsClient
            lang={params.lang}
            dict={dict}
        />
    );
}

