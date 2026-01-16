-- 2026-01-13: Central Model Registry (ai_models)
-- Run in Supabase SQL editor (or as migration).

create extension if not exists pgcrypto;

-- ai_models table
create table if not exists public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model_id text not null,
  capabilities jsonb not null default '{}'::jsonb,
  cost_profile jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  priority int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_models_provider_model_unique unique(provider, model_id)
);

-- updated_at trigger (requires public.set_updated_at from earlier migrations)
drop trigger if exists trg_ai_models_updated_at on public.ai_models;
create trigger trg_ai_models_updated_at
before update on public.ai_models
for each row execute function public.set_updated_at();

alter table public.ai_models enable row level security;

-- Admin-only policies (align with existing role system)
drop policy if exists ai_models_admin_only on public.ai_models;
create policy ai_models_admin_only
on public.ai_models
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
