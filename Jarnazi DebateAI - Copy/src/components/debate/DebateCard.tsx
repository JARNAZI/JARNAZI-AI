import { Bot, User, CheckCircle2, BadgeCheck, Copy, Download, Printer, Check, Play, Share2 } from "lucide-react";
import { MathDisplay } from '@/components/math/MathDisplay';
import { useState } from "react";

interface DebateCardProps {
    role: 'user' | 'assistant' | 'agreement';
    name: string;
    content: string;
    provider?: string;
}

export function DebateCard({ role, name, content, provider }: DebateCardProps) {
    const isUser = role === 'user';
    const isAgreement = role === 'agreement';
    const [copied, setCopied] = useState(false);

    // Provider-specific styling
    const getProviderStyle = () => {
        if (isUser) {
            return {
                iconBg: 'bg-primary/20 border border-primary/30 shadow-[0_0_15px_-3px_var(--primary)]',
                icon: <User className="w-4 h-4 text-primary" />,
                nameColor: 'text-primary font-bold tracking-tight',
                cardBg: 'glass-card border-l-4 border-l-primary/50 text-foreground ml-12 rounded-tr-lg shadow-2xl backdrop-blur-xl'
            };
        }

        if (isAgreement) {
            return {
                iconBg: 'bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_15px_-3px_#10b981]',
                icon: <BadgeCheck className="w-4 h-4 text-emerald-400" />,
                nameColor: 'text-emerald-400 font-bold tracking-tight',
                cardBg: 'glass-card border-green-500/30 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] text-emerald-50 bg-emerald-500/5'
            };
        }

        // AI providers
        const providerLower = provider?.toLowerCase() || '';

        if (providerLower.includes('openai') || providerLower.includes('chatgpt')) {
            return {
                iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
                icon: <Bot className="w-4 h-4 text-emerald-400" />,
                nameColor: 'text-emerald-400 font-semibold',
                cardBg: 'bg-emerald-500/[0.03] border border-emerald-500/10 text-gray-100 hover:border-emerald-500/20 transition-all shadow-xl'
            };
        }

        if (providerLower.includes('deepseek')) {
            return {
                iconBg: 'bg-blue-500/10 border border-blue-500/20',
                icon: <Bot className="w-4 h-4 text-blue-400" />,
                nameColor: 'text-blue-400 font-semibold',
                cardBg: 'bg-blue-500/[0.03] border border-blue-500/10 text-gray-100 hover:border-blue-500/20 transition-all shadow-xl'
            };
        }

        if (providerLower.includes('anthropic') || providerLower.includes('claude')) {
            return {
                iconBg: 'bg-orange-500/10 border border-orange-500/20',
                icon: <Bot className="w-4 h-4 text-orange-400" />,
                nameColor: 'text-orange-400 font-semibold',
                cardBg: 'bg-orange-500/[0.03] border border-orange-500/10 text-gray-100 hover:border-orange-500/20 transition-all shadow-xl'
            };
        }

        // Default (indigo)
        return {
            iconBg: 'bg-indigo-500/10 border border-indigo-500/20',
            icon: <Bot className="w-4 h-4 text-indigo-400" />,
            nameColor: 'text-indigo-400 font-semibold',
            cardBg: 'bg-white/[0.03] border border-white/10 text-gray-200 hover:border-indigo-500/20 transition-all shadow-xl'
        };
    };

    const style = getProviderStyle();

    // Check for LaTeX delimiters
    const hasLatex = /\$\$[\s\S]*?\$\$|\$[\s\S]*?\$/.test(content);

    // Check for Visual Output (Image/Video) - Hide header
    const isVisual = name === 'Visual Output' || name === 'System Visual';
    const isVideo = name === 'Video Output' || (content && (content.includes('.mp4') || content.includes('.webm') || content.includes('.mov')));
    const isAudio = content && (content.includes('.mp3') || content.includes('.wav') || content.includes('.m4a'));
    const isMedia = isVideo || isAudio;

    // Actions
    const handlePlay = () => {
        const match = content.match(/\((.*?)\)/);
        if (match && match[1]) {
            window.open(match[1], '_blank');
        } else {
            const videoElement = document.querySelector('video');
            if (videoElement) {
                videoElement.play();
            }
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debate-turn-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Jarnazi Transcript - ${name}</title>
                        <style>
                            body { font-family: system-ui, -apple-system, sans-serif; padding: 3rem; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; }
                            .header { border-bottom: 2px solid #EEE; margin-bottom: 2rem; padding-bottom: 1rem; }
                            .meta { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.1em; }
                            .content { white-space: pre-wrap; word-wrap: break-word; font-size: 16px; }
                            .footer { margin-top: 4rem; font-size: 0.7rem; color: #AAA; text-align: center; border-top: 1px solid #EEE; padding-top: 1rem; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="meta">${provider || 'User Session'}</div>
                            <h1>${name}</h1>
                        </div>
                        <div class="content">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                        <div class="footer">Generated by Jarnazi Consensus AI Console</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    if (isVisual) {
        return (
            <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto items-center my-6 group animate-fade-in">
                <div className="relative rounded-[2rem] overflow-hidden glass-card border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-700">
                    <div className="prose prose-invert max-w-none p-2">
                        <MathDisplay content={content} />
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Neural Render</span>
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button onClick={handleDownload} className="p-2 bg-black/60 backdrop-blur-xl text-white hover:bg-primary rounded-xl border border-white/10 transition-all shadow-2xl" title="Save Image">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-3 w-full max-w-4xl mx-auto ${isUser ? 'items-end' : 'items-start'} group animate-fade-in-up`}>
            <div className={`flex items-center gap-4 mb-2 px-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`p-2 rounded-xl flex items-center justify-center backdrop-blur-xl border shadow-lg transform group-hover:rotate-6 transition-transform duration-500 ${style.iconBg}`}>
                    {style.icon}
                </div>
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <span className={`text-sm font-bold tracking-tight ${style.nameColor}`}>
                        {name}
                    </span>
                    {provider && !isUser && !isAgreement && (
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-0.5">
                            {provider}
                        </span>
                    )}
                </div>
            </div>

            <div className={`relative p-6 rounded-[2rem] leading-relaxed text-[15px] w-full md:min-w-[450px] backdrop-blur-2xl ${style.cardBg} group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-500`}>
                {!isUser && (
                    <div className="absolute -top-px -left-px w-8 h-8 border-t border-l border-white/20 rounded-tl-[2rem] opacity-30 group-hover:opacity-100 transition-opacity" />
                )}

                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 overflow-hidden break-words mb-4 text-zinc-100 font-medium tracking-tight">
                    {hasLatex ? <MathDisplay content={content} /> : content}
                </div>

                {isVideo && content.match(/\((.*?)\)/)?.[1] && (
                    <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner group/video relative">
                        <video
                            src={content.match(/\((.*?)\)/)?.[1]}
                            controls
                            className="w-full max-h-[450px]"
                        />
                    </div>
                )}

                {isAudio && content.match(/\((.*?)\)/)?.[1] && (
                    <div className="mt-6 p-4 rounded-2xl border border-white/10 bg-gradient-to-r from-black/60 to-indigo-500/10 backdrop-blur-md">
                        <audio
                            src={content.match(/\((.*?)\)/)?.[1]}
                            controls
                            className="w-full h-10 filter invert hue-rotate-180"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 justify-end opacity-70 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    {isMedia && (
                        <button
                            onClick={handlePlay}
                            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Stream
                        </button>
                    )}

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>

                    <button
                        onClick={handleDownload}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                        title="Download Markdown"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handlePrint}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                        title="Print Entry"
                    >
                        <Printer className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: `Jarnazi Debate - ${name}`, text: content });
                            }
                        }}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                        title="Share"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
