'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordClientProps {
    lang: string;
    dict: any;
}

export default function ForgotPasswordClient({ lang, dict }: ForgotPasswordClientProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    lang
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send reset email');
            }

            setSuccess(true);
            toast.success(dict.auth.forgotPasswordSuccess);
        } catch (err: unknown) {
            toast.error((err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card/50 border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
                <Link href={`/${lang}/login`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {dict.auth.backToLogin}
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        {dict.auth.forgotPasswordTitle}
                    </h1>
                    <p className="text-muted-foreground mt-2">{dict.auth.forgotPasswordSubtitle}</p>
                </div>

                {success ? (
                    <div className="text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-2">{dict.auth.checkInbox}</h3>
                        <p className="text-sm text-muted-foreground">
                            {dict.auth.resetLinkSent} <span className="text-foreground font-medium">{email}</span>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{dict.auth.email}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-muted-foreground text-foreground"
                                    placeholder={dict.auth.emailPlaceholder}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : dict.auth.sendResetLink}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
