import { getDictionary } from "@/i18n/get-dictionary";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    return <ForgotPasswordClient lang={lang} dict={dict} supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} siteKey={turnstileSiteKey} />;
}

