# Environment Variables Configuration Template

Copy this template to create your `.env.local` file:

```bash
# App Configuration (Required for Production/Staging)
NEXT_PUBLIC_BASE_URL=https://your-site.com

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Provider API Keys (At least one required for debates)
OPENAI_API_KEY=sk-your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Security & Anti-Abuse (Required for Strict Mode)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_cloudflare_site_key
TURNSTILE_SECRET_KEY=your_cloudflare_secret_key
GOOGLE_SAFE_BROWSING_KEY=your_google_safe_browsing_key

# Payment Providers
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret

# Optional AI Providers
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_gemini_api_key_here
# System & Maintenance
CRON_SECRET=your_long_random_secret_string_here
```

**Note**: For production deployment, add these as Supabase Edge Function Secrets instead of using `.env.local`.
