'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

let eagerToken = '';
let eagerOtpToken = '';
let eagerEmail = '';
if (typeof window !== 'undefined') {
    if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        eagerToken = hashParams.get('access_token') || '';
    }
    if (window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        eagerOtpToken = searchParams.get('token') || '';
        eagerEmail = searchParams.get('email') || '';
    }
}

export default function UpdatePasswordClient({ lang, dict, supabaseUrl, supabaseAnonKey }: {
    lang: string;
    dict: any;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
}) {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [savedHashToken, setSavedHashToken] = useState(eagerToken);
    const [savedOtpToken, setSavedOtpToken] = useState(eagerOtpToken);
    const [savedEmail, setSavedEmail] = useState(eagerEmail);

    useEffect(() => {
        if (!savedHashToken && typeof window !== 'undefined' && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const token = hashParams.get('access_token');
            if (token) setSavedHashToken(token);
        }
        if (typeof window !== 'undefined' && window.location.search) {
            const searchParams = new URLSearchParams(window.location.search);
            const token = searchParams.get('token');
            const email = searchParams.get('email');
            if (token && !savedOtpToken) setSavedOtpToken(token);
            if (email && !savedEmail) setSavedEmail(email);
        }
    }, [savedHashToken, savedOtpToken, savedEmail]);

    const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check for modern OTP token or legacy hash token
            let finalOtpToken = savedOtpToken;
            let finalAccessToken = savedHashToken;
            let finalEmail = savedEmail;

            // Only attempt session load if we need a legacy token and don't have it
            if (!finalOtpToken && !finalAccessToken) {
                const { data: { session } } = await supabase.auth.getSession();
                finalAccessToken = session?.access_token || '';
            }

            if (!finalOtpToken && !finalAccessToken) {
                throw new Error("Invalid or expired reset link. Please try again.");
            }

            const payload: any = { password };
            if (finalOtpToken) {
                payload.token = finalOtpToken;
                payload.email = finalEmail;
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (finalAccessToken && !finalOtpToken) {
                headers['Authorization'] = `Bearer ${finalAccessToken}`;
            }

            // Send password change request to custom API
            const response = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update password');
            }

            setSuccess(true);
            toast.success(dict.updatePasswordPage.toastSuccess);

            // Clear the local session so they must log in with the new password
            await supabase.auth.signOut();

            // Force a full redirect after delay to clear any hash fragments
            setTimeout(() => {
                window.location.href = `/${lang}/login`;
            }, 2500);
        } catch (err: unknown) {
            toast.error((err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card/50 border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        {dict.updatePasswordPage.title}
                    </h1>
                    <p className="text-muted-foreground mt-2">{dict.updatePasswordPage.subtitle}</p>
                </div>

                {success ? (
                    <div className="text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-2">{dict.updatePasswordPage.successTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                            {dict.updatePasswordPage.successMessage}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{dict.updatePasswordPage.newPassword}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-muted-foreground text-foreground"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : dict.updatePasswordPage.submit}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
