'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Zap, CreditCard, ArrowLeft, Loader2, ShieldCheck, BarChart3, Clock, TrendingUp } from 'lucide-react';

export default function UsageClient({ dict, lang, supabaseUrl, supabaseAnonKey }: { dict: any; lang: string; supabaseUrl?: string; supabaseAnonKey?: string }) {
  const d = dict?.dashboard || {};
  const router = useRouter();
  const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${lang}/login`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('token_balance_cents, subscription_tier, created_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfile(profile);
      }
      setLoading(false);
    };
    fetchUsage();
  }, [supabase, router, lang]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const tier = profile?.subscription_tier?.toUpperCase() || 'FREE';
  const tokens = profile?.token_balance_cents || 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-4xl mx-auto text-left">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">{d.backToConsole || "Back to Console"}</span>
        </button>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
              {d.usageTitle || "Tokens"}
            </span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.3em]">
            {d.resourceAllocation || "Resource allocation"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Token Balance Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-card to-background border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10">
              <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-primary" /> {d.currentLiquidity || "Current Liquidity"}
              </h3>
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-6xl md:text-8xl font-black tracking-tighter">{tokens.toLocaleString()}</span>
                <span className="text-primary font-bold uppercase tracking-widest text-sm">
                  {d.usageTitle || "Tokens"}
                </span>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-8">
                {d.availableForCouncil || "Available for council deliberations"}
              </p>

              <button
                onClick={() => router.push(`/${lang}/buy-tokens`)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl"
              >
                <CreditCard className="w-3.5 h-3.5" /> {d.reloadCredits || "Reload Credits"}
              </button>
            </div>
          </div>

          {/* Tier Card */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                {d.accessLevel || "Access Level"}
              </h3>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-primary font-black tracking-widest text-xs">
                  {tier === 'FREE' ? (d.trialPlan || 'TRIAL') : tier}
                </span>
              </div>
              <p className="text-foreground font-bold text-lg leading-tight uppercase tracking-tight">
                {tier === 'FREE' ? (d.trialPlan || 'Initiate Tier') : (d.proPlan || 'Pro Council Member')}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                {tier === 'FREE' ? (d.trialModeDesc || 'Trial Mode: 1 Question') : (d.fullAccessDesc || 'Full Council Access')}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12">
          <div className="flex items-center gap-3 mb-10">
            <BarChart3 className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-black uppercase tracking-[0.1em]">{d.usageParameters || "Usage Parameters"}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-muted-foreground">
            <div className="space-y-4">
              <div className="flex justify-between items-end pb-2 border-b border-border">
                <span className="text-[10px] font-black uppercase tracking-widest">{d.rateLimitGlobal || "Rate Limit (Global)"}</span>
                <span className="text-foreground font-bold text-xs">{d.dynamicAllocation || "Dynamic Allocation"}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/70">
                {d.rateLimitDesc || "Global orchestration limits are adjusted based on real-time compute availability."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end pb-2 border-b border-border">
                <span className="text-[10px] font-black uppercase tracking-widest">{d.concurrentDebates || "Concurrent Debates"}</span>
                <span className="text-foreground font-bold text-xs">{tier === 'FREE' ? `3 ${d.active || 'ACTIVE'}` : (d.unlimited || 'UNLIMITED')}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/70">
                {d.concurrentDesc || "Number of deliberative sessions running simultaneously in the council."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end pb-2 border-b border-border">
                <span className="text-[10px] font-black uppercase tracking-widest">{d.modelAccess || "Model Access"}</span>
                <span className="text-foreground font-bold text-xs">{tier === 'FREE' ? '1 QUESTION' : (d.allSupremeModels || 'ALL SUPREME MODELS')}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/70">
                {tier === 'FREE' ? (d.purchaseTokensToUnlock || 'Purchase tokens to unlock this feature.') : (d.modelAccessDesc || 'Availability of high-parameter models for complex consensus building.')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end pb-2 border-b border-border">
                <span className="text-[10px] font-black uppercase tracking-widest">{d.dataRetention || "Data Retention"}</span>
                <span className="text-foreground font-bold text-xs">{tier === 'FREE' ? `3 ${d.days || 'DAYS'}` : (d.perpetual || 'PERPETUAL')}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/70">
                {d.retentionDesc || "Duration for which your deliberative insights are archived on the ledger."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            {d.nextBudgetRefresh || "Next budget refresh"}: {d.automatic || "Automatic"}
          </p>
        </div>
      </div>
    </div>
  );
}
