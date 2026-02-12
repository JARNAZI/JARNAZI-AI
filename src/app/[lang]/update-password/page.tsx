import { getDictionary } from "@/i18n/get-dictionary";
import UpdatePasswordClient from "./UpdatePasswordClient";

export const dynamic = 'force-dynamic';

export default async function UpdatePasswordPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return (
        <UpdatePasswordClient
            lang={lang}
            dict={dict}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
        />
    );
}
