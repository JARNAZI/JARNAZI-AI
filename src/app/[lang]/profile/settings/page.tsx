import { getDictionary } from '@/i18n/get-dictionary';
import ProfileSettingsClient from './ProfileSettingsClient';

export default async function ProfileSettingsPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const dict = await getDictionary(params.lang as any);

    return (
        <ProfileSettingsClient
            lang={params.lang}
            dict={dict}
        />
    );
}
