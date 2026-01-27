import Link from 'next/link';
import { getDictionary } from '@/i18n/get-dictionary';


export default async function AdminDashboard({ params }: { params: { lang: string } }) {
    const lang = params.lang;
    const dict = await getDictionary(lang);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-8">
                {dict.adminDashboard.title}
            </h1>

            <div className="grid md:grid-cols-4 gap-6">
                {/* Placeholder cards */}
                {[
                    { title: dict.adminDashboard.cards.providersTitle, href: `/${lang}/admin/providers`, desc: dict.adminDashboard.cards.providersDesc },
                    { title: dict.adminDashboard.cards.usersTitle, href: `/${lang}/admin/users`, desc: dict.adminDashboard.cards.usersDesc },
                    { title: dict.adminDashboard.cards.apiStatusTitle, href: `/${lang}/admin/api-status`, desc: dict.adminDashboard.cards.apiStatusDesc },
                    { title: dict.adminDashboard.cards.financialsTitle, href: `/${lang}/admin/financials`, desc: dict.adminDashboard.cards.financialsDesc },
                    { title: dict.adminDashboard.cards.healthTitle, href: `/${lang}/admin/health`, desc: dict.adminDashboard.cards.healthDesc },
                    { title: dict.adminDashboard.cards.settingsTitle, href: `/${lang}/admin/settings`, desc: dict.adminDashboard.cards.settingsDesc },
                ].map((item) => (
                    <Link key={item.title} href={item.href} className="p-6 rounded-xl bg-card/60 border border-border hover:border-border/80 transition-colors cursor-pointer group">
                        <h3 className="font-semibold text-foreground group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}