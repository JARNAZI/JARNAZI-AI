'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

let eagerToken = '';
if (typeof window !== 'undefined' && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    eagerToken = hashParams.get('access_token') || '';
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

    useEffect(() => {
        if (!savedHashToken && typeof window !== 'undefined' && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const token = hashParams.get('access_token');
            if (token) {
                setSavedHashToken(token);
            }
        }
    }, [savedHashToken]);

    const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // First verify if the hash was parsed and a session exists
            const { data: { session } } = await supabase.auth.getSession();
            let accessToken = session?.access_token || '';

            // Fallback: use the token we eagerly grabbed on mount, or check current hash
            if (!accessToken) {
                accessToken = savedHashToken;
            }
            if (!accessToken && typeof window !== 'undefined') {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                accessToken = hashParams.get('access_token') || '';
            }

            if (!accessToken) {
                throw new Error("Invalid or expired reset link. Please try again.");
            }

            // Send password change request to custom API using our token, skipping native Supabase email triggers
            const response = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ password })
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
