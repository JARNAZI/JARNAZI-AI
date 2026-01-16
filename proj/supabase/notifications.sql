begin;

create extension if not exists pgcrypto;

-- Notifications (Phase 10)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  type text not null default 'info',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- Inserts are server-side (service role) OR client for own user
drop policy if exists notifications_insert_own on public.notifications;
create policy notifications_insert_own
  on public.notifications for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

commit;
