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
    Globe, Phone, History, Keyboard, Trash2, Mail, Coins
} from 'lucide-react';

// REMOVED LOCAL TYPE DEF - moved to src/types/mathlive.d.ts

// COMPONENTS
import { MediaUploader, FilePreview } from '@/components/debate/MediaUploader';
import { AudioRecorder, AudioPreview } from '@/components/debate/AudioRecorder';
import { MathInput } from '@/components/math/MathInput';
import NotificationBell from '@/components/notifications/NotificationBell';
import { MathDisplay } from '@/components/math/MathDisplay';

// --- TYPES ---
type Message = {
    id: string;
    role: 'user' | 'assistant' | 'agreement' | 'system';
    name: string;
    content: string;
    timestamp: number;
    phase?: 'independent' | 'review' | 'consensus' | 'system';
    meta?: Record<string, any>;
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

        const [profileInfo, setProfileInfo] = useState<{ token_balance_cents: number } | null>(null);
const [isMenuOpen, setIsMenuOpen] = useState(false); // top-right dropdown

    const [showFinalOnly, setShowFinalOnly] = useState(true);
    const [debateTopic, setDebateTopic] = useState<string>('');
    const [initializingCouncil, setInitializingCouncil] = useState(false);

    // Attachments State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

    // Phase 8: Video generation safeguards (cost-before-generate + confirmation)
    const [pendingVideoPrompt, setPendingVideoPrompt] = useState<string>('');
    const [pendingVideoDurationSec, setPendingVideoDurationSec] = useState<number>(6);
    const [videoGenerating, setVideoGenerating] = useState(false);
    const [lastVideoAssetUrl, setLastVideoAssetUrl] = useState<string | null>(null);

    // Phase 14: Media generation happens AFTER the text debate reaches a final consensus.
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [pendingImagePrompt, setPendingImagePrompt] = useState<string>('');
    const [pendingImageStyle, setPendingImageStyle] = useState<string>('Cinematic');
    const [pendingImageAspect, setPendingImageAspect] = useState<string>('16:9');
    const [imageGenerating, setImageGenerating] = useState(false);
    const [lastImageAssetUrl, setLastImageAssetUrl] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            // Load current token balance for client-side UX hints (server enforces as well)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: p } = await supabase
                        .from('profiles')
                        .select('token_balance_cents')
                        .eq('id', user.id)
                        .maybeSingle();
                    if (p) setProfileInfo({ token_balance_cents: Number((p as any).token_balance_cents || 0) });
                }
            } catch {
                // ignore
            }

            const { data: debate } = await supabase.from('debates').select('topic').eq('id', debateId).single();
            if (debate?.topic) setDebateTopic(debate.topic);

            const { data: turns } = await supabase.from('debate_turns').select('*').eq('debate_id', debateId).order('created_at', { ascending: true });
            if (turns && turns.length > 0) {
                setMessages(turns.map((t: any) => ({
                    id: t.id,
                    role: (t.role as any) || (() => {
                        const name = t.ai_name_snapshot || '';
                        if (name === 'User') return 'user';
                        if (name.toLowerCase().includes('leader')) return 'agreement';
                        return 'assistant';
                    })(),
                    name: t.ai_name_snapshot || (t.role === 'user' ? 'User' : 'Council'),
                    content: t.content,
                    timestamp: new Date(t.created_at).getTime(),
                    phase: (t.meta?.phase as any) || ((t.role === 'agreement') ? 'consensus' : (t.role === 'assistant' ? 'independent' : 'system')),
                    meta: t.meta || {}
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
                            role: (newTurn.role as any) || (() => {
                                const name = newTurn.ai_name_snapshot || '';
                                if (name === 'User') return 'user';
                                if (name.toLowerCase().includes('leader')) return 'agreement';
                                return 'assistant';
                            })(),
                            name: newTurn.ai_name_snapshot || (newTurn.role === 'user' ? 'User' : 'Council'),
                            content: newTurn.content,
                            timestamp: Date.now(),
                            phase: (newTurn.meta?.phase as any) || ((newTurn.role === 'agreement') ? 'consensus' : (newTurn.role === 'assistant' ? 'independent' : 'system')),
                            meta: newTurn.meta || {}
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

    const openImageGeneration = () => {
        const fc = [...messages].reverse().find((m: any) => m.role === 'agreement' || m.phase === 'consensus');
        if (!fc) {
            alert(dict?.debate?.needConsensus || 'Generate an answer first, then you can generate media from the final consensus.');
            return;
        }
        setPendingImagePrompt(fc.content);
        setPendingImageStyle('Cinematic');
        setPendingImageAspect('16:9');
        setIsImageModalOpen(true);
    };

    const openVideoGeneration = () => {
        const fc = [...messages].reverse().find((m: any) => m.role === 'agreement' || m.phase === 'consensus');
        if (!fc) {
            alert(dict?.debate?.needConsensus || 'Generate an answer first, then you can generate media from the final consensus.');
            return;
        }
        setPendingVideoPrompt(fc.content);
        setPendingVideoDurationSec(6);
        setIsVideoModalOpen(true);
    };

    const estimateImageTokens = (amount: number) => amount; // kept for future UI (server is source of truth)

    const handleConfirmImageGeneration = async () => {
        setImageGenerating(true);
        try {
            const res = await fetch('/api/media/image/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    debateId,
                    prompt: pendingImagePrompt,
                    style: pendingImageStyle,
                    aspect: pendingImageAspect,
                    confirmed: true,
                }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j.error || 'Failed to generate image');

            if (profileInfo) {
                const newBalance = Math.max(0, Number(profileInfo.token_balance_cents) - Number(j.tokensCost || 0));
                setProfileInfo({ token_balance_cents: newBalance });
            }

            setMessages(prev => ([...prev, {
                id: `image-${Date.now()}`,
                role: 'system',
                name: 'System',
                content: j.asset?.public_url ? 'Image generated successfully. It will be deleted after 3 days.' : 'Image generation started.',
                timestamp: Date.now(),
            } as any]));
            if (j.asset?.public_url) setLastImageAssetUrl(j.asset.public_url);

            setIsImageModalOpen(false);
        } catch (e: any) {
            alert(e.message || 'Image generation failed');
        } finally {
            setImageGenerating(false);
        }
    };

    // Phase 8: confirm + reserve tokens server-side before any video generation
    const handleConfirmVideoGeneration = async () => {
        setVideoGenerating(true);
        try {
            const res = await fetch('/api/media/video/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    debateId,
                    prompt: pendingVideoPrompt,
                    durationSec: pendingVideoDurationSec,
                    confirmed: true,
                }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j.error || 'Failed to start video generation');

            // Update local balance (best-effort)
            if (profileInfo) {
                const newBalance = Math.max(0, Number(profileInfo.token_balance_cents) - Number(j.tokensCost || 0));
                setProfileInfo({ token_balance_cents: newBalance });
            }

            // Record a system message (non-intrusive) and show player if URL exists
            setMessages(prev => ([...prev, {
                id: `video-${Date.now()}`,
                role: 'system',
                name: 'System',
                content: j.asset?.public_url ? 'Video generated successfully.' : 'Video generation started. Your video will appear here when ready.',
                timestamp: Date.now(),
            } as any]));
            if (j.asset?.public_url) setLastVideoAssetUrl(j.asset.public_url);

            // Clear inputs
            setInputContent('');
            setSelectedFile(null);
            setRecordedAudio(null);
            setIsVideoModalOpen(false);
        } catch (e: any) {
            alert(e.message || 'Video generation failed');
        } finally {
            setVideoGenerating(false);
        }
    };

    const independentMsgs = messages.filter(m => m.role === 'assistant' && (m.phase === 'independent' || !m.phase));
    const reviewMsgs = messages.filter(m => m.role === 'assistant' && m.phase === 'review');
    const consensusMsgs = messages.filter(m => m.role === 'agreement' || m.phase === 'consensus');
    const finalConsensus = consensusMsgs.length ? consensusMsgs[consensusMsgs.length - 1] : null;
    const usedAis = Array.from(new Set(independentMsgs.map(m => m.name).filter(Boolean)));

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

                    {/* Notifications */}
                    <NotificationBell />

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
            <Link href={`/${lang}/buy-tokens`} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <span className="font-bold uppercase tracking-wider text-xs">{dict?.debate?.buyTokens || dict?.common?.buyTokens || 'Buy Tokens'}</span>
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
                        {dict?.common?.tokens || 'Tokens'}:
                        <span className={`ml-2 text-[10px] font-black px-2 py-1 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-200 text-gray-700'}`}>
                            {(profileInfo?.token_balance_cents ?? 0)}
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

            {/* CONTENT */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

            <aside className={`w-full md:w-[380px] flex-none overflow-y-auto ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-gray-200'} border-t md:border-t-0 md:border-r p-4`}>
                <div className="flex flex-col gap-4">


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
            </aside>
<main className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#050505]' : 'bg-white'} p-4 transition-colors`}>
                <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
                    {lastVideoAssetUrl && (
                        <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'border-white/10 bg-black' : 'border-gray-200 bg-white'} shadow-sm`}>
                            <div className={`px-4 py-2 text-xs font-black uppercase tracking-wider ${isDarkMode ? 'bg-zinc-900/60 text-zinc-200' : 'bg-gray-50 text-gray-700'}`}>
                                {dict?.debate?.videoPlayerTitle || 'Video Player'}
                            </div>
                            <video src={lastVideoAssetUrl} controls className="w-full h-auto" />
                        </div>
                    )}

                    {lastImageAssetUrl && (
                        <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'border-white/10 bg-black' : 'border-gray-200 bg-white'} shadow-sm`}>
                            <div className={`px-4 py-2 text-xs font-black uppercase tracking-wider ${isDarkMode ? 'bg-zinc-900/60 text-zinc-200' : 'bg-gray-50 text-gray-700'}`}>
                                {dict?.debate?.imagePreviewTitle || 'Image Preview'}
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={lastImageAssetUrl} alt="Generated" className="w-full h-auto" />
                        </div>
                    )}
                    
{showFinalOnly ? (
                        finalConsensus ? (
                            <div className="flex w-full justify-start">
                                <div className="flex flex-col max-w-[90%] items-start">
                                    <span className="text-[10px] uppercase font-bold opacity-50 mb-1 px-1">{dict?.debate?.finalConsensus || 'Final Consensus'}</span>
                                    <div className={`p-5 rounded-2xl text-sm leading-relaxed ${isDarkMode ? 'bg-zinc-800/60 text-zinc-100 border border-white/10' : 'bg-white text-gray-900 border border-gray-200'} shadow-sm`}>
                                        <MathDisplay content={finalConsensus.content} />
                                        {usedAis.length > 0 && (
                                            <div className={`mt-4 text-[10px] font-bold uppercase tracking-wider opacity-70 ${isDarkMode ? 'text-zinc-300' : 'text-gray-600'}`}>
                                                {dict?.debate?.usedAis || 'Used AIs'}: {usedAis.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 px-1 opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => navigator.clipboard.writeText(finalConsensus.content)} className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity" title="Copy Content">
                                            <Copy className="w-3 h-3" /> Copy
                                        </button>
                                        <button onClick={() => handlePrint(finalConsensus.content)} className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 uppercase tracking-wider font-bold">
                                            <Printer className="w-3 h-3" /> Print
                                        </button>
                                        <button onClick={openImageGeneration} className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 uppercase tracking-wider font-bold">
                                            <ImageIcon className="w-3 h-3" /> {dict?.common?.generateImage || 'Generate Image'}
                                        </button>
                                        <button onClick={openVideoGeneration} className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 uppercase tracking-wider font-bold">
                                            <Video className="w-3 h-3" /> {dict?.common?.generateVideo || 'Generate Video'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`text-sm opacity-60 ${isDarkMode ? 'text-zinc-300' : 'text-gray-600'}`}>{dict?.debate?.noConsensusYet || 'No final answer yet.'}</div>
                        )
                    ) : (
                        <>
                            {/* Independent Answers */}
                            {independentMsgs.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <div className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                                        {dict?.debate?.independentAnswers || 'Independent Answers'}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(independentMsgs.reduce((acc: any, m) => {
                                            acc[m.name] = m;
                                            return acc;
                                        }, {})).map(([name, msg]: any) => (
                                            <div key={msg.id} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-zinc-900/40' : 'border-gray-200 bg-white'} shadow-sm`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase font-bold opacity-60">{name}</span>
                                                </div>
                                                <div className="text-sm leading-relaxed">
                                                    <MathDisplay content={msg.content} />
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 opacity-70 hover:opacity-100 transition-opacity">
                                                    <button onClick={() => navigator.clipboard.writeText(msg.content)} className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold">
                                                        <Copy className="w-3 h-3" /> Copy
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cross Review */}
                            {reviewMsgs.length > 0 && (
                                <div className="flex flex-col gap-3 pt-2">
                                    <div className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                                        {dict?.debate?.crossReview || 'Cross Review'}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {reviewMsgs.map((msg) => (
                                            <div key={msg.id} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10 bg-zinc-900/40' : 'border-gray-200 bg-white'} shadow-sm`}>
                                                <span className="text-[10px] uppercase font-bold opacity-60">{msg.name}</span>
                                                <div className="mt-2 text-sm leading-relaxed">
                                                    <MathDisplay content={msg.content} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Final Consensus */}
                            {finalConsensus && (
                                <div className="flex flex-col gap-3 pt-2">
                                    <div className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                                        {dict?.debate?.finalConsensus || 'Final Consensus'}
                                    </div>
                                    <div className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-zinc-800/60 text-zinc-100' : 'border-gray-200 bg-white text-gray-900'} shadow-sm`}>
                                        <MathDisplay content={finalConsensus.content} />
                                    </div>
                                </div>
                            )}

                            {/* Fallback: show any remaining messages (user/system) */}
                            {messages.filter(m => m.role === 'user' || m.role === 'system').map((msg) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] uppercase font-bold opacity-50 mb-1 px-1">{msg.name}</span>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30' : (isDarkMode ? 'bg-zinc-800/50 text-zinc-200 border border-white/10' : 'bg-gray-100 text-gray-800 border-gray-200 border')}`}>
                                                <MathDisplay content={msg.content} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    <div ref={bottomRef} className="h-4" />
                </div>
            </main>
            </div>


{/* Phase 14: Image generation modal */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
                    <div className={`w-full max-w-md rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-gray-200'} shadow-2xl overflow-hidden`}>
                        <div className={`px-4 py-3 ${isDarkMode ? 'bg-zinc-900/60' : 'bg-gray-50'} flex items-center justify-between`}>
                            <span className="text-sm font-black tracking-wider">{dict?.debate?.generateImage || 'Generate Image'}</span>
                            <button
                                onClick={() => setIsImageModalOpen(false)}
                                className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-800'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                            >
                                {dict?.common?.close || 'Close'}
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{dict?.debate?.finalVisualPrompt || 'Final Visual Prompt'}</label>
                            <textarea
                                value={pendingImagePrompt}
                                onChange={(e) => setPendingImagePrompt(e.target.value)}
                                rows={5}
                                className={`w-full rounded-xl border p-3 text-sm font-medium outline-none ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                placeholder="Describe the image to generate..."
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <div className={`rounded-xl p-3 border ${isDarkMode ? 'bg-zinc-900/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-80">{dict?.debate?.style || 'Style'}</div>
                                    <input
                                        value={pendingImageStyle}
                                        onChange={(e) => setPendingImageStyle(e.target.value)}
                                        className={`mt-1 w-full bg-transparent outline-none text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    />
                                </div>
                                <div className={`rounded-xl p-3 border ${isDarkMode ? 'bg-zinc-900/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-80">{dict?.debate?.aspectRatio || 'Aspect'}</div>
                                    <input
                                        value={pendingImageAspect}
                                        onChange={(e) => setPendingImageAspect(e.target.value)}
                                        className={`mt-1 w-full bg-transparent outline-none text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    />
                                </div>
                            </div>

                            <div className={`rounded-xl p-3 border ${isDarkMode ? 'bg-zinc-900/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="opacity-80">{dict?.debate?.estimatedCost || 'Estimated cost'}</span>
                                    <span className="font-black">{pendingImageEstimatedTokens} {dict?.common?.tokens || 'Tokens'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsImageModalOpen(false)}
                                    className={`flex-1 px-4 py-2 rounded-xl font-bold ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                                    disabled={imageGenerating}
                                >
                                    {dict?.common?.cancel || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleConfirmImageGeneration}
                                    className="flex-1 px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                                    disabled={imageGenerating}
                                >
                                    {imageGenerating ? (dict?.debate?.processing || 'Processing...') : (dict?.debate?.payAndGenerate || 'Generate')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Phase 8: Video generation confirmation modal */}
            {isVideoModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
                    <div className={`w-full max-w-md rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-gray-200'} shadow-2xl overflow-hidden`}>
                        <div className={`px-4 py-3 ${isDarkMode ? 'bg-zinc-900/60' : 'bg-gray-50'} flex items-center justify-between`}>
                            <span className="text-sm font-black tracking-wider">{dict?.debate?.confirmVideoTitle || 'Confirm Video Generation'}</span>
                            <button
                                onClick={() => setIsVideoModalOpen(false)}
                                className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-800'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                            >
                                {dict?.common?.close || 'Close'}
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <p className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                                {dict?.debate?.confirmVideoBody || 'The system will calculate the token cost before generation and block if your balance is insufficient.'}
                            </p>

                            <div className={`rounded-xl p-3 border ${isDarkMode ? 'bg-zinc-900/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="opacity-80">{dict?.debate?.estimatedCost || 'Estimated cost'}</span>
                                    <span className="font-black">{pendingVideoEstimatedTokens} {dict?.common?.tokens || 'Tokens'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsVideoModalOpen(false)}
                                    className={`flex-1 px-4 py-2 rounded-xl font-bold ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                                    disabled={videoGenerating}
                                >
                                    {dict?.common?.cancel || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleConfirmVideoGeneration}
                                    className="flex-1 px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                                    disabled={videoGenerating}
                                >
                                    {videoGenerating ? (dict?.debate?.processing || 'Processing...') : (dict?.debate?.confirm || 'Confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
