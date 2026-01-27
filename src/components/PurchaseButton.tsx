'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface PurchaseButtonProps {
  amountUsd: number; // e.g. 14, 50, 330
  label: string; // button label
  isHighlight: boolean;
  lang?: string;
}

export default function PurchaseButton({ amountUsd, label, isHighlight, lang }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buy-tokens/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountUsd, lang: lang || 'en' }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please login to purchase tokens');
          window.location.href = `/${lang || 'en'}/login`;
          return;
        }
        throw new Error(data?.error || 'Checkout failed');
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (error: unknown) {
      console.error(error);
      toast.error((error instanceof Error ? error.message : String(error)) || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
        ${
          isHighlight
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
            : 'glass hover:bg-white/10 text-white'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? 'Processing...' : label}
    </button>
  );
}
