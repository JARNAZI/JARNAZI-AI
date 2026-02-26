'use client'

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner'
import TurnstileWidget from '@/components/turnstile-widget'
import { mapAuthError } from '@/lib/auth-errors';

export default function LoginClient({ dict, lang, siteKey, supabaseUrl, supabaseAnonKey }: {
    dict: any;
    lang: string;
    siteKey?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
}) {
    const d = dict.auth || {};
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [turnstileToken, setTurnstileToken] = useState("")

    useEffect(() => {
        if (searchParams.get('verified') === '1') {
            toast.success(d.emailVerified || 'Email verified successfully. You can now log in.');
            // Clear the param
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('verified');
            router.replace(`${pathname}?${newParams.toString()}`);
        }
    }, [searchParams, d.emailVerified, router, pathname]);

    // Use injected credentials if available (runtime config), else fallback to env vars (build-time config)
    const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }))

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!turnstileToken) {
            const msg = d.error?.turnstileFailed || d.securityCheck || "Please complete the security check."
            setError(msg)
            toast.error(msg)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                throw error
            }

            router.push(`/${lang}/debate`)
            router.refresh()
        } catch (err: unknown) {
            const mappedError = mapAuthError(err, dict);
            setError(mappedError)
            toast.error(mappedError)
            setTurnstileToken("")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md bg-card/50 border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-xl text-left">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-tight">
                        {d.welcome || "Welcome Back"}
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">{d.subtitle || "Sign in to orchestrate the debate."}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive text-sm font-bold">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{d.email || "Email Address"}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-xl pl-10 pr-4 py-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-medium"
                                placeholder={d.emailPlaceholder || "architect@jarnazi.com"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{d.password || "Password"}</label>
                            <Link href={`/${lang}/forgot-password`} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                                {d.forgotPassword || "Forgot Password?"}
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-xl pl-10 pr-4 py-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-medium"
                                placeholder={d.passwordPlaceholder || "••••••••"}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <TurnstileWidget onVerify={setTurnstileToken} siteKey={siteKey} />

                    <button
                        type="submit"
                        disabled={loading || !turnstileToken}
                        className="w-full bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl transition-all shadow-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (d.signIn || 'Sign In')}
                    </button>
                </form>

                <div className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {d.noAccount || "Don’t have an account?"}{' '}
                    <Link href={`/${lang}/register`} className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer border-b border-indigo-400/30 pb-0.5">
                        {d.createProfile || "Create Profile"}
                    </Link>
                </div>
            </div>
        </div>
    )
}
