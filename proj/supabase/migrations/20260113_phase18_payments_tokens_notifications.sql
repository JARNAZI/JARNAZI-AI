begin;

-- =========================
-- PHASE 18 SCHEMA ADDITIONS
-- Safe to run multiple times
-- =========================

create extension if not exists pgcrypto;

-- -------------------------
-- NOTIFICATIONS (if missing)
-- -------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin
on public.notifications
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.limit_notifications()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  delete from public.notifications
  where id in (
    select id
    from public.notifications
    where user_id = new.user_id
    order by created_at desc
    offset 10
  );

  return new;
end;
$$;

drop trigger if exists trg_limit_notifications on public.notifications;
create trigger trg_limit_notifications
after insert on public.notifications
for each row
execute function public.limit_notifications();

-- -------------------------
-- TOKEN LEDGER (audit)
-- -------------------------
create table if not exists public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta_tokens int not null,
  reason text not null, -- purchase | admin_grant | refund | consumption | adjustment
  reference text,      -- e.g. stripe_session_id / nowpayments_invoice_id / debate_id
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.token_ledger enable row level security;

drop policy if exists token_ledger_select_own on public.token_ledger;
create policy token_ledger_select_own
on public.token_ledger
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists token_ledger_insert_admin on public.token_ledger;
create policy token_ledger_insert_admin
on public.token_ledger
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- (optional) allow server-side insert via service role only by bypassing RLS

-- -------------------------
-- PAYMENT EVENTS (idempotency)
-- -------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null, -- stripe | nowpayments
  event_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  amount_cents int,
  tokens_added int,
  status text not null default 'received', -- received | processed | ignored | failed
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider, event_id)
);

create index if not exists idx_payment_events_user on public.payment_events(user_id);

alter table public.payment_events enable row level security;

drop policy if exists payment_events_admin_only on public.payment_events;
create policy payment_events_admin_only
on public.payment_events
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- -------------------------
-- PROFILES: prevent negative balances
-- -------------------------
alter table public.profiles
  add constraint if not exists token_balance_cents_nonnegative
  check (token_balance_cents >= 0);

commit;
