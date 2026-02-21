-- ==========================================
-- 2026-02-21: RLS Hardening & Admin Security
-- ==========================================

-- 1. Ensure is_admin and is_support functions exist
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_support(uid uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role in ('admin', 'super_admin', 'support')
  );
$$;

-- 2. HARDEN: public.profiles
-- User can see their own, Admin sees all
-- Ensure both column names exist for compatibility between different modules
alter table public.profiles add column if not exists token_balance_cents integer default 0;
update public.profiles set token_balance_cents = token_balance where token_balance_cents = 0 and token_balance > 0;
update public.profiles set token_balance = token_balance_cents where token_balance = 0 and token_balance_cents > 0;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Profiles select policy"
on public.profiles for select
to authenticated
using (auth.uid() = id or public.is_admin(auth.uid()));

-- Prevent user from changing their own role via client-side update
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Profiles update policy"
on public.profiles for update
to authenticated
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

-- Trigger to prevent role/balance manipulation via client
create or replace function public.protect_profile_fields()
returns trigger as $$
begin
  if not public.is_admin(auth.uid()) then
    if (new.role is distinct from old.role) 
       or (new.token_balance is distinct from old.token_balance)
       or (new.token_balance_cents is distinct from old.token_balance_cents) 
    then
      raise exception 'Unauthorized: Cannot modify role or balance directly.';
    end if;
  end if;
  
  -- Keep columns in sync if one is updated by admin/system
  if (new.token_balance is distinct from old.token_balance) then
    new.token_balance_cents = new.token_balance;
  elsif (new.token_balance_cents is distinct from old.token_balance_cents) then
    new.token_balance = new.token_balance_cents;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_protect_profile_fields on public.profiles;
create trigger trg_protect_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_fields();

-- 3. HARDEN: public.debates
-- User can see/manage their own. Admin sees all.
alter table public.debates enable row level security;
drop policy if exists "Debates select own" on public.debates;
create policy "Debates select policy"
on public.debates for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Debates insert own" on public.debates;
create policy "Debates insert policy"
on public.debates for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Debates delete own" on public.debates;
create policy "Debates delete policy"
on public.debates for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- 4. HARDEN: public.debate_turns
alter table public.debate_turns enable row level security;
drop policy if exists "Turns select own" on public.debate_turns;
create policy "Turns select policy"
on public.debate_turns for select
to authenticated
using (
  exists (
    select 1 from public.debates
    where debates.id = debate_turns.debate_id
    and (debates.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

-- 5. HARDEN: public.generated_media
alter table public.generated_media enable row level security;
drop policy if exists "Media select own" on public.generated_media;
create policy "Media select policy"
on public.generated_media for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- 6. AI Providers (Admin management hardening)
drop policy if exists "Providers admin management" on public.ai_providers;
create policy "Providers admin management"
on public.ai_providers for all
to authenticated
using (public.is_admin(auth.uid()));
