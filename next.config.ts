import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Optimized for Docker/Cloud Run

  // Netlify/CI builds can fail on non-critical lint warnings.
  // Keep lint available via `npm run lint`, but don't block production builds.
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  env: {
    // Expose Supabase vars that lost NEXT_PUBLIC_ prefix but are needed on client
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY,
  },
};

export default nextConfig;
