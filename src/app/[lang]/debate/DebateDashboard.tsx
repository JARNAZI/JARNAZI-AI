'use client';

import React, { useState, useEffect, useMemo } from 'react';
// workaround for React 18 types not having 'use'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const use = (React as any).use || ((p: any) => p);
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutTemplate, Menu, History, Zap, ChevronRight,
    MessageSquare, CreditCard, User, Phone, Sun,
    Moon, Globe, LogOut, Loader2, AlertCircle,
    CheckCircle2, Info, X,
    FileText, Image as ImageIcon, Video, Mic, Trash2, Shield
} from 'lucide-react';

// Dynamic imports for heavy components
const MediaUploader = dynamic(() => import('@/components/debate/MediaUploader').then(mod => mod.MediaUploader), { ssr: false });
const FilePreview = dynamic(() => import('@/components/debate/MediaUploader').then(mod => mod.FilePreview), { ssr: false });
const AudioRecorder = dynamic(() => import('@/components/debate/AudioRecorder').then(mod => mod.AudioRecorder), { ssr: false });
const AudioPreview = dynamic(() => import('@/components/debate/AudioRecorder').then(mod => mod.AudioPreview), { ssr: false });


import NotificationBell from '@/components/notifications/NotificationBell';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { LANGUAGES } from '@/i18n/config';

export default function DebateDashboard({
    params: propsParams,
    dict,
    supabaseUrl,
    supabaseAnonKey
}: {
    params: Promise<{ lang: string }>,
    dict: any,
    supabaseUrl?: string,
    supabaseAnonKey?: string
}) {
    const params = use(propsParams);
    const lang = params.lang;
    const d = dict?.dashboard || {};

    type DebateRecord = {
        id: string;
        topic?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        status?: string | null;
        final_answer?: string | null;
    };

    const [debates, setDebates] = useState<DebateRecord[]>([]);
    const supabase = useMemo(() => createClient({ supabaseUrl, supabaseAnonKey }), [supabaseUrl, supabaseAnonKey]);
    const [topicInput, setTopicInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [role, setRole] = useState<string | null>(null);

    // Advanced Input States

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setTheme, resolvedTheme } = useTheme();

    const handleThemeToggle = () => {
        const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        toast.info(dict.notifications?.themeSwitched?.replace('{theme}', nextTheme) || `Switched to ${nextTheme} mode`);
    };

    const handleLangToggle = (targetLang: string) => {
        if (targetLang === lang) return;
        const newPathname = pathname ? pathname.replace(`/${lang}`, `/${targetLang}`) : `/${targetLang}`;
        try { document.cookie = `NEXT_LOCALE=${targetLang}; path=/; max-age=${60 * 60 * 24 * 365}` } catch { }
        router.push(newPathname);
        toast.info(dict.notifications?.langSwitched?.replace('{lang}', targetLang === 'en' ? 'English' : 'Arabic') || `Language switched to ${targetLang === 'en' ? 'English' : 'Arabic'}`);
    };

    useEffect(() => {
        const purchase = searchParams.get('purchase');
        if (purchase) {
            if (purchase === 'success') {
                toast.success(dict.notifications?.paymentSuccess || 'Payment successful. Tokens added to your balance.');
            } else if (purchase === 'cancel') {
                toast.error(dict.notifications?.paymentCancel || 'Payment canceled.');
            } else if (purchase === 'failed') {
                toast.error(dict.notifications?.paymentFailed || 'Payment failed.');
            }
            // Clear the param
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('purchase');
            router.replace(`${pathname}?${newParams.toString()}`);
        }
    }, [searchParams, dict.notifications, router, pathname]);

    useEffect(() => {
        const fetchDebates = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Fetch generic role first
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (profile?.role) {
                        console.log("DebateDashboard: Role fetched from DB:", profile.role);
                        setRole(profile.role);
                    } else if (user.app_metadata?.role) {
                        console.log("DebateDashboard: Role found in App Metadata:", user.app_metadata.role);
                        setRole(user.app_metadata.role);
                    } else {
                        console.log("DebateDashboard: No role found for user", user.id);
                    }

                    const { data, error } = await supabase
                        .from('debates')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (data) setDebates(data);
                }
            } catch (err) {
                console.error("Error fetching sessions:", err);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchDebates();
    }, [supabase]);

    const handleCreate = async () => {
        if (!topicInput.trim() && !selectedFile && !recordedAudio || isLoading) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error(dict.notifications?.loginRequired || "Please login to start a debate");
                router.push(`/${lang}/login`);
                return;
            }

            let finalTopic = topicInput;

            // Append markers for attachments
            const attachments = [];
            if (selectedFile) attachments.push(`${selectedFile.type.split('/')[0]}=${selectedFile.name}`);
            if (recordedAudio) attachments.push(`audio=recorded_clip.webm`);

            if (attachments.length > 0) {
                finalTopic += `\n[Attachments: ${attachments.join(', ')}]`;
            }

            const response = await fetch('/api/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: finalTopic,
                    userId: user.id
                })
            });

            const data = await response.json();

            if (response.status === 402) {
                toast.error(dict.notifications?.insufficientTokens || "Insufficient tokens. Please top up to start a new debate.");
                router.push(`/${lang}/buy-tokens?returnUrl=${encodeURIComponent(`/${lang}/debate`)}`);
                return;
            }

            if (!response.ok) {
                console.error("Server Error:", data);
                const errorMsg = data.error || 'The AI Council is currently busy. Please try again in a moment.';
                toast.error(`${dict.notifications?.councilError || 'Council Error'}: ${errorMsg}`, {
                    duration: 5000,
                    icon: <AlertCircle className="w-5 h-5 text-red-500" />
                });
                return;
            }

            if (data && data.debateId) {
                toast.success(dict.notifications?.debateInitialized || "Consensus Initialized. Entering the Council chamber...");
                router.push(`/${lang}/debate/${data.debateId}`);
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (e: any) {
            console.error("Network Exception:", e);
            toast.error(dict.notifications?.networkFailure || "Network Failure: Check your connection or the server status.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.replace(`/${lang}/login`);
        toast.success(dict.notifications?.logoutSuccess || "Successfully logged out");
    }

    return (
        <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* --- HEADER --- */}
            <header className="h-20 flex-none flex items-center justify-between px-6 md:px-12 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-[60]">
                <div className="flex items-center gap-5">
                    <div className="relative w-10 h-10 md:w-12 md:h-12 group cursor-pointer" onClick={() => router.push(`/${lang}`)}>
                        <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <Image src="/logo.png" alt="Jarnazi Logo" width={48} height={48} className="relative rounded-xl md:rounded-2xl border border-white/10 shadow-2xl transition-transform group-hover:scale-105" />
                    </div>
                    <div className="hidden sm:block text-left">
                        <h1 className="text-sm md:text-md font-black tracking-widest uppercase leading-none mb-1">{dict?.common?.siteName || "Jarnazi AI Consensus"}</h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{d.commandConsole || "Command Console"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <NotificationBell supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} dict={dict} />
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-3 bg-muted hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all shadow-inner border border-border"
                        aria-label={d.openMenu || "Open Menu"}
                    >
                        <Menu className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 md:py-16">
                {/* Hero Input Area */}
                <div className="flex flex-col items-center justify-center py-6 md:py-12 mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-[4rem] blur-3xl -z-10 pointer-events-none" />

                    <h2 className="text-4xl md:text-6xl font-black text-center mb-6 tracking-tight leading-[1.1]">
                        {d.heroTitlePrefix || "Architecting"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">{d.heroTitleContent || "Consensus"}</span>
                    </h2>
                    <p className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-12 text-center max-w-xl">
                        {d.heroSubtitle || "Deploy your query. Orchestrate the global intellect."}
                    </p>

                    <div className="w-full max-w-3xl relative group">
                        {/* Glow Effect */}
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-focus-within:opacity-50 transition-opacity duration-700 animate-pulse" />

                        <div className="relative flex flex-col bg-card border border-border rounded-[2.5rem] p-4 md:p-6 shadow-2xl overflow-hidden">

                            {/* Toolbar Top - with scroll hint */}
                            <div className="relative mb-4">
                                <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-border pr-12">


                                    <div className="flex items-center gap-1 md:gap-2">
                                        <MediaUploader label={d.files || "Files"} icon={FileText} accept="*" onFileSelected={setSelectedFile} />
                                        <MediaUploader label={d.pics || "Pics"} icon={ImageIcon} accept="image/*" onFileSelected={setSelectedFile} />
                                        <MediaUploader label={d.video || "Video"} icon={Video} accept="video/*" onFileSelected={setSelectedFile} />
                                        <AudioRecorder onRecordingComplete={setRecordedAudio} label={d.audio || "Audio"} />
                                    </div>
                                </div>
                                {/* Mobile Scroll Hint Mask */}
                                <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
                            </div>

                            {/* Main Input Area */}
                            <div className="flex flex-col gap-4">
                                <div className="min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar bg-muted/50 rounded-2xl p-2">
                                    <textarea
                                        value={topicInput}
                                        onChange={(e) => setTopicInput(e.target.value)}
                                        placeholder={d.textPlaceholder || "What shall the Council deliberate today?"}
                                        className="w-full bg-transparent border-none text-foreground px-4 py-2 focus:ring-0 placeholder:text-muted-foreground/50 font-semibold outline-none text-lg resize-none min-h-[100px]"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleCreate();
                                            }
                                        }}
                                    />
                                </div>

                                {/* Previews */}
                                {(selectedFile || recordedAudio) && (
                                    <div className="flex flex-wrap items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2">
                                        {selectedFile && <FilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} />}
                                        {recordedAudio && <AudioPreview url={URL.createObjectURL(recordedAudio)} onRemove={() => setRecordedAudio(null)} />}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                                    <button
                                        onClick={handleCreate}
                                        disabled={(!topicInput.trim() && !selectedFile && !recordedAudio) || isLoading}
                                        className={`
                                            flex-1 w-full px-8 py-5 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4
                                            ${((!topicInput.trim() && !selectedFile && !recordedAudio) || isLoading)
                                                ? 'bg-muted text-muted-foreground/50 cursor-not-allowed border border-border shadow-inner'
                                                : 'bg-primary text-primary-foreground hover:bg-indigo-600 hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-indigo-500/10'}
                                        `}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {d.syncing || "Synchronizing Neural Net..."}
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 fill-current" />
                                                {d.initiateBtn || "Initiate Deliberation"}
                                            </>
                                        )}
                                    </button>
                                </div>


                            </div>
                        </div>

                        {/* Status Bar */}
                        <div className="mt-6 px-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-zinc-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    {d.systemsOperational || "Systems: Operational"}
                                </span>
                                <span className="hidden md:flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-muted-foreground">
                                    <Info className="w-3 h-3 text-indigo-500" /> {d.secureRouting || "Secure Multi-Model Routing"}
                                </span>
                            </div>
                            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground bg-muted px-4 py-1.5 rounded-full border border-border">
                                {d.latency || "Latency"}: 42ms
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-16" />

                {/* Recent Sessions */}
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-left">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">{d.libraryTitle || "Consensus Library"}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{d.librarySubtitle || "Historical Deliberative Records"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-muted px-5 py-2 rounded-xl text-muted-foreground border border-border shadow-inner uppercase">
                            {debates.length} {d.indexedSessions || "INDEXED SESSIONS"}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isInitialLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-64 bg-card border border-border rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : (
                        debates.map((debate) => (
                            <Link key={debate.id} href={`/${lang}/debate/${debate.id}`} className="group relative p-[1px] rounded-[2.5rem] overflow-hidden hover:scale-[1.03] active:scale-[0.97] transition-all duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-transparent to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative h-full bg-card p-8 rounded-[2.4rem] border border-border group-hover:bg-card/80 group-hover:border-primary/50 transition-all flex flex-col justify-between shadow-2xl">
                                    <div>
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:rotate-6 transition-all duration-700 ring-1 ring-border shadow-inner">
                                                <MessageSquare className="w-7 h-7 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-[10px] font-black text-muted-foreground bg-background px-4 py-1.5 rounded-full uppercase tracking-widest border border-border shadow-inner">
                                                    {new Date(debate.created_at || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${debate.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${debate.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {debate.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black text-foreground/80 group-hover:text-foreground mb-4 line-clamp-2 leading-tight tracking-tighter transition-colors">
                                            {debate.topic}
                                        </h4>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between pt-8 border-t border-border">
                                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-indigo-400 transition-all duration-300">
                                            {d.enterTerminal || "Enter Terminal"} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <div className="flex -space-x-3">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-background shadow-lg flex items-center justify-center text-[9px] font-black text-white ${i === 0 ? 'bg-indigo-600' : i === 1 ? 'bg-purple-600' : 'bg-cyan-600'}`}>
                                                    A{i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}

                    {!isInitialLoading && debates.length === 0 && (
                        <div className="col-span-full py-32 text-center border border-dashed border-border rounded-[3.5rem] bg-card/10">
                            <History className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-30" />
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em]">{d.emptyLibrary || "Historical Database Empty"}</p>
                            <p className="text-muted-foreground/50 text-[9px] font-bold mt-3 uppercase tracking-[0.2em] max-w-xs mx-auto">{d.emptyLibraryDesc || "Initiate a deliberation to begin neural indexing"}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* DASHBOARD MENU OVERLAY */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500" onClick={() => setIsMenuOpen(false)} />
                    <div className="relative w-full max-w-sm h-full bg-background border-l border-border shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)] p-8 flex flex-col animate-in slide-in-from-right duration-500 ease-out">
                        <div className="flex items-center justify-between mb-12 border-b border-border pb-8">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-indigo-500/20 rounded-[1.25rem] ring-1 ring-primary/50">
                                    <LayoutTemplate className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-md font-black uppercase tracking-[0.2em] text-foreground">{d.nodeConsole || "Node Console"}</h2>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{d.version || "Version Stable"} 1.0.0</p>
                                </div>
                            </div>
                            <button onClick={() => setIsMenuOpen(false)} className="p-3 rounded-2xl bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border active:scale-95">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar text-left font-black">
                            {role === 'admin' && (
                                <>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 mt-2 ml-4">{d.systemAccess || "System Access"}</p>
                                    <Link href={`/${lang}/admin`} className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-red-500/5 hover:bg-red-500/10 active:bg-red-500/15 border border-red-500/10 group transition-all" onClick={() => setIsMenuOpen(false)}>
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase tracking-widest text-[12px] text-red-500 group-hover:text-red-600">{dict?.adminDashboard?.title || "Admin Dashboard"}</span>
                                            <span className="text-[9px] font-bold text-red-500/50 uppercase tracking-tight">{d.privilegedAccess || "Privileged Access Only"}</span>
                                        </div>
                                    </Link>
                                    <div className="my-6 h-px bg-border" />
                                </>
                            )}
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 mt-2 ml-4">{d.terminalRouting || "Terminal Routing"}</p>

                            <Link href={`/${lang}/neural-hub`} className="flex items-center gap-5 p-5 rounded-[1.5rem] hover:bg-muted active:bg-secondary group transition-all" onClick={() => setIsMenuOpen(false)}>
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[12px] text-muted-foreground group-hover:text-foreground">{d.neuralHub || "Neural Hub"}</span>
                            </Link>

                            <Link href={`/${lang}/debate/saved`} className="flex items-center gap-5 p-5 rounded-[1.5rem] hover:bg-muted active:bg-secondary group transition-all" onClick={() => setIsMenuOpen(false)}>
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                    <History className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[12px] text-muted-foreground group-hover:text-foreground">{d.archiveVault || "Archive Vault"}</span>
                            </Link>

                            <div className="my-10 h-px bg-border" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 ml-4">{d.resourceManagement || "Resource Management"}</p>

                            <button
                                onClick={() => {
                                    console.log("[Dev] Navigating to Usage");
                                    setIsMenuOpen(false);
                                    router.push(`/${lang}/debate/usage`);
                                }}
                                className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] border border-primary/30 bg-primary/5 hover:bg-primary/10 active:bg-primary/20 group transition-all shadow-xl shadow-primary/5 text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5 fill-current" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black uppercase tracking-widest text-[12px] text-foreground">{d.liquidityStatus || "Liquidity Status"}</span>
                                    <span className="text-[9px] font-black text-primary uppercase tracking-tighter mt-0.5">{d.tokenBalance || "Token Balance"}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    console.log("[Dev] Navigating to Buy Tokens");
                                    setIsMenuOpen(false);
                                    router.push(`/${lang}/buy-tokens`);
                                }}
                                className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] hover:bg-muted active:bg-secondary group transition-all text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[12px] text-muted-foreground group-hover:text-foreground">{d.allocateBudget || "Allocate Budget"}</span>
                            </button>

                            <button
                                onClick={() => {
                                    console.log("[Dev] Navigating to Profile Settings");
                                    setIsMenuOpen(false);
                                    router.push(`/${lang}/profile/settings`);
                                }}
                                className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] hover:bg-muted active:bg-secondary group transition-all text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                    <User className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[12px] text-muted-foreground group-hover:text-foreground">{d.userMatrix || "User Matrix"}</span>
                            </button>

                            <div className="my-10 h-px bg-border" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 ml-4">{d.globalSettings || "Global Matrix Settings"}</p>

                            <button
                                onClick={handleThemeToggle}
                                className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] hover:bg-muted active:bg-secondary group transition-all text-left"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${resolvedTheme === 'dark' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'} group-hover:scale-110`}>
                                    {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </div>
                                <span className="font-black uppercase tracking-widest text-[12px] text-muted-foreground group-hover:text-foreground leading-none pt-1">
                                    {resolvedTheme === 'dark' ? (d.solarSpectrum || 'Solar Spectrum') : (d.lunarSpectrum || 'Lunar Spectrum')}
                                </span>
                            </button>

                            <div className="relative group">
                                <div className="flex items-center gap-5 p-5 rounded-[1.5rem] hover:bg-muted group transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-black uppercase tracking-widest text-[12px] text-muted-foreground">{d.interfaceLocale || "Interface Locale"}</span>
                                        <div className="flex flex-wrap gap-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                            {LANGUAGES.map((l: any) => (
                                                <button
                                                    key={l.code}
                                                    onClick={() => handleLangToggle(l.code)}
                                                    className={`text-[9px] font-black px-3 py-2 rounded-lg border transition-all ${lang === l.code ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {l.name.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="my-10 h-px bg-border" />

                            <button onClick={handleLogout} className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] hover:bg-red-500/5 active:bg-red-500/10 group transition-all text-left">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[12px] text-red-500 group-hover:text-red-600">{d.deauthorize || "Deauthorize"}</span>
                            </button>
                        </nav>

                        <div className="mt-12 p-8 bg-muted shadow-inner rounded-[2.5rem] border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <p className="text-[11px] text-foreground font-black uppercase tracking-[0.2em]">{d.neuralLinkSecure || "Neural Link Secure"}</p>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">
                                {d.encryptedStream || "End-to-end encrypted deliberation stream."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
