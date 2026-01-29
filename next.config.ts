import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Optimized for Docker/Cloud Run

  // Netlify/CI builds can fail on non-critical lint warnings.
  // Keep lint available via `npm run lint`, but don't block production builds.
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
};

export default nextConfig;
