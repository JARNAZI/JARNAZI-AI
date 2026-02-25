-- Atomic token balance helpers (reserve/refund)
-- These functions prevent race conditions when multiple requests adjust token balances concurrently.
-- Uses a single UPDATE with a guard to ensure balances never go negative.

create or replace function public.reserve_tokens(p_user_id uuid, p_tokens integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_balance integer;
begin
  if p_tokens is null or p_tokens <= 0 then
    raise exception 'INVALID_TOKEN_AMOUNT';
  end if;

  update public.profiles
  set token_balance_cents = coalesce(token_balance_cents, 0) - p_tokens
  where id = p_user_id
    and coalesce(token_balance_cents, 0) >= p_tokens
  returning token_balance_cents into new_balance;

  if new_balance is null then
    raise exception 'INSUFFICIENT_TOKENS';
  end if;

  return new_balance;
end;
$$;

create or replace function public.refund_tokens(p_user_id uuid, p_tokens integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_balance integer;
begin
  if p_tokens is null or p_tokens <= 0 then
    raise exception 'INVALID_TOKEN_AMOUNT';
  end if;

  update public.profiles
  set token_balance_cents = coalesce(token_balance_cents, 0) + p_tokens
  where id = p_user_id
  returning token_balance_cents into new_balance;

  if new_balance is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  return new_balance;
end;
$$;
