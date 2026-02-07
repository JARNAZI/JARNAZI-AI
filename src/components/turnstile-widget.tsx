'use client'

import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onError?: () => void;
}

export default function TurnstileWidget({ onVerify, onError, className }: TurnstileWidgetProps & { className?: string }) {
    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY;

    // Production-safe diagnostic (log only boolean)
    if (typeof window !== 'undefined') {
        console.log(`[Diagnostic] Turnstile Site Key present: ${!!siteKey}`);
    }

    if (!siteKey) {
        console.warn("NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY is missing. Widget disabled.");
        return <div className="text-yellow-500 text-xs p-2 border border-yellow-500/30 rounded">Security Check (Turnstile) Key Missing</div>;
    }

    return (
        <div className={className}>
            <Turnstile
                siteKey={siteKey}
                onSuccess={onVerify}
                onError={onError}
                options={{
                    theme: 'dark',
                    size: 'flexible'
                }}
            />
        </div>
    )
}
