import { getDictionary } from "@/i18n/get-dictionary";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as any);

    return <ForgotPasswordClient lang={lang} dict={dict} />;
}
