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
    // Expose Supabase vars to the client
    // Next.js normally does this automatically with NEXT_PUBLIC_ prefix,
    // but in Docker/Cloud Run, we sometimes need explicit mapping here if they aren't available at build-time
    // but are passed at runtime (though Next.js usually requires them at build time for client exposure).
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY,
  },
};

export default nextConfig;
