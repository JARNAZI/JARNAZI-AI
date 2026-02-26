'use client';

// --- IMPORTS ---
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ICONS
import { LANGUAGES } from '@/i18n/config';
import { Menu, Send, Image as ImageIcon, Video, FileText, Printer, Copy, ArrowLeft, ChevronLeft, ChevronRight, User, CreditCard, LogOut, Sun, Moon, PlusCircle, Globe, Trash2, Mail, Coins, MessageSquare, X, Zap, Shield } from 'lucide-react';

// REMOVED LOCAL TYPE DEF - moved to src/types/mathlive.d.ts

// COMPONENTS
import { MediaUploader, FilePreview } from '@/components/debate/MediaUploader';
import { AudioRecorder, AudioPreview } from '@/components/debate/AudioRecorder';
import NotificationBell from '@/components/notifications/NotificationBell';

// --- TYPES ---
type Message = {
    id: string;
    role: 'user' | 'assistant' | 'agreement' | 'system';
    name: string;
    content: string;
    timestamp: number;
    phase?: 'independent' | 'review' | 'consensus' | 'system';
    meta?: Record<string, unknown>;
    attachments?: Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name: string }>;
};

// --- MAIN CLIENT COMPONENT ---
export default function DebateClient({
    dict,
    lang,
    supabaseUrl,
    supabaseAnonKey
}: {
    dict: any;
    lang: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
}) {
    const params = useParams();
    const router = useRouter();
    const debateId = params.id as string;
    const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));




    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputContent, setInputContent] = useState('');
    const { theme, setTheme, resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const handleLangToggle = (targetLang: string) => {
        if (targetLang === lang) return;
        const next = targetLang;
        try { document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}` } catch { }
        router.push(`/${next}/debate/${debateId}`);
        router.refresh();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.replace(`/${lang}/login`);
    };

    const handleDeleteAccount = async () => {
        const ok = confirm(dict?.debate?.confirmDeleteAccount || 'Are you sure you want to delete your account? This cannot be undone.');
        if (!ok) return;
        try {
            const res = await fetch('/api/account/delete', { method: 'POST' });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Failed to delete account');
            await supabase.auth.signOut();
            window.location.replace(`/${lang}/login`);
        } catch (e: unknown) {
            toast.error((e instanceof Error ? e.message : String(e)) || 'Failed to delete account');
        }
    };

    const [profileInfo, setProfileInfo] = useState<{ token_balance: number } | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const searchParams = useSearchParams();

    const [stripeEnabled, setStripeEnabled] = useState(true);
    const [nowpaymentsEnabled, setNowpaymentsEnabled] = useState(false);

    useEffect(() => {
        // Read gateway toggles from site_settings (best-effort)
        (async () => {
            try {
                const { data } = await supabase
                    .from('site_settings')
                    .select('key,value')
                    .in('key', ['gateway_stripe_enabled', 'gateway_nowpayments_enabled']);
                if (Array.isArray(data) && data.length) {
                    const map: Record<string, any> = {};
                    for (const r of data as any) map[r.key] = r.value;
                    if (map.gateway_stripe_enabled != null) setStripeEnabled(String(map.gateway_stripe_enabled) === 'true');
                    if (map.gateway_nowpayments_enabled != null) setNowpaymentsEnabled(String(map.gateway_nowpayments_enabled) === 'true');
                    return;
                }
            } catch { }

            try {
                const { data } = await supabase.from('site_settings').select('features').limit(1).maybeSingle();
                const features: any = (data as any)?.features || {};
                const stripe = features.gateway_stripe_enabled ?? features.payments_stripe_enabled ?? true;
                const nowp = features.gateway_nowpayments_enabled ?? features.payments_nowpayments_enabled ?? false;
                setStripeEnabled(Boolean(stripe));
                setNowpaymentsEnabled(Boolean(nowp));
            } catch { }
        })();
    }, [supabase]);

    const missingTokensToAmount = (missingTokens: number) => {
        const TOKENS_PER_USD = 3;
        const min = 14;
        const tokens = Math.max(0, Math.floor(Number(missingTokens) || 0));
        // Need amount such that floor(amount*3) >= tokens
        const cents = Math.ceil((tokens * 100) / TOKENS_PER_USD);
        const amount = Math.max(min, cents / 100);
        return Math.round(amount * 100) / 100;
    };


    const startTokenPurchase = async (amount: number, { returnTo, pendingId }: { returnTo: string; pendingId: string }) => {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
            throw new Error('Please sign in again.');
        }

        const endpoint = stripeEnabled ? '/api/buy-tokens/checkout' : (nowpaymentsEnabled ? '/api/buy-tokens/nowpayments' : '/api/buy-tokens/checkout');

        const payRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ amount, lang, returnTo, pendingId }),
        });
        const payJson = await payRes.json().catch(() => ({} as any));
        if (!payRes.ok || !payJson?.url) throw new Error(payJson?.error || 'Checkout failed');

        window.location.href = payJson.url;
    };


    useEffect(() => {
        // Auto-resume pending long video generation after token purchase (short window)
        const resumeFlag = searchParams?.get('resume');
        const purchase = searchParams?.get('purchase');
        if (!(resumeFlag === '1' || purchase === 'success')) return;

        try {
            const raw = localStorage.getItem('pending_video_resume_v1');
            if (!raw) return;
            const state = JSON.parse(raw);
            if (!state || state.debateId !== debateId) return;

            const expiresAt = state.expiresAt ? new Date(state.expiresAt).getTime() : 0;
            if (expiresAt && Date.now() > expiresAt) {
                localStorage.removeItem('pending_video_resume_v1');
                return;
            }

            if (state._resuming) return;
            state._resuming = true;
            localStorage.setItem('pending_video_resume_v1', JSON.stringify(state));

            (async () => {
                try {
                    setVideoGenerating(true);

                    const basePrompt: string = String(state.prompt ?? '');
                    const segments: number[] = Array.isArray(state.segments) ? state.segments : [];
                    const sceneOffset: number = Number(state.sceneOffset ?? 0) || 0;
                    const totalSegments: number = Number(state.totalSegments ?? segments.length) || segments.length;

                    const existingUrls: string[] = Array.isArray(state.urls) ? state.urls : [];
                    const existingAssetIds: string[] = Array.isArray(state.assetIds) ? state.assetIds : [];
                    let totalDeducted = Number(state.totalDeducted ?? 0) || 0;

                    const urls: string[] = [...existingUrls];
                    const assetIds: string[] = [...existingAssetIds];

                    for (let idx = 0; idx < segments.length; idx++) {
                        const segSec = segments[idx];
                        const sceneNum = sceneOffset + idx + 1;

                        const res = await fetch('/api/media/video/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                debateId,
                                prompt: totalSegments > 1 ? `${basePrompt}\n\n[Scene ${sceneNum}/${totalSegments}]` : basePrompt,
                                durationSec: segSec,
                                confirmed: true,
                            }),
                        });

                        const j = await res.json().catch(() => ({} as any));

                        if (res.status === 402 && (j?.error === 'INSUFFICIENT_TOKENS' || j?.error === 'INSUFFICIENT')) {
                            const missing = Number(j?.missingTokens ?? 0) || 0;
                            const pendingId = String(j?.pendingId ?? '');
                            const expiresAt2 = j?.expiresAt ?? null;

                            // Save new resume state for the remaining segments (including current)
                            try {
                                const remainingSegs = segments.slice(idx); // includes current segment
                                localStorage.setItem(
                                    'pending_video_resume_v1',
                                    JSON.stringify({
                                        v: 1,
                                        debateId,
                                        lang,
                                        prompt: basePrompt,
                                        segments: remainingSegs,
                                        sceneOffset: sceneNum - 1,
                                        totalSegments,
                                        urls,
                                        assetIds,
                                        totalDeducted,
                                        pendingId,
                                        expiresAt: expiresAt2,
                                        ts: Date.now(),
                                    })
                                );
                            } catch { }

                            const amount = missingTokensToAmount(missing);
                            const ok = confirm(
                                (dict?.buyTokensPage?.insufficientTokens || dict?.common?.insufficientTokens || 'Not enough tokens.') +
                                `\n\nMissing: ${missing}\n\nBuy now (${amount} USD) and resume?`
                            );
                            if (!ok) throw new Error(j?.error || 'INSUFFICIENT_TOKENS');

                            await startTokenPurchase(amount, { returnTo: `/${lang}/debate/${debateId}?resume=1`, pendingId });
                            return;
                        }

                        if (!res.ok) {
                            const msg = j?.error || `Failed to generate scene ${sceneNum}`;
                            throw new Error(msg);
                        }

                        const deducted = Number(j?.tokensDeducted ?? j?.tokensCost ?? j?.tokensDeductedCents ?? 0) || 0;
                        totalDeducted += deducted;

                        const url = j?.asset?.public_url ?? null;
                        if (url) urls.push(url);
                        const aid = j?.asset?.id ?? null;
                        if (aid) assetIds.push(String(aid));
                    }

                    // Update local balance (best-effort)
                    if (profileInfo) {
                        const newBalance = Math.max(0, Number(profileInfo.token_balance) - totalDeducted);
                        setProfileInfo({ token_balance: newBalance });
                    }

                    if (urls.length) {
                        setLastVideoSegments(urls);
                        setVideoSegmentIndex(0);
                        setLastVideoAssetUrl(urls[0]);
                    }

                    localStorage.removeItem('pending_video_resume_v1');
                } catch (e: unknown) {
                    console.error(e);
                } finally {
                    setVideoGenerating(false);
                    // Clean query params
                    try {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('resume');
                        url.searchParams.delete('purchase');
                        url.searchParams.delete('pendingId');
                        window.history.replaceState({}, '', url.toString());
                    } catch { }
                }
            })();
        } catch {
            // ignore
        }

        // Auto-resume pending compose-after-purchase (short window)
        try {
            const raw2 = localStorage.getItem('pending_compose_resume_v1');
            if (raw2) {
                const st2 = JSON.parse(raw2);
                if (st2 && st2.debateId === debateId) {
                    const expiresAt2 = st2.expiresAt ? new Date(st2.expiresAt).getTime() : 0;
                    if (expiresAt2 && Date.now() > expiresAt2) {
                        localStorage.removeItem('pending_compose_resume_v1');
                    } else if (!st2._resuming) {
                        st2._resuming = true;
                        localStorage.setItem('pending_compose_resume_v1', JSON.stringify(st2));

                        (async () => {
                            try {
                                setLastVideoFinalUrl(null);
                                setLastVideoJobId(null);

                                const res2 = await fetch('/api/media/video/compose', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        debateId,
                                        assetIds: Array.isArray(st2.assetIds) ? st2.assetIds : [],
                                        durationSec: st2.durationSec ?? null,
                                    }),
                                });

                                const j2 = await res2.json().catch(() => ({} as any));
                                if (!res2.ok) throw new Error(j2?.error || 'Compose failed');

                                const jobId2 = String(j2?.jobId ?? '');
                                setLastVideoJobId(jobId2);

                                const started2 = Date.now();
                                while (Date.now() - started2 < 10 * 60 * 1000) {
                                    await new Promise((r) => setTimeout(r, 2000));
                                    const sres2 = await fetch(`/api/media/video/compose/status?jobId=${encodeURIComponent(jobId2)}`);
                                    const sj2 = await sres2.json().catch(() => ({} as any));
                                    if (!sres2.ok) throw new Error(sj2?.error || 'Status failed');
                                    if (sj2?.status === 'done' && sj2?.downloadUrl) {
                                        setLastVideoFinalUrl(String(sj2.downloadUrl));
                                        localStorage.removeItem('pending_compose_resume_v1');
                                        break;
                                    }
                                    if (sj2?.status === 'failed') {
                                        throw new Error(String(sj2?.error || 'Compose failed'));
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                                // allow manual retry; keep state
                                try {
                                    const raw3 = localStorage.getItem('pending_compose_resume_v1');
                                    if (raw3) {
                                        const st3 = JSON.parse(raw3);
                                        if (st3) {
                                            delete st3._resuming;
                                            localStorage.setItem('pending_compose_resume_v1', JSON.stringify(st3));
                                        }
                                    }
                                } catch { }
                            }
                        })();
                    }
                }
            }
        } catch { }
    }, [searchParams, debateId, lang, stripeEnabled, nowpaymentsEnabled, profileInfo, supabase, dict]);

    // top-right dropdown

    const [showFinalOnly, setShowFinalOnly] = useState(true);
    // NOTE: These states existed in an earlier iteration of the UI but were unused.
    // Keeping unused state triggers build-breaking ESLint errors on Netlify/Next.js.
    const [debateTopic, setDebateTopic] = useState<string>('');
    const [initializingCouncil, setInitializingCouncil] = useState(false);
    const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(false);
    const [enableFreeTrial, setEnableFreeTrial] = useState<boolean>(false);

    // Attachments State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

    type UploadedAsset = {
        bucket: string;
        path: string;
        signedUrl: string;
        kind: 'image' | 'video' | 'file';
        mime?: string;
        filename?: string;
    };

    const [lastUploadedAsset, setLastUploadedAsset] = useState<UploadedAsset | null>(null);
    const [uploadingAsset, setUploadingAsset] = useState(false);


    // Phase 8: Video generation safeguards (cost-before-generate + confirmation)
    const [pendingVideoPrompt, setPendingVideoPrompt] = useState<string>('');
    const [pendingVideoDurationSec, setPendingVideoDurationSec] = useState<number>(6);
    const [videoGenerating, setVideoGenerating] = useState(false);
    const [lastVideoAssetUrl, setLastVideoAssetUrl] = useState<string | null>(null);
    const [lastVideoSegments, setLastVideoSegments] = useState<string[]>([]);
    const [lastVideoAssetIds, setLastVideoAssetIds] = useState<string[]>([]);
    const [lastVideoJobId, setLastVideoJobId] = useState<string | null>(null);
    const [lastVideoFinalUrl, setLastVideoFinalUrl] = useState<string | null>(null);
    const [videoComposing, setVideoComposing] = useState(false);
    const [videoSegmentIndex, setVideoSegmentIndex] = useState<number>(0);

    // Phase 14: Media generation happens AFTER the text debate reaches a final consensus.
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [pendingImagePrompt, setPendingImagePrompt] = useState<string>('');
    const [pendingImageStyle, setPendingImageStyle] = useState<string>('Cinematic');
    const [pendingImageAspect, setPendingImageAspect] = useState<string>('16:9');
    const [imageGenerating, setImageGenerating] = useState(false);
    const [lastImageAssetUrl, setLastImageAssetUrl] = useState<string | null>(null);

    const [isImageFullscreenOpen, setIsImageFullscreenOpen] = useState(false);

    const pendingImageEstimatedTokens = 0;
    const pendingVideoEstimatedTokens = 0;

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const userHasScrolledUpRef = useRef(false);

    // Mobile horizontal input strip scroll hints
    const inputStripRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateInputStripScrollHints = () => {
        const el = inputStripRef.current;
        if (!el) return;
        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft < maxScrollLeft - 2);
    };

    useEffect(() => {
        updateInputStripScrollHints();
        const onResize = () => updateInputStripScrollHints();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);


    // Initial Load
    useEffect(() => {
        const init = async () => {
            // Load current token balance for client-side UX hints (server enforces as well)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: p } = await supabase
                        .from('profiles')
                        .select('token_balance, role, free_trial_used')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (p) {
                        setProfileInfo({ token_balance: Number((p as any).token_balance || 0) });
                        setFreeTrialUsed(!!(p as any).free_trial_used);
                        if (p.role) {
                            console.log("DebateClient: Role fetched from DB:", p.role);
                            setRole(p.role);
                        } else if (user.app_metadata?.role) {
                            console.log("DebateClient: Role found in App Metadata:", user.app_metadata.role);
                            setRole(user.app_metadata.role);
                        }
                    }
                }
            } catch {
                // ignore
            }

            const { data: debate } = await supabase.from('debates').select('topic').eq('id', debateId).single();
            if (debate?.topic) setDebateTopic(debate.topic);

            // Fetch enable_free_trial setting
            try {
                const { data: st } = await supabase.from('site_settings').select('value').eq('key', 'enable_free_trial').maybeSingle();
                setEnableFreeTrial((st as any)?.value === 'true');
            } catch { }

            const { data: turns } = await supabase.from('debate_turns').select('*').eq('debate_id', debateId).order('created_at', { ascending: true });
            if (turns && turns.length > 0) {
                setMessages(turns.map((t: any) => ({
                    id: t.id,
                    role: (t.role as any) || (() => {
                        const name = t.ai_name_snapshot || '';
                        if (name === 'User') return 'user';
                        const n = name.toLowerCase();
                        if (n.includes('leader') || n.includes('agreement') || n.includes('الاتفاق')) return 'agreement';
                        return 'assistant';
                    })(),
                    name: t.ai_name_snapshot || (t.role === 'user' ? 'User' : 'Council'),
                    content: t.content,
                    timestamp: new Date(t.created_at).getTime(),
                    phase: (t.meta?.phase as any) || ((t.role === 'agreement') ? 'consensus' : (t.role === 'assistant' ? 'independent' : 'system')),
                    meta: t.meta || {}
                })));
            } else {
                setMessages([{ id: 'welcome', role: 'system', name: 'System', content: dict.debate?.sessionInitialized || 'Session Initialized. The Council is ready.', timestamp: Date.now() }]);
            }
        };
        init();

        // Realtime Subscription
        const channel = supabase.channel(`debate:${debateId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_turns', filter: `debate_id=eq.${debateId}` },
                (payload: any) => {
                    const newTurn = payload.new;
                    setMessages((prev: Message[]) => {
                        if (prev.find((p: Message) => p.id === newTurn.id)) return prev;
                        return [...prev, {
                            id: newTurn.id,
                            role: (newTurn.role as any) || (() => {
                                const name = newTurn.ai_name_snapshot || '';
                                if (name === 'User') return 'user';
                                const n = name.toLowerCase();
                                if (n.includes('leader') || n.includes('agreement') || n.includes('الاتفاق')) return 'agreement';
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
    }, [debateId, supabase]);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        bottomRef.current?.scrollIntoView({ behavior });
        setShowScrollToBottom(false);
        userHasScrolledUpRef.current = false;
    };

    useEffect(() => {
        // Only auto-scroll if the user hasn't scrolled up (prevents annoying jumps).
        if (!userHasScrolledUpRef.current) {
            scrollToBottom('smooth');
        } else {
            setShowScrollToBottom(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        const threshold = 80; // px
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        userHasScrolledUpRef.current = !atBottom;
        setShowScrollToBottom(!atBottom);
    };

    // NOTE: Initialization is handled by the existing welcome + user input flow.

    const handlePrint = (content: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><body><div style="font-family: sans-serif; white-space: pre-wrap; padding: 20px;">${content}</div></body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleDownloadText = (content: string, filename = `consensus-${debateId}.txt`) => {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            toast.error(dict?.debate?.downloadFailed || 'Download failed');
        }
    };

    // Best-effort prompt extractor from the final consensus content
    const extractFinalPrompt = (content: string): string | null => {
        if (!content) return null;
        const patterns = [
            /(?:^|\n)\s*(?:FINAL\s+PROMPT|PROMPT\s+FINAL|Prompt\s*:?|Final\s+Prompt\s*:?)[\s\S]*?\n([\s\S]*)$/i,
        ];

        // Prefer fenced blocks first
        const fenced = content.match(/```[\s\S]*?```/);
        if (fenced) {
            const block = fenced[0].replace(/^```\w*\n?/, '').replace(/```$/, '').trim();
            if (block.length >= 10) return block;
        }

        // Try to find a section starting at "Final Prompt"/"Prompt:"
        const section = content.match(/(?:^|\n)\s*(FINAL\s+PROMPT|Final\s+Prompt|Prompt)\s*:?\s*\n([\s\S]{10,})/i);
        if (section && section[2]) {
            // Stop at common next headers if present
            const raw = section[2];
            const stop = raw.split(/\n\s*(?:NEGATIVE\s+PROMPT|Negative\s+Prompt|SETTINGS|Settings|NOTES|Notes|AGREEMENT|Consensus|الاتفاق)\s*:?\s*\n/i)[0];
            const cleaned = stop.trim();
            return cleaned.length >= 10 ? cleaned : null;
        }

        // Fallback: look for "Prompt:" on a single line
        const line = content.split('\n').find(l => /^\s*Prompt\s*:/i.test(l));
        if (line) return line.replace(/^\s*Prompt\s*:\s*/i, '').trim() || null;

        return null;
    };


    const shouldAttachLastAssetForEdit = (text: string) => {
        const t = (text || '').toLowerCase();
        // Arabic + English common edit intents
        const keys = [
            'edit', 'modify', 'change', 'enhance', 'improve', 'remove', 'add',
            'تعديل', 'عدل', 'عدّل', 'حسن', 'تحسين', 'غير', 'غيّر', 'امسح', 'احذف', 'اضف', 'أضف', 'إضافة'
        ];
        return keys.some(k => t.includes(k));
    };


    // Send Handler
    const handleSend = async () => {
        if (!inputContent.trim() && !selectedFile && !recordedAudio) return;

        // 1. Prepare Content & Enforce LaTeX
        let contentToSend = inputContent;

        // If user is requesting an edit and didn't attach a new file, attach the most recent uploaded asset context.
        if (!selectedFile && lastUploadedAsset && shouldAttachLastAssetForEdit(contentToSend) && !contentToSend.includes('[ASSET_URL:')) {
            contentToSend += `\n[ASSET_URL: ${lastUploadedAsset.signedUrl}]\n[ASSET_PATH: ${lastUploadedAsset.path}]\n[ASSET_KIND: ${lastUploadedAsset.kind}]`;
        }



        // --- LATEX ENFORCEMENT RULE ---


        // Upload selected file (image/video/any file) to Supabase Storage via server route, then attach the signed URL to the prompt.
        if (selectedFile) {
            try {
                setUploadingAsset(true);
                const { data: { session } } = await supabase.auth.getSession();
                const accessToken = session?.access_token;

                const fd = new FormData();
                fd.append('file', selectedFile);

                const upRes = await fetch('/api/media/upload', {
                    method: 'POST',
                    headers: {
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                    body: fd,
                });

                if (upRes.ok) {
                    const up = await upRes.json();
                    if (up?.signedUrl && up?.path) {
                        const asset: UploadedAsset = {
                            bucket: up.bucket,
                            path: up.path,
                            signedUrl: up.signedUrl,
                            kind: up.kind,
                            mime: up.mime,
                            filename: up.filename,
                        };
                        setLastUploadedAsset(asset);
                        contentToSend += `\n[ASSET_URL: ${asset.signedUrl}]\n[ASSET_PATH: ${asset.path}]\n[ASSET_KIND: ${asset.kind}]\n[ASSET_NAME: ${selectedFile.name}]`;
                    } else {
                        contentToSend += `\n[FILE: ${selectedFile.name}]`;
                    }
                } else {
                    contentToSend += `\n[FILE: ${selectedFile.name}]`;
                }
            } catch {
                contentToSend += `\n[FILE: ${selectedFile.name}]`;
            } finally {
                setUploadingAsset(false);
            }
        }

        if (recordedAudio) contentToSend += `\n[AUDIO_CLIP]`;

        // 2. Optimistic Update
        const tempId = Date.now().toString();
        const newMsg: Message = {
            id: tempId,
            role: 'user',
            name: 'User',
            content: contentToSend,
            timestamp: Date.now()
        };
        setMessages((prev: Message[]) => [...prev, newMsg]);
        setInputContent('');
        setSelectedFile(null);
        setRecordedAudio(null);

        try {
            // 3. Insert User Message to DB
            const { error: dbError } = await supabase.from('debate_turns').insert({
                debate_id: debateId,
                content: contentToSend,
                ai_name_snapshot: 'User',
                ai_provider_id: null
            });

            if (dbError) throw dbError;

            // 4. Trigger AI Debate (Server API - unified path)
            //    This keeps all orchestration in ONE place and ensures token accounting is consistent.
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            const res = await fetch('/api/debate/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    debateId,
                    prompt: contentToSend,
                    requestType: (contentToSend.includes('[ASSET_KIND: image]') ? 'image' : (contentToSend.includes('[ASSET_KIND: video]') ? 'video' : 'text')),

                }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({} as any));

                if (res.status === 403 && j?.error === 'FREE_TRIAL_TEXT_ONLY') {
                    toast.error(j.message || 'Free trial is limited to text only.');
                    // Clean up optimistic message
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    return;
                }

                // Token shortage: prompt user to buy tokens and optionally return back to this debate.
                if (res.status === 402) {
                    const missing = Number(j?.missingTokens ?? 0) || 0;
                    toast.error((dict?.notifications?.insufficientTokens || dict?.tokens?.insufficient || 'Insufficient tokens.') + (missing ? ` (Missing: ${missing})` : ''));
                    // Redirect to buy-tokens with a return URL so user can come back.
                    const ret = encodeURIComponent(`/${lang}/debate/${debateId}`);
                    window.location.href = `/${lang}/buy-tokens?missing=${missing}&return=${ret}`;
                    return;
                }
                const errText = j?.error || await res.text().catch(() => '');
                throw new Error(`Debate message failed: ${res.status} ${errText}`);
            }

        } catch (err) {
            console.error(err);
            toast.error(dict?.notifications?.messageSendFailed || "Failed to send message: Check console");
        }
    };

    const openImageGeneration = () => {
        if (enableFreeTrial && !freeTrialUsed) {
            toast.error(dict.debate?.freeTrialMediaBlocked || 'Free trial is limited to text only. Please buy tokens to generate images.');
            return;
        }
        const fc = [...messages].reverse().find((m: any) => m.role === 'agreement' || m.phase === 'consensus');
        if (!fc) {
            toast.error(dict?.debate?.needConsensus || 'Generate an answer first, then you can generate media from the final consensus.');
            return;
        }
        setPendingImagePrompt(fc.content);
        setPendingImageStyle('Cinematic');
        setPendingImageAspect('16:9');
        setIsImageModalOpen(true);
    };

    const openVideoGeneration = () => {
        if (enableFreeTrial && !freeTrialUsed) {
            toast.error(dict.debate?.freeTrialMediaBlocked || 'Free trial is limited to text only. Please buy tokens to generate video.');
            return;
        }
        const fc = [...messages].reverse().find((m: any) => m.role === 'agreement' || m.phase === 'consensus');
        if (!fc) {
            toast.error(dict?.debate?.needConsensus || 'Generate an answer first, then you can generate media from the final consensus.');
            return;
        }
        setPendingVideoPrompt(fc.content);
        setPendingVideoDurationSec(6);
        setIsVideoModalOpen(true);
    };

    // Token estimation happens server-side; the client only shows confirmations.

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
                const newBalance = Math.max(0, Number(profileInfo.token_balance) - Number(j.tokensCost || 0));
                setProfileInfo({ token_balance: newBalance });
            }

            setMessages((prev: Message[]) => ([...prev, {
                id: `image-${Date.now()}`,
                role: 'system',
                name: 'System',
                content: j.asset?.public_url ? (dict.debate?.imageGenSuccess || 'Image generated successfully. It will be deleted after 3 days.') : (dict.debate?.imageGenStarted || 'Image generation started.'),
                timestamp: Date.now(),
            } as any]));
            if (j.asset?.public_url) setLastImageAssetUrl(j.asset.public_url);

            setIsImageModalOpen(false);
        } catch (e: unknown) {
            toast.error((e instanceof Error ? e.message : String(e)) || 'Image generation failed');
        } finally {
            setImageGenerating(false);
        }
    };


    const parseDurationSecFromPrompt = (text: string): number | null => {
        const s = (text || '').toLowerCase();
        // Match "90s", "90 sec", "90 seconds"
        const secMatch = s.match(/\b(\d{1,4})\s*(s|sec|secs|second|seconds)\b/);
        if (secMatch) return Number(secMatch[1]);
        // Match "2m", "2 min", "2 minutes"
        const minMatch = s.match(/\b(\d{1,3})\s*(m|min|mins|minute|minutes)\b/);
        if (minMatch) return Number(minMatch[1]) * 60;
        return null;
    };

    // Phase 8: confirm + reserve tokens server-side before any video generation
    const handleConfirmVideoGeneration = async () => {
        setVideoGenerating(true);
        try {
            // Determine requested duration from prompt (e.g., "30m", "120s") or UI field.
            let requestedDurationSec = parseDurationSecFromPrompt(pendingVideoPrompt) ?? pendingVideoDurationSec;
            requestedDurationSec = Math.round(Number(requestedDurationSec));
            if (!Number.isFinite(requestedDurationSec) || requestedDurationSec <= 0) requestedDurationSec = 6;

            // Long video mode: providers often cap a *single* generation to ~600s.
            // We support arbitrarily long videos by splitting into multiple <=600s scenes.

            const segments: number[] = [];
            if (requestedDurationSec > 600) {
                let remaining = requestedDurationSec;
                while (remaining > 0) {
                    const chunk = Math.min(600, remaining);
                    segments.push(chunk);
                    remaining -= chunk;
                }
            } else {
                segments.push(requestedDurationSec);
            }

            const urls: string[] = [];
            const assetIds: string[] = [];
            let totalDeducted = 0;

            // Generate sequentially to avoid timeouts and to allow partial progress.
            for (let i = 0; i < segments.length; i++) {
                const segSec = segments[i];
                const res = await fetch('/api/media/video/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        debateId,
                        prompt: segments.length > 1 ? `${pendingVideoPrompt}

[Scene ${i + 1}/${segments.length}]` : pendingVideoPrompt,
                        durationSec: segSec,
                        confirmed: true,
                    }),
                });

                const j = await res.json().catch(() => ({} as any));
                // If tokens are insufficient mid-run, prompt purchase and auto-resume remaining scenes.
                if (res.status === 402 && (j?.error === 'INSUFFICIENT_TOKENS' || j?.error === 'INSUFFICIENT')) {
                    const missing = Number(j?.missingTokens ?? 0) || 0;
                    const pendingId = String(j?.pendingId ?? '');
                    const expiresAt = j?.expiresAt ?? null;

                    // Save resume state (remaining segments incl current)
                    try {
                        const remaining = segments.slice(i); // includes current segment
                        localStorage.setItem(
                            'pending_video_resume_v1',
                            JSON.stringify({
                                v: 1,
                                debateId,
                                lang,
                                prompt: pendingVideoPrompt,
                                segments: remaining,
                                sceneOffset: i,
                                totalSegments: segments.length,
                                urls,
                                assetIds,
                                totalDeducted,
                                pendingId,
                                expiresAt,
                                ts: Date.now(),
                            })
                        );
                    } catch { }

                    const amount = missingTokensToAmount(missing);
                    const ok = confirm(
                        (dict?.buyTokensPage?.insufficientTokens || dict?.common?.insufficientTokens || 'Not enough tokens.') +
                        `\n\nRequired: ${j?.tokensNeeded ?? ''}\nMissing: ${missing}\n\nBuy now (${amount} USD) and resume?`
                    );
                    if (!ok) throw new Error(j?.error || 'INSUFFICIENT_TOKENS');

                    await startTokenPurchase(amount, { returnTo: `/${lang}/debate/${debateId}?resume=1`, pendingId });
                    return;
                }

                if (!res.ok) {
                    // Stop on failure; previous successful segments remain available.
                    const msg = j?.error || `Failed to generate scene ${i + 1}`;
                    throw new Error(msg);
                }

                const deducted = Number(j?.tokensDeducted ?? j?.tokensCost ?? j?.tokensDeductedCents ?? 0) || 0;
                totalDeducted += deducted;

                const url = j?.asset?.public_url ?? null;
                if (url) urls.push(url);
                const aid = j?.asset?.id;
                if (aid) assetIds.push(String(aid));
            }

            // Update local balance (best-effort)
            if (profileInfo) {
                const newBalance = Math.max(0, Number(profileInfo.token_balance) - totalDeducted);
                setProfileInfo({ token_balance: newBalance });
            }

            // Player: if long video, store playlist; otherwise keep single url behavior.
            if (urls.length) {
                setLastVideoSegments(urls);
                setLastVideoAssetIds(assetIds);
                setLastVideoJobId(null);
                setLastVideoFinalUrl(null);
                setVideoSegmentIndex(0);
                setLastVideoAssetUrl(urls[0]);
            }

            const msg =
                urls.length > 1
                    ? (dict?.debate?.longVideoGenSuccess ||
                        `Long video generated as ${urls.length} scenes. It will play continuously in the player.`)
                    : (dict?.debate?.videoGenSuccess || 'Video generated successfully.');

            setMessages((prev) => [
                ...prev,
                {
                    id: `video-${Date.now()}`,
                    role: 'system',
                    name: 'System',
                    content: msg,
                    timestamp: Date.now(),
                } as any,
            ]);

            // Clear inputs
            setInputContent('');
            setSelectedFile(null);
            setRecordedAudio(null);
            setIsVideoModalOpen(false);
        } catch (e: unknown) {
            toast.error((e instanceof Error ? e.message : String(e)) || 'Video generation failed');
        } finally {
            setVideoGenerating(false);
        }
    };

    const independentMsgs = messages.filter(m => m.role === 'assistant' && (m.phase === 'independent' || !m.phase));
    const consensusMsgs = messages.filter(m => m.role === 'agreement' || m.phase === 'consensus');
    const finalConsensus = consensusMsgs.length ? consensusMsgs[consensusMsgs.length - 1] : null;
    const consensusRequestType = String(((finalConsensus?.meta as any)?.requestType || (finalConsensus?.meta as any)?.request_type || '')).toLowerCase();
    const finalPrompt = finalConsensus ? extractFinalPrompt(finalConsensus.content) : null;

    const usedAis = Array.from(new Set(independentMsgs.map(m => m.name).filter(Boolean)));

    return (
        <div className={`flex flex-col h-[100dvh] bg-background text-foreground font-sans overflow-hidden transition-colors duration-300`}>

            {/* HEADER */}
            <header className={`flex-none h-16 bg-card border-b border-border flex items-center justify-between px-4 z-[60] relative shadow-md transition-colors`}>
                <div className="flex items-center gap-3">
                    <Link href={`/${lang}/debate`} className="p-2 hover:bg-muted rounded-full cursor-pointer transition-colors">
                        <ArrowLeft className="w-5 h-5 opacity-70" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-wider select-none">{dict.debate?.consoleTitle || 'Jarnazi Consensus'}</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-emerald-500 font-mono select-none">{dict.debate?.online || 'ONLINE'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* START NEW SESSION ICON */}
                    <Link href={`/${lang}/debate`} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30' : 'bg-indigo-100 text-indigo-600'}`} title={dict.debate?.startNewSession || "Start New Session"}>
                        <PlusCircle className="w-4 h-4" />
                    </Link>

                    {/* Notifications */}
                    <NotificationBell supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />

                    <div className="w-px h-6 bg-border mx-1" />

                    <button
                        onClick={() => setIsMenuOpen((v: boolean) => !v)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white cursor-pointer relative z-50 shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
                        aria-label={dict.dashboard?.openMenu || "Open Menu"}
                        title={dict.dashboard?.openMenu || "Open Menu"}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Top-right dropdown menu */}
                    {isMenuOpen && (
                        <div
                            className={`absolute right-4 top-16 w-72 rounded-2xl border bg-card border-border shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-4 duration-200`}
                        >
                            <div className={`px-5 py-4 bg-muted flex items-center justify-between border-b border-border`}>
                                <span className="text-[10px] font-black tracking-[0.2em] text-foreground">{dict?.debate?.menu || 'COMMAND MENU'}</span>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 rounded-xl text-xs font-bold bg-background hover:bg-muted text-foreground border border-border transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-2 space-y-0.5 max-h-[70dvh] overflow-y-auto custom-scrollbar">
                                {role === 'admin' && (
                                    <>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 mt-2 ml-4">System Access</p>
                                        <Link href={`/${lang}/admin`} className="flex items-center gap-4 w-full px-4 py-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all text-red-500 group" onClick={() => setIsMenuOpen(false)}>
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black uppercase tracking-widest text-[11px] leading-tight group-hover:text-red-600">Admin Dashboard</span>
                                                <span className="text-[9px] font-bold text-red-500/50 uppercase tracking-tight">Privileged Access Only</span>
                                            </div>
                                        </Link>
                                        <div className="my-4 h-px bg-border" />
                                    </>
                                )}

                                <Link href={`/${lang}/neural-hub`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full px-4 py-4 rounded-xl transition-all hover:bg-muted text-foreground">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[11px]">{dict.dashboard?.neuralHub || "Neural Hub"}</span>
                                </Link>

                                <Link href={`/${lang}/debate/usage`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full px-4 py-4 rounded-xl transition-all hover:bg-muted text-foreground">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Coins className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black uppercase tracking-widest text-[11px] leading-tight">{dict.dashboard?.liquidityStatus || "My Tokens"}</span>
                                        <span className="text-[9px] font-bold text-indigo-600/70 dark:text-indigo-500/70 uppercase tracking-tighter">{dict.dashboard?.tokenBalance || "Token Balance"}</span>
                                    </div>
                                </Link>

                                <Link href={`/${lang}/profile/settings`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full px-4 py-4 rounded-xl transition-all hover:bg-muted text-foreground">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[11px]">{dict.dashboard?.userMatrix || "Edit User Data"}</span>
                                </Link>

                                <Link href={`/${lang}/buy-tokens`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 w-full px-4 py-4 rounded-xl transition-all hover:bg-muted text-foreground">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-500/20 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[11px]">{dict.dashboard?.allocateBudget || "Purchase Credits"}</span>
                                </Link>

                                <div className="my-2 border-t border-border" />

                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-2 mt-4">{dict.dashboard?.interfaceLocale || "Interface Locale"}</p>
                                <div className="flex flex-wrap gap-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                    {LANGUAGES.map((l: { code: string; name: string; flag: string }) => (
                                        <button
                                            key={l.code}
                                            onClick={() => handleLangToggle(l.code as any)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${lang === l.code ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                                        >
                                            <span className="text-sm">{l.flag}</span>
                                            {l.name.toUpperCase()}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                                    className="flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all hover:bg-muted text-foreground"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-600'}`}>
                                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[11px] pt-1">{isDarkMode ? (dict.debate?.lightMode || 'Light Mode') : (dict.debate?.darkMode || 'Dark Mode')}</span>
                                </button>

                                <div className="my-2 border-t border-border" />

                                <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all hover:bg-red-500/10 text-red-500">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                        <LogOut className="w-4 h-4" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[11px]">{dict.dashboard?.deauthorize || "Deauthorize"}</span>
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </header>

            {/* CONTENT */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                <aside className="w-full md:w-[380px] flex-none overflow-y-auto bg-card border-t md:border-t-0 md:border-r border-border p-4">
                    <div className="flex flex-col gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex items-center justify-between mb-2 w-full">
                            <button
                                onClick={() => setShowFinalOnly(false)}
                                className={`flex-1 px-3 py-2 rounded-l-xl text-[9px] font-black uppercase tracking-widest border transition-all ${!showFinalOnly ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}
                            >
                                {dict.debate?.fullDebate || 'Full Debate'}
                            </button>
                            <button
                                onClick={() => setShowFinalOnly(true)}
                                className={`flex-1 px-3 py-2 rounded-r-xl text-[9px] font-black uppercase tracking-widest border transition-all ${showFinalOnly ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}
                            >
                                {dict.debate?.consensusOnly || 'Consensus Only'}
                            </button>
                        </div>


                        {/* Toolstrip */}
                        <div className="relative">
                            <div ref={inputStripRef} onScroll={updateInputStripScrollHints} className="flex items-center gap-1 flex-wrap pb-2 border-b border-border mb-1">
                                {enableFreeTrial && !freeTrialUsed ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 mb-1 w-full">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                            {dict.dashboard?.trialModeDesc || 'Trial Mode: Text Only'}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <MediaUploader label={dict.dashboard?.files || "File"} icon={FileText} accept="*" onFileSelected={setSelectedFile} />
                                        <MediaUploader label={dict.dashboard?.pics || "Image"} icon={ImageIcon} accept="image/*" onFileSelected={setSelectedFile} />
                                        <MediaUploader label={dict.dashboard?.video || "Video"} icon={Video} accept="video/*" onFileSelected={setSelectedFile} />
                                        <AudioRecorder onRecordingComplete={setRecordedAudio} label={dict.dashboard?.audio || "Audio"} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Previews */}
                        {(selectedFile || recordedAudio) && (
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-xl">
                                {selectedFile && <FilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} />}
                                {recordedAudio && <AudioPreview url={URL.createObjectURL(recordedAudio)} onRemove={() => setRecordedAudio(null)} />}
                            </div>
                        )}

                        {/* Input Field */}
                        <div className="flex items-end gap-3 mt-4">
                            <div className={`flex-1 bg-background border border-border rounded-xl p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-inner`}>
                                <textarea
                                    ref={textareaRef}
                                    value={inputContent}
                                    onChange={(e) => setInputContent(e.target.value)}
                                    placeholder={dict?.debate?.placeholder || "Enter your argument..."}
                                    className={`w-full bg-transparent border-none text-foreground outline-none resize-none min-h-[48px] max-h-32 placeholder:text-muted-foreground/30 font-medium`}
                                    rows={1}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                />

                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!inputContent.trim() && !selectedFile && !recordedAudio}
                                className="p-4 bg-primary hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-primary text-primary-foreground rounded-xl shadow-lg transition-all active:scale-90 cursor-pointer"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>



                    </div>
                </aside>
                <main ref={scrollRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto bg-background transition-colors`}>
                    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4">
                        {lastVideoAssetUrl && (
                            <div className={`rounded-2xl overflow-hidden border border-border bg-card shadow-sm`}>
                                <div className={`px-4 py-2 text-xs font-black uppercase tracking-wider bg-muted text-foreground/80`}>
                                    {dict?.debate?.videoPlayerTitle || 'Video Player'}
                                </div>
                                <video
                                    src={lastVideoSegments.length ? (lastVideoSegments[videoSegmentIndex] ?? lastVideoAssetUrl) : lastVideoAssetUrl}
                                    controls
                                    className="w-full h-auto"
                                    onEnded={() => {
                                        if (!lastVideoSegments.length) return;
                                        const next = videoSegmentIndex + 1;
                                        if (next < lastVideoSegments.length) {
                                            setVideoSegmentIndex(next);
                                            setLastVideoAssetUrl(lastVideoSegments[next]);
                                        }
                                    }}
                                />
                                <div className="p-3 flex flex-wrap items-center gap-2">
                                    <a
                                        href={lastVideoSegments.length ? (lastVideoSegments[videoSegmentIndex] ?? lastVideoAssetUrl) : lastVideoAssetUrl}
                                        download
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border border-border bg-background hover:bg-muted transition-all active:scale-95"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {dict?.debate?.downloadVideo || 'Download Video'}
                                    </a>

                                    {lastVideoFinalUrl && (
                                        <a
                                            href={lastVideoFinalUrl}
                                            download
                                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border border-border bg-background hover:bg-muted transition-all active:scale-95"
                                        >
                                            <FileText className="w-4 h-4" />
                                            {dict?.debate?.downloadFinalVideo || 'Download Final MP4'}
                                        </a>
                                    )}


                                    {lastVideoSegments.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    // Download all scenes sequentially (no FFmpeg merge).
                                                    for (let i = 0; i < lastVideoSegments.length; i++) {
                                                        const url = lastVideoSegments[i];
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `video_scene_${i + 1}.mp4`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                        // slight delay to avoid browser blocking multiple downloads
                                                        await new Promise((r) => setTimeout(r, 400));
                                                    }
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border border-border bg-background hover:bg-muted transition-all active:scale-95"
                                            >
                                                <Video className="w-4 h-4" />
                                                {dict?.debate?.downloadAllScenes || 'Download All Scenes'}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={videoComposing}
                                                onClick={async () => {
                                                    if (!lastVideoAssetIds.length) {
                                                        toast.error('Missing asset ids for composition.');
                                                        return;
                                                    }
                                                    try {
                                                        setVideoComposing(true);
                                                        setLastVideoFinalUrl(null);
                                                        setLastVideoJobId(null);

                                                        const res = await fetch('/api/media/video/compose', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                debateId,
                                                                assetIds: lastVideoAssetIds,
                                                                durationSec: (Array.isArray(lastVideoAssetIds) ? lastVideoAssetIds.length : 1) * 600,
                                                            }),
                                                        });
                                                        const j = await res.json().catch(() => ({} as any));

                                                        if (res.status === 402 && (j?.error === 'INSUFFICIENT_TOKENS' || j?.error === 'INSUFFICIENT')) {
                                                            const missing = Number(j?.missingTokens ?? 0) || 0;
                                                            const pendingId = String(j?.pendingId ?? '');
                                                            const expiresAt2 = j?.expiresAt ?? null;

                                                            try {
                                                                localStorage.setItem(
                                                                    'pending_compose_resume_v1',
                                                                    JSON.stringify({
                                                                        v: 1,
                                                                        debateId,
                                                                        assetIds: lastVideoAssetIds,
                                                                        durationSec: (Array.isArray(lastVideoAssetIds) ? lastVideoAssetIds.length : 1) * 600,
                                                                        pendingId,
                                                                        expiresAt: expiresAt2,
                                                                        ts: Date.now(),
                                                                    })
                                                                );
                                                            } catch { }

                                                            const amount = missingTokensToAmount(missing);
                                                            const ok = confirm(
                                                                (dict?.buy?.insufficient_tokens_prompt ?? 'Insufficient tokens. Buy now?') +
                                                                `

Missing: ${missing} tokens
Suggested amount: $${amount}`
                                                            );
                                                            if (ok) {
                                                                await startTokenPurchase(amount, { returnTo: `/${lang}/debate/${debateId}`, pendingId });
                                                            }
                                                            return;
                                                        }

                                                        if (!res.ok) throw new Error(j?.error || 'Compose failed');

                                                        const jobId = String(j?.jobId ?? '');
                                                        setLastVideoJobId(jobId);

                                                        // Poll status
                                                        const started = Date.now();
                                                        while (Date.now() - started < 10 * 60 * 1000) {
                                                            await new Promise((r) => setTimeout(r, 2000));
                                                            const sres = await fetch(`/api/media/video/compose/status?jobId=${encodeURIComponent(jobId)}`);
                                                            const sj = await sres.json().catch(() => ({} as any));
                                                            if (!sres.ok) throw new Error(sj?.error || 'Status failed');
                                                            if (sj?.status === 'done' && sj?.downloadUrl) {
                                                                setLastVideoFinalUrl(String(sj.downloadUrl));
                                                                break;
                                                            }
                                                            if (sj?.status === 'failed') {
                                                                throw new Error(sj?.error || 'Composition failed');
                                                            }
                                                        }
                                                    } catch (e: any) {
                                                        toast.error(e?.message || 'Composition failed');
                                                    } finally {
                                                        setVideoComposing(false);
                                                    }
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border border-border bg-background hover:bg-muted transition-all active:scale-95 disabled:opacity-60"
                                            >
                                                <Zap className="w-4 h-4" />
                                                {videoComposing ? (dict?.debate?.composing || 'Composing...') : (dict?.debate?.composeFinal || 'Compose Final')}
                                            </button>
                                        </>
                                    )}

                                    <a
                                        href={lastVideoAssetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border border-border bg-background hover:bg-muted transition-all active:scale-95"
                                    >
                                        <Video className="w-4 h-4" />
                                        {dict?.debate?.openVideo || 'Open'}
                                    </a>

                                    {lastVideoSegments.length > 1 && (
                                        <div className="ml-auto text-xs font-black uppercase tracking-wider text-foreground/70">
                                            {dict?.debate?.sceneLabel || 'Scene'} {videoSegmentIndex + 1}/{lastVideoSegments.length}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {lastImageAssetUrl && (
                            <div className={`rounded-2xl overflow-hidden border border-border bg-card shadow-sm`}>
                                <div className={`px-4 py-2 text-xs font-black uppercase tracking-wider bg-muted text-foreground/80`}>
                                    {dict?.debate?.imagePreviewTitle || 'Image Preview'}
                                </div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={lastImageAssetUrl} alt="Generated" className="w-full h-auto" />
                                <div className="p-3 flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setIsImageFullscreenOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border border-border bg-background hover:bg-muted transition-all active:scale-95"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        {dict?.debate?.viewFullscreen || 'Full Screen'}
                                    </button>
                                    <a
                                        href={lastImageAssetUrl}
                                        download
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border border-border bg-background hover:bg-muted transition-all active:scale-95"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {dict?.debate?.downloadImage || 'Download Image'}
                                    </a>
                                </div>
                            </div>
                        )}

                        {showFinalOnly ? (
                            finalConsensus ? (
                                <div className="flex w-full justify-start">
                                    <div className="flex flex-col max-w-[90%] items-start">
                                        <span className="text-[10px] uppercase font-bold opacity-50 mb-1 px-1">{dict?.debate?.finalConsensus || 'Final Consensus'}</span>
                                        <div className={`p-5 rounded-2xl text-sm leading-relaxed bg-card text-foreground border border-border shadow-sm`}>
                                            <div className="whitespace-pre-wrap">{finalConsensus.content}</div>
                                            {usedAis.length > 0 && (
                                                <div className={`mt-4 text-[10px] font-bold uppercase tracking-wider opacity-70 text-muted-foreground`}>
                                                    {dict?.debate?.usedAis || 'Used AIs'}: {usedAis.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2 px-1">
                                            <div className="flex flex-wrap items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(finalConsensus.content)}
                                                    className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity"
                                                    title={dict?.debate?.copy || "Copy Content"}
                                                >
                                                    <Copy className="w-3 h-3" /> {dict?.debate?.copy || 'Copy'}
                                                </button>

                                                <button
                                                    onClick={() => handleDownloadText(finalConsensus.content)}
                                                    className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity"
                                                    title={dict?.debate?.download || "Download"}
                                                >
                                                    <FileText className="w-3 h-3" /> {dict?.debate?.download || 'Download'}
                                                </button>

                                                <button
                                                    onClick={() => handlePrint(finalConsensus.content)}
                                                    className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity"
                                                    title={dict?.debate?.print || "Print"}
                                                >
                                                    <Printer className="w-3 h-3" /> {dict?.debate?.print || 'Print'}
                                                </button>
                                            </div>

                                            {finalPrompt && (
                                                <div className="mt-4 w-full">
                                                    <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-2">
                                                        {dict?.debate?.finalPrompt || 'Final Prompt'}
                                                    </div>
                                                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                                        <pre className="text-xs whitespace-pre-wrap break-words leading-relaxed">{finalPrompt}</pre>

                                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                                            {consensusRequestType === 'image' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setPendingImagePrompt(finalPrompt);
                                                                        setPendingImageStyle('Cinematic');
                                                                        setPendingImageAspect('16:9');
                                                                        setIsImageModalOpen(true);
                                                                    }}
                                                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                                                >
                                                                    <Zap className="w-4 h-4" />
                                                                    {dict?.common?.generateNow || dict?.common?.generateImageNow || 'Generate Now'}
                                                                </button>
                                                            )}

                                                            {consensusRequestType === 'video' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setPendingVideoPrompt(finalPrompt);
                                                                        setPendingVideoDurationSec(6);
                                                                        setIsVideoModalOpen(true);
                                                                    }}
                                                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                                                >
                                                                    <Zap className="w-4 h-4" />
                                                                    {dict?.common?.generateNow || 'Generate Now'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm opacity-60 text-muted-foreground">{dict?.debate?.noConsensusYet || 'No final answer yet.'}</div>
                            )
                        ) : (
                            <div className="flex flex-col gap-4">
                                {messages
                                    .filter((m: Message) => m.role !== 'system')
                                    .map((msg: Message) => {
                                        const isUser = msg.role === 'user';
                                        const isAgreement = msg.role === 'agreement' || msg.phase === 'consensus';
                                        const replyTo = (msg.meta as any)?.reply_to_name || (msg.meta as any)?.replyToName || (msg.meta as any)?.reply_to || null;
                                        const indent = replyTo ? 'ml-6 border-l border-border pl-4' : '';

                                        if (isAgreement) {
                                            const prompt = extractFinalPrompt(msg.content);
                                            return (
                                                <div key={msg.id} className="flex w-full justify-start">
                                                    <div className={`flex flex-col w-full ${indent}`}>
                                                        <span className="text-[10px] uppercase font-black tracking-wider opacity-60 mb-1 px-1">
                                                            {dict?.debate?.agreementTitle || 'Agreement'}
                                                        </span>
                                                        <div className={`p-5 rounded-2xl text-sm leading-relaxed bg-card text-foreground border border-border shadow-sm`}>
                                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                                        </div>

                                                        {/* Actions under agreement */}
                                                        <div className="mt-2 px-1">
                                                            <div className="flex flex-wrap items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(msg.content)}
                                                                    className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity"
                                                                >
                                                                    <Copy className="w-3 h-3" /> {dict?.debate?.copy || 'Copy'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadText(msg.content)}
                                                                    className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity"
                                                                >
                                                                    <FileText className="w-3 h-3" /> {dict?.debate?.download || 'Download'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePrint(msg.content)}
                                                                    className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 uppercase tracking-wider font-bold transition-opacity"
                                                                >
                                                                    <Printer className="w-3 h-3" /> {dict?.debate?.print || 'Print'}
                                                                </button>
                                                            </div>

                                                            {prompt && (
                                                                <div className="mt-4 w-full">
                                                                    <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-2">
                                                                        {dict?.debate?.finalPrompt || 'Final Prompt'}
                                                                    </div>
                                                                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                                                        <pre className="text-xs whitespace-pre-wrap break-words leading-relaxed">{prompt}</pre>
                                                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                                                            {String(((msg.meta as any)?.requestType || (msg.meta as any)?.request_type || '')).toLowerCase() === 'image' && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setPendingImagePrompt(prompt);
                                                                                        setPendingImageStyle('Cinematic');
                                                                                        setPendingImageAspect('16:9');
                                                                                        setIsImageModalOpen(true);
                                                                                    }}
                                                                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                                                                >
                                                                                    <Zap className="w-4 h-4" />
                                                                                    {dict?.common?.generateNow || dict?.common?.generateImageNow || 'Generate Now'}
                                                                                </button>
                                                                            )}

                                                                            {String(((msg.meta as any)?.requestType || (msg.meta as any)?.request_type || '')).toLowerCase() === 'video' && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setPendingVideoPrompt(prompt);
                                                                                        setPendingVideoDurationSec(6);
                                                                                        setIsVideoModalOpen(true);
                                                                                    }}
                                                                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                                                                >
                                                                                    <Zap className="w-4 h-4" />
                                                                                    {dict?.common?.generateNow || 'Generate Now'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex flex-col max-w-[92%] ${isUser ? 'items-end' : 'items-start'} ${indent}`}>
                                                    <div className="flex items-center gap-2 px-1 mb-1">
                                                        <span className="text-[10px] uppercase font-bold opacity-60">{msg.name}</span>
                                                        {replyTo && !isUser && (
                                                            <span className="text-[10px] opacity-50">
                                                                {dict?.debate?.replyingTo || 'Replying to'}: <span className="font-bold">{String(replyTo)}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-primary/20 text-foreground border border-primary/30' : 'bg-card text-foreground border-border border shadow-sm'}`}>
                                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        <div ref={bottomRef} className="h-4" />
                    </div>

                    {showScrollToBottom && (
                        <button
                            onClick={() => scrollToBottom('smooth')}
                            className="fixed bottom-24 right-6 z-[70] rounded-full border border-border bg-card shadow-lg px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-muted transition-all active:scale-95"
                            title={dict?.debate?.scrollToBottom || 'Scroll to bottom'}
                        >
                            ↓ {dict?.debate?.scrollToBottom || 'Bottom'}
                        </button>
                    )}
                </main>
            </div >



            {/* Image fullscreen preview modal */}
            {
                isImageFullscreenOpen && lastImageAssetUrl && (
                    <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4">
                        <div className="w-full max-w-6xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-xs font-black uppercase tracking-wider text-white/80">
                                    {dict?.debate?.imagePreviewTitle || 'Image Preview'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={lastImageAssetUrl}
                                        download
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {dict?.debate?.downloadImage || 'Download Image'}
                                    </a>
                                    <button
                                        onClick={() => setIsImageFullscreenOpen(false)}
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                        {dict?.common?.close || 'Close'}
                                    </button>
                                </div>
                            </div>
                            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={lastImageAssetUrl} alt="Generated" className="w-full h-auto" />
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Phase 14: Image generation modal */}
            {
                isImageModalOpen && (
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
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPendingImagePrompt(e.target.value)}
                                    rows={5}
                                    className={`w-full rounded-xl border p-3 text-sm font-medium outline-none ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                    placeholder={dict.debate?.imagePromptPlaceholder || "Describe the image to generate..."}
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`rounded-xl p-3 border ${isDarkMode ? 'bg-zinc-900/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-80">{dict?.debate?.style || 'Style'}</div>
                                        <input
                                            value={pendingImageStyle}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPendingImageStyle(e.target.value)}
                                            className={`mt-1 w-full bg-transparent outline-none text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                        />
                                    </div>
                                    <div className={`rounded-xl p-3 border ${isDarkMode ? 'bg-zinc-900/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-80">{dict?.debate?.aspectRatio || 'Aspect'}</div>
                                        <input
                                            value={pendingImageAspect}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPendingImageAspect(e.target.value)}
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
                )
            }

            {/* Phase 8: Video generation confirmation modal */}
            {
                isVideoModalOpen && (
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
                )
            }

        </div >
    );
}