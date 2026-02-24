import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/settings';

export const runtime = 'nodejs';

export async function GET() {
  const admin = getAdminClient();
  const { data, error } = await admin.from('site_settings').select('key,value').in('key', [
    'token_plans',
    'enable_custom_tokens',
    'gateway_stripe_enabled',
    'gateway_nowpayments_enabled',
    'pricing_header_title',
    'pricing_header_subtitle',
    'token_profit_margin',
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const out: Record<string, unknown> = {};
  for (const r of data || []) out[r.key] = r.value;

  return NextResponse.json({
    token_plans: out.token_plans || [],
    enable_custom_tokens: out.enable_custom_tokens ?? true,
    enable_stripe: String(out.gateway_stripe_enabled) === 'true',
    enable_nowpayments: String(out.gateway_nowpayments_enabled) === 'true',
    pricing_header_title: out.pricing_header_title ?? null,
    pricing_header_subtitle: out.pricing_header_subtitle ?? null,
    token_profit_margin: out.token_profit_margin ?? 0.25,
  });
}
