FROM node:22-slim AS base

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args to allow public env vars to be baked in
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY
ENV NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY=$NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY

ARG SUPABASE_URL
ENV SUPABASE_URL=$SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL

ARG SUPABASE_ANON_KEY
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Build the app
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run sets PORT, but we set a default
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# You only need to copy next.config.ts if you are NOT using "output: standalone"
# But we are using standalone, so we copy the standalone output.

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port
EXPOSE 8080

# Run the standalone server
CMD ["node", "server.js"]
