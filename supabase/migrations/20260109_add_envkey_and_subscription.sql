-- 2026-01-09: Add provider env key + subscription tier + credit semantics
-- Run this in Supabase SQL editor.

-- 1) ai_providers: store which Edge Function secret holds the API key (or JSON credential)
alter table public.ai_providers
  add column if not exists env_key text;

comment on column public.ai_providers.env_key is 'Name of the Supabase Edge Function secret (Deno env var) that contains the provider credential';

-- 2) profiles: subscription tier (optional) + treat token_balance as USD cents of RESOURCE CREDIT (75% of plan price)
alter table public.profiles
  add column if not exists subscription_tier text default 'free';

comment on column public.profiles.token_balance is 'Resource credits in USD cents. When a user pays $P, they receive floor(P*0.75*100) credits; the remaining 25% is margin. Each provider call deducts estimated provider COST (not including margin).';

-- 3) helpful view for admin (optional)
create or replace view public.user_credits as
select id as user_id, email, role, subscription_tier, token_balance as credit_cents, (token_balance/100.0) as credit_usd
from public.profiles;

