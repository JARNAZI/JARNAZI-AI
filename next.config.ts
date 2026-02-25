import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Optimized for Docker/Cloud Run

  // Netlify/CI builds can fail on non-critical lint warnings.
  // Keep lint available via `npm run lint`, but don't block production builds.
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],

  // Add cache-control headers to prevent stale assets
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
