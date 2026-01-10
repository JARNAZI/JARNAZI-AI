'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CreditCard, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type TokenPlan = {
  id: string;
  name: string;
  price_cents: number;
  credits_cents: number;
  description?: string;
  features?: string[];
  highlight?: boolean;
  label?: string;
  active?: boolean;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PlansPage(props: { params: Promise<{ lang: string }> }) {
  const params = use(props.params);
  const [plans, setPlans] = useState<TokenPlan[]>([]);
  const [customCreditsDollars, setCustomCreditsDollars] = useState('50');
  const [enableCustom, setEnableCustom] = useState(true);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/plans');
        const data = await res.json();
        const arr = Array.isArray(data.token_plans) ? data.token_plans : [];
        const normalized: TokenPlan[] = arr.map((p: any) => ({
          id: String(p.id),
          name: String(p.name ?? 'Plan'),
          price_cents: Number(p.price_cents ?? p.price ?? 0),
          credits_cents: Number(p.credits_cents ?? Math.round(Number(p.price_cents ?? p.price ?? 0) * 0.75)),
          description: p.description ?? '',
          features: Array.isArray(p.features) ? p.features : [],
          highlight: !!p.highlight,
          label: p.label ?? '',
          active: p.active !== false,
        })).filter(p => p.price_cents > 0 && p.active);

        setPlans(normalized);
        setEnableCustom(data.enable_custom_tokens !== false);
      } catch (e: any) {
        console.error(e);
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const customPlanId = useMemo(() => {
    const dollars = parseFloat(customCreditsDollars);
    if (!isFinite(dollars) || dollars <= 0) return null;
    const cents = Math.round(dollars * 100);
    return `custom_${cents}`;
  }, [customCreditsDollars]);

  const handleCheckout = async (planId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login first');
      return;
    }
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j.error || 'Checkout failed');
      if (j.url) window.location.href = j.url;
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link href={`/${params.lang}`} className="inline-flex items-center gap-2 text-zinc-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back</span>
          </Link>
          <div className="text-xs text-zinc-500">Token plans (no expiry) • 75% credits / 25% margin</div>
        </div>

        <header className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Token Plans
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-sm mt-2">
            Buy credits. They end only when you use them up.
          </p>
        </header>

        {loading ? (
          <div className="text-center text-zinc-500">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div key={p.id} className={`border rounded-2xl p-6 bg-zinc-950/60 ${p.highlight ? 'border-indigo-500/60' : 'border-zinc-800'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black uppercase tracking-wider">{p.name}</h3>
                    {p.label ? <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{p.label}</span> : null}
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-black">{money(p.price_cents)}</div>
                    <div className="text-xs text-zinc-500 mt-1">Usable credits: <span className="text-zinc-200 font-semibold">{money(p.credits_cents)}</span></div>
                  </div>

                  {p.description ? <p className="text-sm text-zinc-400 mb-4">{p.description}</p> : null}

                  {p.features?.length ? (
                    <ul className="space-y-2 mb-6">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="w-4 h-4 text-indigo-400 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="h-6 mb-6" />
                  )}

                  <button
                    onClick={() => handleCheckout(p.id)}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Buy
                  </button>
                </div>
              ))}
            </div>

            {enableCustom && (
              <section className="mt-10 border border-zinc-800 bg-zinc-950/60 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-black uppercase tracking-wider">Custom Credits</h2>
                </div>
                <p className="text-sm text-zinc-400 mb-5">
                  Enter how many <b>credits ($)</b> you want to buy. Price is calculated automatically (adds 25% margin).
                </p>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 uppercase tracking-widest">Credits you want ($)</label>
                    <input
                      value={customCreditsDollars}
                      onChange={(e) => setCustomCreditsDollars(e.target.value)}
                      className="w-full mt-2 px-4 py-3 rounded-xl bg-black/40 border border-zinc-800 outline-none focus:border-indigo-500"
                      placeholder="50"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Estimated price</div>
                    <div className="mt-2 text-2xl font-black">
                      {(() => {
                        const dollars = parseFloat(customCreditsDollars);
                        if (!isFinite(dollars) || dollars <= 0) return '--';
                        const creditsCents = Math.round(dollars * 100);
                        const priceCents = Math.round(creditsCents / 0.75);
                        return money(priceCents);
                      })()}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Usable credits: {(() => {
                      const dollars = parseFloat(customCreditsDollars);
                      if (!isFinite(dollars) || dollars <= 0) return '--';
                      return money(Math.round(dollars * 100));
                    })()}</div>
                  </div>

                  <button
                    disabled={!customPlanId}
                    onClick={() => customPlanId && handleCheckout(customPlanId)}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 disabled:opacity-50"
                  >
                    Buy Custom
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
