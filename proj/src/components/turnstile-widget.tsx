'use client'

import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onError?: () => void;
}

export default function TurnstileWidget({ onVerify, onError, className }: TurnstileWidgetProps & { className?: string }) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
        console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing. Widget disabled.");
        // In dev, we might want to auto-verify or show a message
        return <div className="text-yellow-500 text-xs p-2 border border-yellow-500/30 rounded">Turnstile Key Missing (Dev Mode)</div>;
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
