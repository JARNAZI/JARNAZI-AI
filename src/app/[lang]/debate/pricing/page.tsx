"use client";
import React, { useEffect, useMemo, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const use = (React as any).use || ((p: any) => p);
import { Check, Zap, Crown, Shield, CreditCard, Coins } from "lucide-react";
import PurchaseButton from "@/components/PurchaseButton";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/i18n/use-dictionary";
import { amountToTokens, MIN_PURCHASE_AMOUNT_USD } from "@/lib/tokens";

export default function PricingPage(props: { params: Promise<{ lang: string }> }) {
  const params = use(props.params);
  const dict = useDictionary(params.lang);
  const t = dict.pricingPage;

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // token balance is stored as integer tokens in token_balance_cents (legacy name)
        const { data } = await supabase
          .from("profiles")
          .select("token_balance_cents")
          .eq("id", user.id)
          .single();
        if (data) setBalance((data as any).token_balance_cents ?? 0);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  const plans = [
    { id: "starter", amountUsd: 14, name: t.plans.starter.name, description: t.plans.starter.description, icon: <Zap className="w-6 h-6 text-emerald-400" />, features: t.plans.starter.features, highlight: false },
    { id: "producer", amountUsd: 50, name: t.plans.producer.name, description: t.plans.producer.description, icon: <Crown className="w-6 h-6 text-amber-400" />, features: t.plans.producer.features, highlight: true, label: t.mostPopular },
    { id: "creator", amountUsd: 330, name: t.plans.creator.name, description: t.plans.creator.description, icon: <Shield className="w-6 h-6 text-purple-400" />, features: t.plans.creator.features, highlight: false },
  ].map(p => ({ ...p, tokens: amountToTokens(p.amountUsd) }));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-20 px-4">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl text-center mb-16 relative z-10">
        <h1 className="text-5xl font-bold text-foreground mb-6 tracking-tight">
          {t.investIn}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
            {t.intelligence}
          </span>
        </h1>

        {!loading && balance !== null && (
          <div className="mx-auto max-w-2xl bg-card/60 border border-border rounded-2xl p-6 mb-8 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-indigo-500/20 rounded-full">
                <CreditCard className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {t.currentPlan}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {t.tokensLabel}
                </p>
              </div>
            </div>

            <div className="h-px sm:h-12 w-full sm:w-px bg-border" />

            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <Coins className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {t.availableBalance}
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {Number(balance).toLocaleString()} {t.tokensLabel}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xl text-muted-foreground leading-relaxed">
          {t.descriptionLine1} <br />
          <span className="text-foreground font-semibold">{t.tokensNeverExpire}</span>{" "}
          {t.descriptionLine2}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl relative z-10">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 flex flex-col
              ${plan.highlight ? "bg-primary/10 border-primary/30 shadow-2xl shadow-primary/10" : "bg-card/60 border-border hover:border-border/80"}`}
          >
            {plan.highlight && plan.label && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                {plan.label}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${plan.highlight ? "bg-primary/20" : "bg-muted"}`}>
                {plan.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">${plan.amountUsd}</span>
                <span className="text-muted-foreground">{t.perPack}</span>
              </div>
              <div className="mt-2 inline-block px-3 py-1 rounded bg-card/60 border border-border text-emerald-400 text-sm font-medium">
                {plan.tokens} {t.tokensLabel}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {(t.minimumPurchase ?? `Minimum purchase is $${MIN_PURCHASE_AMOUNT_USD}.`).replace('${min}', String(MIN_PURCHASE_AMOUNT_USD))}
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((f: string) => (
                <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <PurchaseButton
              amountUsd={plan.amountUsd}
              label={t.buyNow ?? "Buy now"}
              isHighlight={plan.highlight}
              lang={params.lang}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

