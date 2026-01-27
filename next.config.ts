import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // Disabled for Netlify

  // Netlify/CI builds can fail on non-critical lint warnings.
  // Keep lint available via `npm run lint`, but don't block production builds.
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  env: {
    // Supabase public vars
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "",

    // App URL
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",

    // Stripe publishable keys (public)
    NEXT_PUBLIC_STRIPE_PUBLISH_LIVE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISH_LIVE_KEY ||
      process.env.Next_public_Stripe_publish_live_key ||
      "",
    NEXT_PUBLIC_STRIPE_TEST_PUBLISH_KEY:
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISH_KEY ||
      process.env.Next_public_Stripe_test_publish_key ||
      "",

    // Cloudflare Turnstile (public)
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      process.env.Next_public_cloudflare_turnstile_api_site_key ||
      "",
  },

  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
};

export default nextConfig;
