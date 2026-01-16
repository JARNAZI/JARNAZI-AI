"use client";
import {useState, useEffect, use, useMemo} from 'react';
import { Check, Zap, Crown, Shield, CreditCard, Coins } from 'lucide-react';
import PurchaseButton from '@/components/PurchaseButton';
import { createClient } from '@/lib/supabase/client';

export default function PricingPage(props: { params: Promise<{ lang: string }> }) {
    const params = use(props.params);
    const [customTokens, setCustomTokens] = useState<number>(5000);
    const [subscription, setSubscription] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = useMemo(() => createClient(), []);

    const pricePerToken = 0.30;
    const customPrice = (customTokens * pricePerToken).toFixed(2);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('subscription_tier, token_balance').eq('id', user.id).single();
                if (data) {
                    setSubscription(data.subscription_tier || 'Free');
                    setBalance(data.token_balance || 0);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [supabase]);

    const plans = [
        {
            id: 'starter',
            name: 'Starter Pack',
            price: '$14',
            tokens: 42,
            description: 'Perfect for casual debates and occasional queries.',
            icon: <Zap className="w-6 h-6 text-emerald-400" />,
            features: [
                '42 Consensus Tokens',
                'Access to GPT-4o & Claude 3',
                'Basic Image Generation',
                'Tokens Never Expire',
                'Email Summaries'
            ],
            highlight: false
        },
        {
            id: 'producer',
            name: 'Producer Plan',
            price: '$50',
            tokens: 155,
            description: 'For power users requiring frequent AI collaboration.',
            icon: <Crown className="w-6 h-6 text-amber-400" />,
            features: [
                '155 Consensus Tokens',
                'Access to All Neural Nodes',
                'High-Res Image Generation',
                'Priority Processing',
                'Tokens Never Expire'
            ],
            highlight: true,
            label: 'Most Popular'
        },
        {
            id: 'creator',
            name: 'Pro Creator',
            price: '$330',
            tokens: 1050,
            description: 'Ultimate toolkit for professional content generation.',
            icon: <Shield className="w-6 h-6 text-purple-400" />,
            features: [
                '1050 Consensus Tokens',
                'Top-Tier Priority Access (Tier 1)',
                '4K Video Generation',
                'Dedicated Support Channel',
                'Commercial Usage Rights',
                'Tokens Never Expire'
            ],
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-20 px-4">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-3xl text-center mb-16 relative z-10">
                <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
                    Invest in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Intelligence</span>
                </h1>

                {/* Subscription Status Panel */}
                {!loading && subscription && (
                    <div className="mx-auto max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                        <div className="flex items-center gap-4 text-left">
                            <div className="p-3 bg-indigo-500/20 rounded-full">
                                <CreditCard className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Plan</p>
                                <p className="text-xl font-bold text-white">{subscription} Plan</p>
                            </div>
                        </div>

                        <div className="h-px sm:h-12 w-full sm:w-px bg-white/10" />

                        <div className="flex items-center gap-4 text-left">
                            <div className="p-3 bg-emerald-500/20 rounded-full">
                                <Coins className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Available Balance</p>
                                <p className="text-xl font-bold text-emerald-400">{balance?.toLocaleString()} Tokens</p>
                            </div>
                        </div>

                        <div className="h-px sm:h-12 w-full sm:w-px bg-white/10 sm:hidden" />
                    </div>
                )}

                <p className="text-xl text-muted-foreground/80 leading-relaxed">
                    Purchase tokens to fuel your AI debates and content generation. <br />
                    <span className="text-white font-semibold">Tokens never expire</span> and can be topped up instantly.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl relative z-10">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 flex flex-col
                            ${plan.highlight
                                ? 'bg-indigo-950/30 border-indigo-500/50 shadow-2xl shadow-indigo-500/20'
                                : 'glass-card border-white/5 hover:border-white/10'
                            }`}
                    >
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                {plan.label}
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-xl ${plan.highlight ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                {plan.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                <p className="text-xs text-muted-foreground">{plan.description}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-muted-foreground">/ pack</span>
                            </div>
                            <div className="mt-2 inline-block px-3 py-1 rounded bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium">
                                {plan.tokens} Tokens
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map(f => (
                                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                                    <Check className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-emerald-500/70'}`} />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>

                        <PurchaseButton
                            planId={plan.id}
                            planName={plan.name}
                            isHighlight={plan.highlight}
                            lang={params.lang}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-20 p-8 rounded-3xl glass-card border border-white/5 max-w-4xl w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Enterprise Solution</h3>
                        <p className="text-muted-foreground mb-4">Purchase a custom amount of tokens for your organization.</p>

                        <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
                            <div className="flex flex-col px-2">
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Token Amount</label>
                                <input
                                    type="number"
                                    min="1000"
                                    step="100"
                                    value={customTokens}
                                    onChange={(e) => setCustomTokens(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="bg-transparent border-none text-white font-mono text-xl focus:ring-0 p-0 w-32 outline-none"
                                />
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex flex-col px-2 text-right">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Price</span>
                                <span className="text-xl font-bold text-emerald-400">${customPrice}</span>
                            </div>
                        </div>
                    </div>

                    <PurchaseButton
                        planId={`custom_${customTokens}`}
                        planName={`Enterprise Custom (${customTokens} Tokens)`}
                        isHighlight={true}
                        lang={params.lang}
                    />
                </div>
            </div>
        </div>
    );
}
