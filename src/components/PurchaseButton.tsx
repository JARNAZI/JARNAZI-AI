'use client';

import { useState } from 'react';
import { toast } from 'sonner';
interface PurchaseButtonProps {
    planId: string;
    planName: string;
    isHighlight: boolean;
    lang?: string;
}

export default function PurchaseButton({ planId, planName, isHighlight, lang }: PurchaseButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    toast.error("Please login to purchase tokens");
                    // You might want to redirect to login here
                    window.location.href = `/${lang || 'en'}/login`;
                    return;
                }
                throw new Error(data.error);
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePurchase}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                ${isHighlight
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
                    : 'glass hover:bg-white/10 text-white'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? 'Processing...' : `Purchase ${planName.split(' ')[0]}`}
        </button>
    );
}
