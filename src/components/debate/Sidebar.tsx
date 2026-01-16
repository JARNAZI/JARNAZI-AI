"use client";

import Link from "next/link";
import { Settings, CreditCard, LogOut, History, Plus, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface SidebarProps {
    lang: string;
    dict: any;
}

export default function Sidebar({ lang, dict }: SidebarProps) {
    const router = useRouter();
    const params = useParams();
    const currentId = params?.id as string;
    const [supabase] = useState(() => createClient());
    const [recentDebates, setRecentDebates] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecent = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('debates')
                .select('id, topic, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setRecentDebates(data);
        };

        fetchRecent();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push(`/${lang}/login`);
    };

    return (
        <aside className="hidden md:flex w-72 h-full border-r border-white/5 bg-[#0a0a0a] flex-col z-30">
            {/* Logo area */}
            <div className="p-6">
                <Link href={`/${lang}/debate`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                        <Compass className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-white tracking-tighter leading-none text-lg">JARNAZI</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Consensus AI</span>
                    </div>
                </Link>
            </div>

            {/* Main Action */}
            <div className="px-4 mb-8">
                <Link
                    href={`/${lang}/debate`}
                    className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[1.2rem] text-sm font-bold text-white transition-all shadow-xl group"
                >
                    <Plus className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform" />
                    New Intelligence Session
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar">
                <div>
                    <h4 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Historical Archive</h4>
                    <nav className="space-y-1">
                        {recentDebates.map((debate) => (
                            <Link
                                key={debate.id}
                                href={`/${lang}/debate/${debate.id}`}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all group ${currentId === debate.id
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                                    }`}
                            >
                                <History className={`w-4 h-4 shrink-0 ${currentId === debate.id ? 'text-primary' : 'group-hover:text-zinc-300'}`} />
                                <span className="truncate font-medium">{debate.topic}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div>
                    <h4 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Control Panel</h4>
                    <nav className="space-y-1">
                        <Link href={`/${lang}/debate/pricing`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all text-sm font-medium">
                            <CreditCard className="w-4 h-4" />
                            {dict.sidebar.plans}
                        </Link>
                        <Link href={`/${lang}/debate/settings`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all text-sm font-medium">
                            <Settings className="w-4 h-4" />
                            {dict.sidebar.settings}
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all w-full font-bold text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
