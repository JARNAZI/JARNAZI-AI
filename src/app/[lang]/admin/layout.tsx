import Link from "next/link";
import Image from "next/image";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar Placeholder */}
            <aside className="w-64 border-r border-gray-800 bg-gray-900/50 p-6 hidden md:block">
                <Link href="/admin" className="flex items-center gap-2 mb-8 group">
                    <Image
                        src="/logo.jpg"
                        alt="Jarnazi Logo"
                        width={32}
                        height={32}
                        className="rounded shadow-[0_0_10px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xl font-bold text-white flex items-center">
                        JARNAZI<span className="text-red-500 text-xs ml-1">ADMIN</span>
                    </div>
                </Link>
                <nav className="space-y-4">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Core</div>
                    <Link href="/admin/users" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Users</Link>
                    <Link href="/admin/messages" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Messages</Link>
                    <Link href="/admin/api-status" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">API Status</Link>

                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider pt-4">Configuration</div>
                    <Link href="/admin/providers" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">AI Providers</Link>
                    <Link href="/admin/settings" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Settings & Plans</Link>
                </nav>
            </aside>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
