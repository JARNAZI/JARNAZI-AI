'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, LayoutTemplate, Menu, History, ExternalLink, Zap, ChevronRight, MessageSquare, Play } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function DebateDashboard(props: { params: Promise<{ lang: string }> }) {
    const params = use(props.params);
    const [debates, setDebates] = useState<any[]>([]);
    const [supabase] = useState(() => createClient());
    const [topicInput, setTopicInput] = useState('');
    const router = useRouter();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchDebates = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('debates').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                if (data) setDebates(data);
            }
        };
        fetchDebates();
    }, []);

    const handleCreate = async () => {
        if (!topicInput.trim()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Use the API Route to trigger the Orchestrator
            const response = await fetch('/api/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topicInput,
                    userId: user.id
                })
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Failed to init debate:", err);
                // Alert user
                alert(`Error: ${err.error || 'Failed to start debate'}`);
                return;
            }

            const data = await response.json();
            if (data && data.debateId) {
                router.push(`/${params.lang}/debate/${data.debateId}`);
            }
        } catch (e) {
            console.error("Network error creating debate:", e);
            alert("Network error. Please try again.");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`/${params.lang}/login`);
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* --- HEADER --- */}
            <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5 bg-[#080808]/90 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-5">
                    <div className="relative w-12 h-12 group cursor-pointer" onClick={() => router.push(`/${params.lang}`)}>
                        <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <Image src="/logo.png" alt="Full Logo" width={48} height={48} className="relative rounded-2xl border border-white/10 shadow-2xl transition-transform group-hover:scale-105" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-widest text-white uppercase leading-none mb-1">Jarnazi AI Consensus</h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Command Console</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Hero Input */}
                <div className="flex flex-col items-center justify-center py-16 mb-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-[4rem] blur-3xl -z-10 pointer-events-none" />

                    <h2 className="text-3xl md:text-5xl font-black text-center mb-4 tracking-tight">
                        Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Consensus</span>
                    </h2>
                    <p className="text-zinc-500 text-sm md:text-base font-medium uppercase tracking-widest mb-10 text-center max-w-lg">
                        Define a topic. The AI Council will deliberate.
                    </p>

                    <div className="w-full max-w-2xl relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition-opacity duration-500" />
                        <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl">
                            <input
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                placeholder="E.g., 'Is universal basic income strictly necessary for AI economies?'"
                                className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder:text-zinc-700 font-medium outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                            <button
                                onClick={handleCreate}
                                className="px-6 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4 fill-current" /> Initialize
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Recent Sessions</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-zinc-500">{debates.length} TOTAL</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {debates.map((debate) => (
                        <Link key={debate.id} href={`/${params.lang}/debate/${debate.id}`} className="group relative p-[1px] rounded-3xl overflow-hidden hover:scale-[1.01] transition-transform">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative h-full bg-[#111] p-6 rounded-[23px] border border-white/5 group-hover:bg-[#151515] transition-colors flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                            <MessageSquare className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-600 bg-black/40 px-2 py-1 rounded-full uppercase tracking-wider border border-white/5">
                                            {new Date(debate.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-zinc-200 group-hover:text-white mb-2 line-clamp-2 leading-tight">
                                        {debate.topic}
                                    </h4>
                                </div>

                                <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-indigo-400 transition-colors">
                                    Resume Session <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {debates.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest">No active intelligence sessions found</p>
                        </div>
                    )}
                </div>
            </main>

            {/* DASHBOARD MENU OVERLAY */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
                    <div className="relative w-80 h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">Console Menu</h2>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-colors">
                                <LayoutTemplate className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex-1 space-y-2">
                            <Link href={`/${params.lang}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 text-zinc-300 transition-colors">
                                <span className="font-bold uppercase tracking-wider text-xs">Home</span>
                            </Link>

                            <Link href={`/${params.lang}/buy-tokens`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 text-zinc-300 transition-colors">
                                <CreditCard className="w-5 h-5 text-indigo-500" />
                                <span className="font-bold uppercase tracking-wider text-xs">Buy Tokens</span>
                            </Link>

                            <Link href={`/${params.lang}/profile`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 text-zinc-300 transition-colors">
                                <User className="w-5 h-5 text-indigo-500" />
                                <span className="font-bold uppercase tracking-wider text-xs">Edit User Data</span>
                            </Link>

                            <Link href={`/${params.lang}/contact`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 text-zinc-300 transition-colors">
                                <Phone className="w-5 h-5 text-indigo-500" />
                                <span className="font-bold uppercase tracking-wider text-xs">Contact Us</span>
                            </Link>

                            <hr className="border-white/5 my-2" />

                            <button
                                onClick={() => handleThemeToggle()}
                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 text-zinc-300 transition-colors text-left"
                            >
                                {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-zinc-400" />}
                                <span className="font-bold uppercase tracking-wider text-xs">{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>

                            <button
                                onClick={() => handleLangToggle()}
                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 text-zinc-300 transition-colors text-left"
                            >
                                <Globe className="w-5 h-5 text-blue-500" />
                                <span className="font-bold uppercase tracking-wider text-xs">Change Language ({params.lang === 'en' ? 'Arabic' : 'English'})</span>
                            </button>

                            <hr className="border-white/5 my-2" />

                            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-left">
                                <LogOut className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-wider text-xs">Logout</span>
                            </button>
                        </nav>

                        <div className="mt-auto p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Jarnazi AI v1.0.0</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
