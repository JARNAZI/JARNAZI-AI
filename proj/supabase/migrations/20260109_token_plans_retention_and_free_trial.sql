-- Settings + token plans + free trial defaults
-- Safe to run multiple times.

create table if not exists public.settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

create or replace function public.update_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute procedure public.update_settings_updated_at();

-- Profiles additions
alter table if exists public.profiles
  add column if not exists token_balance bigint default 0,
  add column if not exists subscription_tier text,
  add column if not exists free_trial_used boolean default false;

-- Default settings
insert into public.settings (key, value) values
('enable_free_trial', 'true'::jsonb),
('free_trial_credits_cents', '100'::jsonb),
('enable_custom_tokens', 'true'::jsonb),
('token_profit_margin', '0.25'::jsonb),
('cost_rates', '{"text":10,"image":200,"video":1000,"audio":150,"file":50}'::jsonb),
('token_plans', '[
  {"id":"plan_1","name":"Plan 1","price_cents":33000,"credits_cents":24750,"description":"Best value","features":["Text debates","Images","Video"],"highlight":true,"label":"Popular","active":true},
  {"id":"plan_2","name":"Plan 2","price_cents":15000,"credits_cents":11250,"description":"Balanced","features":["Text debates","Images"],"highlight":false,"active":true},
  {"id":"plan_3","name":"Plan 3","price_cents":5000,"credits_cents":3750,"description":"Starter","features":["Text debates"],"highlight":false,"active":true}
]'::jsonb)
on conflict (key) do nothing;

