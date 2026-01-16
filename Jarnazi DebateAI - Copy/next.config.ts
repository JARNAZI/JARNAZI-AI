import type { NextConfig } from "next";

// Note: Next.js no longer supports configuring ESLint via next.config.ts.
// Keep config minimal to avoid build-time warnings.

const nextConfig: NextConfig = {
  // output: 'standalone', // Disabled for Netlify
  env: {
    // Map system environment variables (Netlify) to Next.js public variables if missing
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    // Add explicitly requested keys
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || "0x4AAAAAACDeTKhm5oX2rrHw",
    NEXT_PUBLIC_STRIPE_PUBLISH_LIVE_KEY: "pk_live_51L3l70EDEtTbVCkrIqel9bSD0e650qloy9VwoJ8aIKoLWuIUekW1qAIDBhCvDqk3oacJH9mDpYAx2SaCsJPJMv7I00zw4KDdLH",
    NEXT_PUBLIC_STRIPE_TEST_PUBLISH_KEY: "pk_test_51SYRTGE6YiV8Fi8aj2mlwUm4jiM8zCnVyKSoJz69DzDUg3qeFNuJnOIF2MnaNQgyOhi6XFHldvMjRj9j8VYxZIUy00EJrOqjqz",
  },
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
};

export default nextConfig;
