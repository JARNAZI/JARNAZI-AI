
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

import TurnstileWidget from '@/components/turnstile-widget'

export default function RegisterPage() {
    const params = useParams()
    const lang = (params?.lang as string) || 'en'
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
            setError("Please complete the security check.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Updated to use Server-Side API + Resend
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
            const msg = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)
            setError(msg)
            toast.error(msg)
            setTurnstileToken("") // Reset
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-xl text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Check your email</h2>
                    <p className="text-gray-400 mb-8">
                        We’ve sent a confirmation link to <strong className="text-white">{email}</strong>.
                        Please verify your account to continue.
                    </p>
                    <Link
                        href={`/${lang}/login`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md bg-card/50 border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Join the Council
                    </h1>
                    <p className="text-muted-foreground mt-2">Create your identity in the Jarnazi network.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-muted-foreground text-foreground"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-muted-foreground text-foreground"
                                placeholder="architect@jarnazi.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-muted-foreground text-foreground"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* Privacy Policy and Terms Consent */}
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                            required
                        />
                        <label htmlFor="terms" className="text-sm text-gray-400 cursor-pointer">
                            I agree to the{' '}
                            <Link href={`/${lang}/terms`} className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer" target="_blank">
                                Terms of Use
                            </Link>
                            {' '}and{' '}
                            <Link href={`/${lang}/privacy`} className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer" target="_blank">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    <TurnstileWidget onVerify={setTurnstileToken} />

                    <button
                        type="submit"
                        disabled={loading || !turnstileToken}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href={`/${lang}/login`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    )
}
