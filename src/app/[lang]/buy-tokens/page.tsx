import { getDictionary } from '@/i18n/get-dictionary';
import BuyTokensClient from "./BuyTokensClient";
import { createServiceRoleClient } from '@/lib/supabase/server-admin';
import { getAllRobustSettings } from '@/lib/settings-robust';

export default async function Page(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  // Fetch Payment Toggles securely on the server via Admin client
  const adminClient = await createServiceRoleClient();
  const settings = await getAllRobustSettings(adminClient, [
    'gateway_stripe_enabled', 'payments_stripe_enabled',
    'gateway_nowpayments_enabled', 'payments_nowpayments_enabled',
    'stripe_test_mode'
  ]);

  const stripeEnabled = String(settings['gateway_stripe_enabled'] ?? settings['payments_stripe_enabled']) === 'true';
  const nowpaymentsEnabled = String(settings['gateway_nowpayments_enabled'] ?? settings['payments_nowpayments_enabled']) === 'true';
  const stripeTestMode = String(settings['stripe_test_mode']) === 'true';

  return (
    <BuyTokensClient
      lang={lang}
      dict={dict}
      supabaseUrl={supabaseUrl}
      supabaseAnonKey={supabaseAnonKey}
      serverStripeEnabled={stripeEnabled}
      serverNowpaymentsEnabled={nowpaymentsEnabled}
      serverStripeTestMode={stripeTestMode}
    />
  );
}
