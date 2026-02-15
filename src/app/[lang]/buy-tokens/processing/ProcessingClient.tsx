'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ProcessingClient({ dict, lang }: { dict: any; lang: string }) {
    const d = { ...(dict?.dashboard || {}), ...(dict?.buyTokensPage || {}) };
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [status, setStatus] = useState<'pending' | 'finished' | 'timeout' | 'error'>('pending');
    const [supabase] = useState(() => createClient());
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            return;
        }

        const checkStatus = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const res = await fetch(`/api/buy-tokens/status?orderId=${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await res.json();

                if (data.status === 'finished') {
                    setStatus('finished');
                    if (pollInterval.current) clearInterval(pollInterval.current);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);

                    // Redirect after a short delay to show success
                    setTimeout(() => {
                        router.push(`/${lang}/debate?purchase=success`);
                    }, 2000);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        // Initial check
        checkStatus();

        // Poll every 5 seconds
        pollInterval.current = setInterval(checkStatus, 5000);

        // Timeout after 3 minutes (180,000 ms)
        timeoutRef.current = setTimeout(() => {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setStatus('timeout');
        }, 180000);

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [orderId, supabase, lang, router]);

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-6">
                {status === 'pending' && (
                    <>
                        <div className="flex justify-center">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-primary/50" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">
                            {d.waitingConfirmation || 'Waiting for payment confirmation...'}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            {d.cryptoTakesMinutes || 'Crypto confirmation may take a few minutes. Please keep this page open or you can safely return later.'}
                        </p>
                    </>
                )}

                {status === 'finished' && (
                    <>
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-in zoom-in duration-500" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">
                            {d.paymentConfirmed || 'Payment Confirmed!'}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            {d.tokensAdded || 'Tokens have been added to your account. Redirecting to terminal...'}
                        </p>
                    </>
                )}

                {status === 'timeout' && (
                    <>
                        <div className="flex justify-center">
                            <Clock className="w-16 h-16 text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">
                            {d.stillProcessing || 'Still Processing...'}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            {d.timeoutMsg || 'The transaction is taking longer than expected. Tokens will appear automatically once confirmed.'}
                        </p>
                        <Link
                            href={`/${lang}/debate`}
                            className="inline-block w-full bg-primary text-primary-foreground py-3 rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            {d.backToConsole || 'Back to Console'}
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center">
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">
                            {d.invalidRequest || 'Invalid Request'}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            {d.errorMsg || 'No payment ID found.'}
                        </p>
                        <Link
                            href={`/${lang}/buy-tokens`}
                            className="inline-block w-full bg-muted text-foreground py-3 rounded-xl font-black uppercase tracking-widest hover:bg-secondary transition-all"
                        >
                            {d.backToBuy || 'Back to Buy Tokens'}
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
