import 'server-only';
import { getAdminClient } from '@/lib/settings';

export type TokenPlan = {
  id: string;
  name: string;
  price_cents: number;
  currency?: string;
  credits_cents: number; // user's usable balance (USD cents)
  description?: string;
  features?: string[];
  highlight?: boolean;
  label?: string;
  active?: boolean;
};

const DEFAULT_PLANS: TokenPlan[] = [
  { id: 'plan_1', name: 'Plan 1', price_cents: 33000, credits_cents: Math.round(33000 * 0.75), currency: 'usd', description: 'Token plan' },
  { id: 'plan_2', name: 'Plan 2', price_cents: 15000, credits_cents: Math.round(15000 * 0.75), currency: 'usd', description: 'Token plan' },
  { id: 'plan_3', name: 'Plan 3', price_cents: 5000, credits_cents: Math.round(5000 * 0.75), currency: 'usd', description: 'Token plan' },
];

export async function getTokenPlans(): Promise<TokenPlan[]> {
  const admin = getAdminClient();
  const { data, error } = await admin.from('settings').select('value').eq('key', 'token_plans').maybeSingle();
  if (error || !data?.value) return DEFAULT_PLANS;
  try {
    const plans = Array.isArray(data.value) ? data.value : JSON.parse(data.value);
    return (plans as any[]).map((p) => ({
      id: String(p.id),
      name: String(p.name ?? 'Plan'),
      price_cents: Number(p.price_cents ?? p.price ?? 0),
      credits_cents: Number(p.credits_cents ?? Math.round(Number(p.price_cents ?? p.price ?? 0) * 0.75)),
      currency: String(p.currency ?? 'usd'),
      description: p.description ?? '',
      features: Array.isArray(p.features) ? p.features : [],
      highlight: !!p.highlight,
      label: p.label ?? '',
      active: p.active !== false,
    })).filter(p => p.price_cents > 0 && p.active);
  } catch {
    return DEFAULT_PLANS;
  }
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
      active: true,
    };
  }

  return plans.find(p => p.id === planId);
}
