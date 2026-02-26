'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MIN_PURCHASE_AMOUNT_USD, TOKENS_PER_USD, amountToTokens, isValidPurchaseAmount, normalizeAmount } from '@/lib/tokens';
import { toast } from 'sonner';

export default function BuyTokensClient({ dict, lang, supabaseUrl, supabaseAnonKey }: { dict: any; lang: string; supabaseUrl?: string; supabaseAnonKey?: string }) {
  const d = { ...(dict?.dashboard || {}), ...(dict?.buyTokensPage || {}) };
  const common = dict?.common || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));

  const [amount, setAmount] = useState<string>(String(MIN_PURCHASE_AMOUNT_USD));
  const missingTokens = useMemo(() => {
    const m = Number(searchParams.get('missing') ?? 0);
    return Number.isFinite(m) && m > 0 ? Math.floor(m) : 0;
  }, [searchParams]);
  const returnUrl = useMemo(() => searchParams.get('return') ?? '', [searchParams]);

  // If user came here due to insufficient tokens, prefill amount to cover the missing tokens.
  useEffect(() => {
    if (!missingTokens) return;
    const neededUsd = Math.ceil((missingTokens / TOKENS_PER_USD) * 100) / 100;
    const target = Math.max(MIN_PURCHASE_AMOUNT_USD, neededUsd);
    setAmount(String(target));
    toast.info((dict.notifications?.insufficientTokens || d?.insufficientTokensPrefill || 'We prefilled the amount to cover your missing tokens.') + ` (${missingTokens})`);
  }, [missingTokens, dict.notifications?.insufficientTokens, d?.insufficientTokensPrefill]);

  useEffect(() => {
    const purchase = searchParams.get('purchase');
    if (purchase) {
      if (purchase === 'success') {
        toast.success(dict.notifications?.paymentSuccess || 'Payment successful. Tokens added to your balance.');
      } else if (purchase === 'cancel') {
        toast.error(dict.notifications?.paymentCancel || 'Payment canceled.');
      } else if (purchase === 'failed') {
        toast.error(dict.notifications?.paymentFailed || 'Payment failed.');
      }

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('purchase');
      router.replace(`${pathname}?${newParams.toString()}`);
    }
  }, [searchParams, dict.notifications, router, pathname]);
  const [loading, setLoading] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [nowpaymentsEnabled, setNowpaymentsEnabled] = useState(false);
  const [stripeTestMode, setStripeTestMode] = useState(false);

  const amountNum = useMemo(() => normalizeAmount(amount) ?? 0, [amount]);

  const tokens = useMemo(() => {
    if (!Number.isFinite(amountNum) || amountNum <= 0) return 0;
    return amountToTokens(amountNum);
  }, [amountNum]);

  useEffect(() => {
    // Read payment gateway toggles from `site_settings`.
    (async () => {
      try {
        // Try KV schema first
        const { data, error } = await supabase
          .from('site_settings')
          .select('key,value')
          .in('key', ['gateway_stripe_enabled', 'gateway_nowpayments_enabled', 'stripe_test_mode']);

        let map: Record<string, string> = {};

        if (!error && data && data.length > 0) {
          data.forEach(row => {
            map[row.key] = String(row.value);
          });
        } else {
          // Fallback: single-row schema with `features` JSONB
          const { data: rowData, error: rowError } = await supabase
            .from('site_settings')
            .select('features')
            .limit(1)
            .maybeSingle();

          if (!rowError && rowData?.features) {
            const features = rowData.features as Record<string, any>;
            if (features.gateway_stripe_enabled !== undefined) map.gateway_stripe_enabled = String(features.gateway_stripe_enabled);
            else if (features.payments_stripe_enabled !== undefined) map.gateway_stripe_enabled = String(features.payments_stripe_enabled);

            if (features.gateway_nowpayments_enabled !== undefined) map.gateway_nowpayments_enabled = String(features.gateway_nowpayments_enabled);
            else if (features.payments_nowpayments_enabled !== undefined) map.gateway_nowpayments_enabled = String(features.payments_nowpayments_enabled);
            
            if (features.stripe_test_mode !== undefined) map.stripe_test_mode = String(features.stripe_test_mode);
          }
        }

        if (map.gateway_stripe_enabled !== undefined) {
          setStripeEnabled(map.gateway_stripe_enabled === 'true');
        }
        if (map.gateway_nowpayments_enabled !== undefined) {
          setNowpaymentsEnabled(map.gateway_nowpayments_enabled === 'true');
        }
        if (map.stripe_test_mode !== undefined) {
          setStripeTestMode(map.stripe_test_mode === 'true');
        }
      } catch (err) {
        console.error("Failed to load payment settings:", err);
      }
    })();
  }, [supabase]);

  const requireAuthOrRedirect = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast.error(d.signInFirst || 'Please sign in first');
      router.push(`/${lang}/login`);
      return null;
    }
    return accessToken;
  };

  const validateAmountOrToast = (): boolean => {
    if (!isValidPurchaseAmount(amountNum)) {
      toast.error(d.invalidAmount?.replace('{min}', String(MIN_PURCHASE_AMOUNT_USD)) || `Invalid amount. Minimum is $${MIN_PURCHASE_AMOUNT_USD}.`);
      return false;
    }
    if (tokens <= 0) {
      toast.error(d.invalidAmount?.replace('{min}', String(MIN_PURCHASE_AMOUNT_USD)) || `Invalid amount. Minimum is $${MIN_PURCHASE_AMOUNT_USD}.`);
      return false;
    }
    return true;
  };

  const payWithStripe = async () => {
    if (!validateAmountOrToast()) return;
    setLoading(true);
    try {
      const accessToken = await requireAuthOrRedirect();
      if (!accessToken) return;

      const res = await fetch('/api/buy-tokens/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount: amountNum, lang }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || d.checkoutFailed || 'Checkout failed');
      if (json?.url) window.location.href = json.url;
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || d.checkoutFailed || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const payWithNowpayments = async () => {
    if (!validateAmountOrToast()) return;
    setLoading(true);
    try {
      const accessToken = await requireAuthOrRedirect();
      if (!accessToken) return;

      const res = await fetch('/api/buy-tokens/nowpayments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount: amountNum, lang }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || d.checkoutFailed || 'Checkout failed');
      if (json?.url) window.location.href = json.url;
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || d.checkoutFailed || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-xl mx-auto px-6 py-10 text-left">
        <div className="mb-6">
          <Link href={`/${lang}/debate`} className="text-sm text-muted-foreground hover:text-foreground">
            ← {d.backToConsole || 'Back to Console'}
          </Link>
        </div>

        <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">{d.title || d.buyTokens || 'Buy Tokens'}</h1>
        <p className="text-muted-foreground mb-8">
          {d.enterAmount?.replace('{min}', String(MIN_PURCHASE_AMOUNT_USD)) || `Enter any amount (min $${MIN_PURCHASE_AMOUNT_USD})`}
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <label className="block text-sm text-muted-foreground mb-2 font-bold uppercase tracking-widest">
            {d.enterAmount?.replace('{min}', String(MIN_PURCHASE_AMOUNT_USD)) || `Enter amount (min $${MIN_PURCHASE_AMOUNT_USD})`}
          </label>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder={`$${MIN_PURCHASE_AMOUNT_USD}`}
          />

          <div className="mt-3 text-sm text-muted-foreground">
            {(d.youWillReceive || d.tokensReceive || 'You will receive')}{' '}
            <span className="text-foreground font-black">{tokens}</span> {common.tokens || 'Tokens'}
          </div>

          <div className="mt-6 space-y-3">
            {stripeEnabled ? (
              <div className="space-y-2">
                <button
                  disabled={loading}
                  onClick={payWithStripe}
                  className="w-full rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest py-3 disabled:opacity-50 hover:opacity-90 transition-all shadow-lg"
                >
                  {d.payAddTokens || d.payWithStripe || 'Pay & Add Tokens'}
                </button>
                {stripeTestMode && (
                  <div className="text-center">
                    <span className="text-[10px] font-bold bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded uppercase tracking-tighter">
                      Test Mode Active
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">{d.stripeDisabled || 'Stripe payments are currently disabled.'}</div>
            )}

            {nowpaymentsEnabled ? (
              <button
                disabled={loading}
                onClick={payWithNowpayments}
                className="w-full rounded-xl bg-muted text-foreground font-black uppercase tracking-widest py-3 disabled:opacity-50 hover:opacity-90 transition-all border border-border"
              >
                {d.payWithCrypto || 'Pay with Crypto (NOWPayments)'}
              </button>
            ) : (
              <div className="text-sm text-muted-foreground italic">{d.nowpaymentsDisabled || 'Crypto payments are currently disabled.'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
