-- Transactions / Ledger Table (if not exists)
-- This tracks detailed token history visible to the user
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  amount integer not null, -- Can be 0 if just a grant, or price in USD
  currency text default 'USD',
  tokens_granted integer default 0,
  type text default 'purchase', -- 'purchase', 'grant', 'usage'
  provider text, -- 'stripe', 'admin', 'system'
  status text default 'completed',
  reason text, -- "Loyalty Reward", "Compensation"
  external_id text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audit Logs (Enhance existing or create)
-- Already exists in schema.sql but let's ensure we can use it
comment on table public.audit_logs is 'Admin actions audit trail';

-- RLS
alter table public.transactions enable row level security;

create policy "Users manage own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Admins view all transactions"
  on public.transactions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );

-- Function to safely grant tokens with audit
create or replace function public.admin_grant_tokens(
  target_user_id uuid,
  token_amount integer,
  grant_reason text,
  admin_id uuid
) returns void as $$
declare
  old_balance integer;
  new_balance integer;
begin
  -- 1. Check if executor is super_admin (Enforced at app level, but safe to check here if passed correctly)
  -- Simplified: We assume app-level check for this function or trusted service role use.
  
  -- 2. Update Balance
  select token_balance into old_balance from public.profiles where id = target_user_id;
  update public.profiles set token_balance = coalesce(token_balance, 0) + token_amount where id = target_user_id;
  
  -- 3. Log Transaction (User View)
  insert into public.transactions (user_id, amount, tokens_granted, type, provider, status, reason)
  values (target_user_id, 0, token_amount, 'grant', 'admin', 'completed', grant_reason);

  -- 4. Log Audit (Admin View)
  insert into public.audit_logs (action, user_id, performed_by_admin_id, details)
  values (
    'grant_tokens',
    target_user_id,
    admin_id,
    jsonb_build_object(
      'amount', token_amount,
      'reason', grant_reason,
      'old_balance', old_balance,
      'new_balance', coalesce(old_balance, 0) + token_amount
    )
  );
end;
$$ language plpgsql security definer;
