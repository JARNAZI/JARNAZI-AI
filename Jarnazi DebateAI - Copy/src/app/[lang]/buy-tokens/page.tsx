'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MIN_PURCHASE_AMOUNT_USD, TOKENS_PER_USD } from '@/lib/tokens';
import { toast } from 'sonner';

export default function BuyTokensPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [amount, setAmount] = useState<string>(String(MIN_PURCHASE_AMOUNT_USD));
  const [loading, setLoading] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [nowpaymentsEnabled, setNowpaymentsEnabled] = useState(false);

  const tokens = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n) * TOKENS_PER_USD;
  }, [amount]);

  useEffect(() => {
    // Read feature flags from site_settings (best effort)
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key,value')
        .eq('key', 'features')
        .maybeSingle();

      const features = (data as any)?.value;
      if (features) {
        setStripeEnabled(Boolean(features.payments_stripe_enabled ?? true));
        setNowpaymentsEnabled(Boolean(features.payments_nowpayments_enabled ?? false));
      }
    })();
  }, [supabase]);

  const payWithStripe = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error('Please sign in first');
        router.push(`/${lang}/login`);
        return;
      }

      const res = await fetch('/api/buy-tokens/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount: Number(amount), lang }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Checkout failed');
      if (json?.url) window.location.href = json.url;
    } catch (e: any) {
      toast.error(e.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Link href={`/${lang}/debate`} className="text-sm text-zinc-300 hover:text-white">
            ← Back to Debate
          </Link>
        </div>

        <h1 className="text-3xl font-semibold mb-2">Buy Tokens</h1>
        <p className="text-zinc-300 mb-8">Enter an amount (min {MIN_PURCHASE_AMOUNT_USD}) and we will add tokens to your balance.</p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <label className="block text-sm text-zinc-300 mb-2">Enter amount (min {MIN_PURCHASE_AMOUNT_USD})</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-zinc-600"
            placeholder={String(MIN_PURCHASE_AMOUNT_USD)}
          />
          <div className="mt-3 text-sm text-zinc-300">
            You will receive <span className="text-white font-semibold">{tokens}</span> Tokens
          </div>

          <div className="mt-6 space-y-3">
            <button
              disabled={!stripeEnabled || loading}
              onClick={payWithStripe}
              className="w-full rounded-xl bg-white text-zinc-900 font-semibold py-3 disabled:opacity-50"
            >
              Pay & Add Tokens
            </button>

            {!stripeEnabled && (
              <div className="text-sm text-zinc-400">
                Stripe payments are currently disabled.
              </div>
            )}

            {nowpaymentsEnabled && (
              <div className="text-sm text-zinc-400">
                NowPayments is enabled but not wired in this build yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
