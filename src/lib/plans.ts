import 'server-only';
import { getAdminClient } from '@/lib/settings';

export type TokenPlan = {
  id: string;
  name: string;
  price_cents: number;
  credits_cents: number; // user's usable balance (USD cents)
  currency: string;
  description: string;
  features: string[];
  highlight: boolean;
  label: string;
  active: boolean;
};

const DEFAULT_PLANS: TokenPlan[] = [
  { id: 'plan_1', name: 'Plan 1', price_cents: 33000, credits_cents: Math.round(33000 * 0.75), currency: 'usd', description: 'Token plan', features: [], highlight: false, label: '', active: true },
  { id: 'plan_2', name: 'Plan 2', price_cents: 15000, credits_cents: Math.round(15000 * 0.75), currency: 'usd', description: 'Token plan', features: [], highlight: false, label: '', active: true },
  { id: 'plan_3', name: 'Plan 3', price_cents: 5000, credits_cents: Math.round(5000 * 0.75), currency: 'usd', description: 'Token plan', features: [], highlight: false, label: '', active: true },
];

export async function getTokenPlans(): Promise<TokenPlan[]> {
  const admin = getAdminClient();
  const { data, error } = await admin.from('token_plans').select('*').eq('active', true).order('price_cents', { ascending: true });

  if (error || !data) return DEFAULT_PLANS;

  return data.map((p) => ({
    id: p.id,
    name: p.name ?? 'Plan',
    price_cents: p.price_cents ?? 0,
    credits_cents: p.credits_cents ?? 0,
    currency: 'usd', // Default as not in DB
    description: '', // Default as not in DB
    features: [], // Default as not in DB
    highlight: false,
    label: '',
    active: p.active !== false,
  })).filter(p => p.price_cents > 0);
}

export async function getPlan(planId: string): Promise<TokenPlan | undefined> {
  const plans = await getTokenPlans();

  if (planId.startsWith('custom_')) {
    const creditsCents = parseInt(planId.split('_')[1]); // credits in cents
    if (isNaN(creditsCents) || creditsCents < 100) return undefined;
    // price is credits / 0.75 (rounded)
    const priceCents = Math.round(creditsCents / 0.75);
    return {
      id: planId,
      name: `Custom Credits ($${(creditsCents / 100).toFixed(2)})`,
      price_cents: priceCents,
      credits_cents: creditsCents,
      currency: 'usd',
      description: 'Custom credits purchase',
      features: [],
      highlight: false,
      label: 'Custom',
      active: true,
    };
  }

  return plans.find(p => p.id === planId);
}
