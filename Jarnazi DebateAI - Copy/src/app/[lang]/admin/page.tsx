import Link from 'next/link';

export default async function AdminDashboard(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-8">
                Super Admin Console
            </h1>

            <div className="grid md:grid-cols-4 gap-6">
                {/* Placeholder cards */}
                {[
                    { title: 'Plans', href: '/admin/providers', desc: 'Manage subscription plans' },
                    { title: 'User Management', href: '/admin/users', desc: 'Control access & tokens' },
                    { title: 'API Status', href: '/admin/api-status', desc: 'Check API configuration' },
                    { title: 'Financials', href: '/admin/financials', desc: 'Revenue & subscriptions' },
                    { title: 'System Health', href: '/admin/health', desc: 'Server status & logs' },
                    { title: 'Site Settings', href: '/admin/settings', desc: 'Privacy, Terms & Branding' }
                ].map((item) => (
                    <Link key={item.title} href={item.href} className="p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer group">
                        <h3 className="font-semibold text-gray-200 group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt-2">{item.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
