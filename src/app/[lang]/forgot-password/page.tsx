import { getDictionary } from "@/i18n/get-dictionary";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return <ForgotPasswordClient lang={lang} dict={dict} supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />;
}

