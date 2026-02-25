# Jarnazi AI Consensus (Vercel Fixed) Through Intelligence

This is an **Advanced Multi-Agent Debate Platform** where AI agents compete to find the truth, powered by a "Consensus Engine" that synthesizes divergent viewpoints.

## 🚀 Deployment Checklist

### 1. Environment Secrets (Supabase Edge Functions)
The following keys **MUST** be set in your Supabase Dashboard or Edge Functions secrets (`supabase secrets set ...`). **DO NOT** commit them to Git.

- `OPENAI_API_KEY`: Mandatory for Orchestrator.
- `RESEND_API_KEY`: Mandatory for Emails.
- `STRIPE_SECRET_KEY` / `NOWPAYMENTS_API_KEY`: Mandatory for Payments.
- `VERTEX_PRIVATE_KEY` / `VERTEX_CLIENT_EMAIL`: Mandatory for Google Enterprise AI.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: Auto-set by Supabase, but verify.

### 2. Database Migration
Run the following to set up the `debates`, `profiles`, and `ai_providers` tables:
```bash
supabase db push
```

### 3. Deploy Edge Functions
Deploy the remaining backend services (Email, Payment, and Vertex connectors):
```bash
# Note: AI Orchestration is now handled centrally by the Next.js API Layer (src/lib/orchestrator.ts)
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy handle-payment --no-verify-jwt
supabase functions deploy vertex-connector --no-verify-jwt
```
*Note: `--no-verify-jwt` is used for internal service-to-service calls. For debate orchestration, the system now uses a high-performance Maestro class in the Next.js environment.*

### 4. Deploy Frontend (Vercel)
1. Push this repo to GitHub.
2. Import project into Vercel.
3. Add Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 🛠 Features
- **Multi-Agent Debate**: Arbitrated by a central AI Council.
- **Multilingual**: Supports 9 languages (En, Es, Fr, De, It, Pt, Ja, Sv, Ar).
- **Rich Media**: Text, Audio, Video, Image inputs.
- **Math Mode**: LaTeX input/output enforcement used in scientific debates.
- **Monetization**: Tiered plans (Observer, Architect, Sovereign) integrated with Stripe.

## 🔒 Security
- **RLS**: Row-Level Security on all database tables.
- **Edge Secrets**: All sensitive API keys are stored in the secure backend environment, never exposed to the client.
- **Audit Logs**: All debate actions are logged.

## Phase 18 – Supabase SQL to run
After updating to the latest sprint ZIP, run the migration SQL below in Supabase SQL Editor **only if you don't use Supabase CLI migrations**:
- `supabase/migrations/20260113_phase18_payments_tokens_notifications.sql`

This adds/ensures:
- `notifications` (if missing) + RLS + max 10 per user
- `token_ledger` (audit log)
- `payment_events` (Stripe/NowPayments idempotency)
- Non-negative constraint for `profiles.token_balance_cents`
