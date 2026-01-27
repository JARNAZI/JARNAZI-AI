import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/settings';

export const runtime = 'nodejs';

export async function GET() {
  const admin = getAdminClient();
  const { data, error } = await admin.from('settings').select('key,value').in('key', [
    'token_plans',
    'enable_custom_tokens',
    'enable_stripe',
    'enable_nowpayments',
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
    enable_stripe: out.enable_stripe ?? true,
    enable_nowpayments: out.enable_nowpayments ?? false,
    pricing_header_title: out.pricing_header_title ?? null,
    pricing_header_subtitle: out.pricing_header_subtitle ?? null,
    token_profit_margin: out.token_profit_margin ?? 0.25,
  });
}
