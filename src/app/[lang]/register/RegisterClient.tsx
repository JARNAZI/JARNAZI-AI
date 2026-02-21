'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import TurnstileWidget from '@/components/turnstile-widget'
import { mapAuthError } from '@/lib/auth-errors';

export default function RegisterClient({ dict, lang, siteKey, supabaseUrl, supabaseAnonKey }: {
    dict: any;
    lang: string;
    siteKey?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
}) {
    const d = dict.auth || {};
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState("")

    const handleRegister = async (e: React.FormEvent) => {
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
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                    lang,
                    turnstileToken
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Registration failed');
            }

            setSuccess(true)
        } catch (err: unknown) {
            const mappedError = mapAuthError(err, dict);
            setError(mappedError)
            toast.error(mappedError)
            setTurnstileToken("")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-card/50 border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-xl text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-4">{d.checkEmail || "Check your email"}</h2>
                    <p className="text-muted-foreground mb-8 font-medium">
                        {d.checkEmailDesc?.replace('{email}', email) || `We’ve sent a confirmation link to ${email}. Please verify your account to continue.`}
                    </p>
                    <Link
                        href={`/${lang}/login`}
                        className="inline-flex items-center justify-center px-10 py-4 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl"
                    >
                        {d.backToLogin || "Back to Login"}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md bg-card/50 border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-xl text-left">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent uppercase tracking-tight">
                        {d.joinCouncil || "Join the Council"}
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">{d.createIdentity || "Create your identity in the Jarnazi network."}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive text-sm font-bold">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{d.fullName || "Full Name"}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-xl pl-10 pr-4 py-4 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-medium"
                                placeholder={d.fullNamePlaceholder || "John Doe"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{d.email || "Email Address"}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-xl pl-10 pr-4 py-4 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-medium"
                                placeholder={d.emailPlaceholder || "architect@jarnazi.com"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{d.password || "Password"}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-xl pl-10 pr-4 py-4 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-medium"
                                placeholder={d.passwordPlaceholder || "••••••••"}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 ml-1">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 w-4 h-4 rounded border-border bg-background text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                            required
                        />
                        <label htmlFor="terms" className="text-[10px] font-black uppercase tracking-tight text-muted-foreground cursor-pointer leading-relaxed">
                            {d.iAgreeTo || "I agree to the"}{' '}
                            <Link href={`/${lang}/terms`} className="text-cyan-500 hover:text-cyan-400 border-b border-cyan-500/30 cursor-pointer" target="_blank">
                                {d.termsOfUse || "Terms of Use"}
                            </Link>
                            {' '}{d.and || "and"}{' '}
                            <Link href={`/${lang}/privacy`} className="text-cyan-500 hover:text-cyan-400 border-b border-cyan-500/30 cursor-pointer" target="_blank">
                                {d.privacyPolicy || "Privacy Policy"}
                            </Link>
                        </label>
                    </div>

                    <TurnstileWidget onVerify={setTurnstileToken} siteKey={siteKey} />

                    <button
                        type="submit"
                        disabled={loading || !turnstileToken}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (d.createAccount || 'Create Account')}
                    </button>
                </form>

                <div className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {d.alreadyHaveAccount || "Already have an account?"}{' '}
                    <Link href={`/${lang}/login`} className="text-cyan-500 hover:text-cyan-400 transition-colors border-b border-cyan-500/30 pb-0.5">
                        {d.signIn || "Sign In"}
                    </Link>
                </div>
            </div>
        </div>
    )
}
