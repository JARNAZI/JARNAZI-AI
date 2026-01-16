import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Avoid returning different shapes from a ternary (which can produce `unknown` unions).
    let profileRole: string | null = null;
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        profileRole = (data?.role as string | null) ?? null;
    }

    const role = profileRole ?? 'user';
    const isSupport = role === 'support';

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
                    {!isSupport && (
                        <Link href="/admin/users" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Users</Link>
                    )}
                    <Link href="/admin/messages" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Messages</Link>
                    {!isSupport && (
                        <Link href="/admin/api-status" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">API Status</Link>
                    )}

                    {!isSupport && (
                        <>
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider pt-4">Configuration</div>
                            <Link href="/admin/models" className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Models</Link>
                            <Link href="/admin/providers" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">AI Providers</Link>
                            <Link href="/admin/settings" className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Settings & Plans</Link>
                        </>
                    )}
                </nav>
            </aside>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
