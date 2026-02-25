'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/i18n/use-dictionary';
import { Reply, Loader2, Send } from 'lucide-react';
import { replyToMessage } from '@/app/actions/contact';
import { toast } from 'sonner';

interface ReplyModalProps {
    messageId: string;
    recipientName: string;
}

export default function ReplyModal({ messageId, recipientName }: ReplyModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);

    const params = useParams();
    const lang = (params as any)?.lang || 'en';
    const dict = useDictionary(String(lang));

    const handleSend = async () => {
        if (!replyText.trim()) return;
        setLoading(true);
        try {
            await replyToMessage(messageId, replyText);
            toast.success(dict.adminMessages?.replySent ?? 'Reply sent successfully');
            setIsOpen(false);
        } catch (error: unknown) {
            toast.error((error instanceof Error ? error.message : String(error)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center gap-2 text-sm font-medium"
            >
                <Reply className="w-4 h-4" />
                Reply
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-[#18181b] border border-border rounded-xl shadow-2xl p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-foreground"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-foreground mb-4">Reply to {recipientName}</h3>

                        <div className="space-y-4">
                            <textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Type your response here..."
                                rows={6}
                                className="w-full bg-black/50 border border-border rounded-lg p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                autoFocus
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-foreground hover:bg-muted/40 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !replyText.trim()}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-foreground font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {dict.adminMessages?.sendReply ?? 'Send Reply'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
