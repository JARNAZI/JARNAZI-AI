---
description: Deploy Environment Keys to Supabase Edge Functions
---

# Sync Keys to Supabase
This workflow syncs your local `.env.local` keys to Supabase Edge Function Secrets.

1. **Install Supabase CLI** (if not installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   npx supabase login
   ```

3. **Set Secrets**
   Run the following command to push all critical AI keys:

   ```powershell
   # PowerShell
   npx supabase secrets set --env-file .env.local
   ```

   *Note: Ensure your `.env.local` contains all the keys first:*
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `NOWPAYMENTS_IPN_SECRET`

// turbo
4. **Verify Secrets**
   ```bash
   npx supabase secrets list
   ```
