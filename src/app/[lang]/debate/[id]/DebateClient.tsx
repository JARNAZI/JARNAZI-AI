'use client';

// --- IMPORTS ---
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';

// ICONS
import {
    Menu, Send, Type, Image as ImageIcon, Video, FileText,
    Printer, Download, Copy, ArrowLeft, MoreHorizontal,
    Sigma, User, CreditCard, LogOut, Sun, Moon, PlusCircle,
    Globe, Phone, History, Keyboard, Trash2
} from 'lucide-react';

// REMOVED LOCAL TYPE DEF - moved to src/types/mathlive.d.ts

// COMPONENTS
import { MediaUploader, FilePreview } from '@/components/debate/MediaUploader';
import { AudioRecorder, AudioPreview } from '@/components/debate/AudioRecorder';
import { MathInput } from '@/components/math/MathInput';
import { NotificationSystem } from '@/components/debate/NotificationSystem';
import { MathDisplay } from '@/components/math/MathDisplay';

// --- TYPES ---
type Message = {
    id: string;
    role: 'user' | 'assistant' | 'agreement' | 'system';
    name: string;
    content: string;
    timestamp: number;
    attachments?: Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name: string }>;
};

// --- MAIN CLIENT COMPONENT ---
export default function DebateClient({ dict, lang }: { dict: any; lang: string }) {
    const params = useParams();
    const router = useRouter();
    const debateId = params.id as string;
    // ... (rest of simple init)
    const [supabase] = useState(() => createClient());




    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputContent, setInputContent] = useState('');
    const [isMathMode, setIsMathMode] = useState(false);
    const { theme, setTheme } = useTheme();
    const isDarkMode = theme === 'dark';
    const handleLangToggle = () => {
        const next = lang === 'en' ? 'ar' : 'en';
        router.push(`/${next}/debate/${debateId}`);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`/${lang}/`);
    };

    const handleDeleteAccount = async () => {
        const ok = confirm(dict?.debate?.confirmDeleteAccount || 'Are you sure you want to delete your account? This cannot be undone.');
        if (!ok) return;
        try {
            const res = await fetch('/api/account/delete', { method: 'POST' });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Failed to delete account');
            await supabase.auth.signOut();
            router.push(`/${lang}/`);
        } catch (e: any) {
            alert(e.message);
        }
    };

        const [profileInfo, setProfileInfo] = useState<{ token_balance: number; subscription_tier?: string | null } | null>(null);
const [isMenuOpen, setIsMenuOpen] = useState(false); // top-right dropdown

    const [showFinalOnly, setShowFinalOnly] = useState(false);
    const [debateTopic, setDebateTopic] = useState<string>('');
    const [initializingCouncil, setInitializingCouncil] = useState(false);

    // Attachments State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const { data: debate } = await supabase.from('debates').select('topic').eq('id', debateId).single();
            if (debate?.topic) setDebateTopic(debate.topic);

            const { data: turns } = await supabase.from('debate_turns').select('*').eq('debate_id', debateId).order('created_at', { ascending: true });
            if (turns && turns.length > 0) {
                setMessages(turns.map(t => ({
                    id: t.id,
                    role: (() => {
                        const name = t.ai_name_snapshot || '';
                        if (name === 'User') return 'user';
                        if (name.toLowerCase().includes('leader')) return 'agreement';
                        return 'assistant';
                    })(),
                    name: t.ai_name_snapshot || 'Council',
                    content: t.content,
                    timestamp: new Date(t.created_at).getTime()
                })));
            } else {
                setMessages([{ id: 'welcome', role: 'system', name: 'System', content: 'Session Initialized. The Council is ready.', timestamp: Date.now() }]);
            }
        };
        init();

        // Realtime Subscription
        const channel = supabase.channel(`debate:${debateId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_turns', filter: `debate_id=eq.${debateId}` },
                (payload) => {
                    const newTurn = payload.new;
                    setMessages(prev => {
                        if (prev.find(p => p.id === newTurn.id)) return prev;
                        return [...prev, {
                            id: newTurn.id,
                            role: (() => {
                        const name = newTurn.ai_name_snapshot || '';
                        if (name === 'User') return 'user';
                        if (name.toLowerCase().includes('leader')) return 'agreement';
                        return 'assistant';
                    })(),
                            name: newTurn.ai_name_snapshot,
                            content: newTurn.content,
                            timestamp: Date.now()
                        }];
                    });
                })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [debateId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleInitialize = async () => {
        if (!debateTopic || initializingCouncil) return;
        // Don't re-run if we already have assistant/agreement turns
        if (messages.some(m => m.role === 'assistant' || m.role === 'agreement')) return;
        try {
            setInitializingCouncil(true);
            await supabase.functions.invoke('ai-orchestrator', {
                body: {
                    debateId,
                    prompt: debateTopic,
                    mode: 'text',
                }
            });
        } catch (e) {
            console.error('Initialize error', e);
        } finally {
            setInitializingCouncil(false);
        }
    };

    const handlePrint = (content: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><body><div style="font-family: sans-serif; white-space: pre-wrap; padding: 20px;">${content}</div></body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // Send Handler
    const handleSend = async () => {
        if (!inputContent.trim() && !selectedFile && !recordedAudio) return;

        // 1. Prepare Content & Enforce LaTeX
        let contentToSend = inputContent;

        // --- LATEX ENFORCEMENT RULE ---
        // --- LATEX ENFORCEMENT RULE ---
        if (isMathMode) {
            // Wrap in delimiters for MathLive/AI recognition
            // If already wrapped, leave it. If not, wrap it.
            const trimmed = contentToSend.trim();
            if (!trimmed.startsWith('$$')) {
                contentToSend = `$$${trimmed}$$`;
            }
        }

        if (selectedFile) contentToSend += `\n[FILE: ${selectedFile.name}]`;
        if (recordedAudio) contentToSend += `\n[AUDIO_CLIP]`;

        // 2. Optimistic Update
        const tempId = Date.now().toString();
        const newMsg: Message = {
            id: tempId,
            role: 'user',
            name: 'User',
            content: contentToSend + (isMathMode ? "" : ""), // Store the delimited content directly
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMsg]);
        setInputContent('');
        setSelectedFile(null);
        setRecordedAudio(null);

        try {
            // 3. Insert User Message to DB
            const { error: dbError } = await supabase.from('debate_turns').insert({
                debate_id: debateId,
                content: contentToSend,
                ai_name_snapshot: 'User',
                ai_provider_id: null,
                sequence_index: Date.now()
            });

            if (dbError) throw dbError;

            // 4. Trigger AI Orchestrator (Server-Side)
            await supabase.functions.invoke('ai-orchestrator', {
                body: {
                    prompt: contentToSend,
                    debateId: debateId,
                    systemMessage: "You are a debate moderator. Analyze the user's argument and coordinate AI responses. IMPORTANT: For any mathematical expressions, YOU MUST use LaTeX formatting enclosed in single dollar signs ($) for inline math and double dollar signs ($$) for block math."
                }
            });

        } catch (err) {
            console.error(err);
            // alert("Failed to send message: Check console");
        }
    };

    const visibleMessages = showFinalOnly ? messages.filter(m => m.role === 'agreement') : messages;

    return (
        <div className={`flex flex-col h-[100dvh] ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} font-sans overflow-hidden transition-colors duration-300`}>

            {/* HEADER */}
            <header className={`flex-none h-16 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-4 z-[60] relative shadow-md transition-colors`}>
                <div className="flex items-center gap-3">
                    <Link href={`/${lang}/debate`} className="p-2 hover:bg-zinc-500/10 rounded-full cursor-pointer transition-colors">
                        <ArrowLeft className="w-5 h-5 opacity-70" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-wider select-none">{dict.debate?.consoleTitle || 'Jarnazi Consensus'}</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-emerald-500 font-mono select-none">ONLINE</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* START NEW SESSION ICON */}
                    <Link href={`/${lang}/debate`} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30' : 'bg-indigo-100 text-indigo-600'}`} title="Start New Session">
                        <PlusCircle className="w-4 h-4" />
                    </Link>

                    {/* Notification System */}
                    <NotificationSystem dict={dict} />

                    <div className={`w-px h-6 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'} mx-1`} />

                    <button
                        onClick={() => setIsMenuOpen(v => !v)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white cursor-pointer relative z-50 shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
                        aria-label="Open Menu"
                        title="Open Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

{/* Top-right dropdown menu */}
{isMenuOpen && (
    <div
        className={`absolute right-4 top-16 w-72 rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-gray-200'} shadow-2xl overflow-hidden`}
    >
        <div className={`px-4 py-3 ${isDarkMode ? 'bg-zinc-900/60' : 'bg-gray-50'} flex items-center justify-between`}>
            <span className={`text-xs font-black tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{dict?.debate?.menu || 'MENU'}</span>
            <button
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-800'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
            >
                {dict?.common?.close || 'Close'}
            </button>
        </div>

        <div className="p-2">
            <Link href={`/${lang}/plans`} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.debate?.plans || dict?.common?.plans || 'Plans'}</span>
            </Link>

            <Link href={`/${lang}/profile`} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                <User className="w-5 h-5 text-emerald-500" />
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.common?.profile || dict?.debate?.editProfile || 'Edit Profile'}</span>
            </Link>

            <Link href={`/${lang}/contact`} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                <Mail className="w-5 h-5 text-sky-500" />
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.common?.contact || dict?.debate?.contactUs || 'Contact'}</span>
            </Link>

            <div className={`my-2 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} />

            <button onClick={handleLangToggle} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                <Globe className="w-5 h-5 text-indigo-500" />
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.common?.language || dict?.debate?.language || 'Language'}</span>
                <span className={`ml-auto text-[10px] font-black px-2 py-1 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-200 text-gray-700'}`}>{lang === 'en' ? 'EN' : 'AR'}</span>
            </button>

            <button onClick={() => setTheme(isDarkMode ? 'light' : 'dark')} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.common?.theme || dict?.debate?.theme || 'Theme'}</span>
            </button>

            <div className={`my-2 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} />

            <div className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                <Coins className="w-5 h-5 text-amber-400" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider">{dict?.debate?.currentPlan || 'Current Plan'}</span>
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(profileInfo?.subscription_tier || dict?.common?.unknown || '—')}
                        <span className={`ml-2 text-[10px] font-black px-2 py-1 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-200 text-gray-700'}`}>
                            ${((profileInfo?.token_balance ?? 0) / 100).toFixed(2)}
                        </span>
                    </span>
                </div>
            </div>

            <div className={`my-2 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} />

            <button onClick={handleLogout} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                <LogOut className="w-5 h-5 text-gray-500" />
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.common?.logout || 'Logout'}</span>
            </button>

            <button onClick={handleDeleteAccount} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-red-950/40 text-red-300' : 'hover:bg-red-50 text-red-700'}`}>
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.common?.deleteAccount || dict?.debate?.deleteAccount || 'Delete Account'}</span>
            </button>
        </div>
    </div>
)}

                </div>
            </header>

            {/* MESSAGES */}
            <main className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#050505]' : 'bg-white'} p-4 transition-colors`}>
                <div className="max-w-3xl mx-auto flex flex-col gap-6">
                    {visibleMessages.map((msg) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] uppercase font-bold opacity-50 mb-1 px-1">{msg.name}</span>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30' : (isDarkMode ? 'bg-zinc-800/50 text-zinc-200 border border-white/10' : 'bg-gray-100 text-gray-800 border-gray-200 border')}`}>
                                        <MathDisplay content={msg.content} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 px-1 opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => navigator.clipboard.writeText(msg.content)} className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity" title="Copy Content">
                                            <Copy className="w-3 h-3" /> Copy
                                        </button>
                                        <button className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 uppercase tracking-wider font-bold">
                                            <Download className="w-3 h-3" /> Save
                                        </button>
                                        <button onClick={() => handlePrint(msg.content)} className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 uppercase tracking-wider font-bold">
                                            <Printer className="w-3 h-3" /> Print
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </main>

            {/* INPUT DECK */}
            <footer className={`flex-none ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'} border-t p-4 pb-6 z-[60] transition-colors`}>
                <div className="max-w-3xl mx-auto flex flex-col gap-4">

                    {/* Toolstrip */}
                    <div className={`flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar ${isDarkMode ? 'border-zinc-800' : 'border-gray-200'} border-b mb-1`}>
                        <button
                            onClick={() => setIsMathMode(false)}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all w-16 group ${!isMathMode ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : 'opacity-50'}`}
                        >
                            <div className={`p-2 rounded-full border transition-colors ${!isMathMode ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-100 border-indigo-200') : (isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300')}`}>
                                <Type className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Text</span>
                        </button>

                        <button
                            onClick={() => setIsMathMode(true)}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all w-16 group ${isMathMode ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : 'opacity-50'}`}
                        >
                            <div className={`p-2 rounded-full border transition-colors ${isMathMode ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-100 border-indigo-200') : (isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300')}`}>
                                <Sigma className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Math</span>
                        </button>

                        {isMathMode && (
                            <button
                                onClick={() => {
                                    if (window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide();
                                    else window.mathVirtualKeyboard.show();
                                }}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all w-16 group text-emerald-500 hover:bg-emerald-500/10`}
                                title="Toggle Virtual Keyboard"
                            >
                                <div className={`p-2 rounded-full border border-emerald-500/30 bg-emerald-500/10`}>
                                    <Keyboard className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider">Keys</span>
                            </button>
                        )}

                        <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-300'} mx-2`} />

                        <MediaUploader label="File" icon={FileText} accept="*" onFileSelected={setSelectedFile} />
                        <MediaUploader label="Image" icon={ImageIcon} accept="image/*" onFileSelected={setSelectedFile} />
                        <MediaUploader label="Video" icon={Video} accept="video/*" onFileSelected={setSelectedFile} />
                        <AudioRecorder onRecordingComplete={setRecordedAudio} />
                    </div>

                    {/* Previews */}
                    {(selectedFile || recordedAudio) && (
                        <div className={`flex items-center gap-2 p-2 ${isDarkMode ? 'bg-zinc-800/30' : 'bg-gray-200'} rounded-xl`}>
                            {selectedFile && <FilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} />}
                            {recordedAudio && <AudioPreview url={URL.createObjectURL(recordedAudio)} onRemove={() => setRecordedAudio(null)} />}
                        </div>
                    )}

                    {/* Input Field */}
                    <div className="flex items-end gap-3">
                        <div className={`flex-1 ${isDarkMode ? 'bg-black border-zinc-700' : 'bg-white border-gray-300'} border rounded-xl p-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all`}>
                            {isMathMode ? (
                                <MathInput
                                    value={inputContent}
                                    onChange={setInputContent}
                                    placeholder="Enter complex mathematical formula..."
                                />
                            ) : (
                                <textarea
                                    value={inputContent}
                                    onChange={(e) => setInputContent(e.target.value)}
                                    placeholder={dict?.debate?.placeholder || "Enter your argument..."}
                                    className={`w-full bg-transparent border-none ${isDarkMode ? 'text-white' : 'text-gray-900'} outline-none resize-none min-h-[48px] max-h-32 placeholder:text-zinc-500 font-medium`}
                                    rows={1}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                />
                            )}
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!inputContent.trim() && !selectedFile && !recordedAudio}
                            className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-lg transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </footer>

        </div>
    );
}
