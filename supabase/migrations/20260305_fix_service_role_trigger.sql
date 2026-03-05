
-- Fix for Service Role bypass in profile protection trigger
-- This allows backend webhooks (using Service Role) to update user balances.

create or replace function public.protect_profile_fields()
returns trigger as $$
begin
  -- Allow if current user is admin OR if it's the service role
  if not (public.is_admin(auth.uid()) or auth.role() = 'service_role') then
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
