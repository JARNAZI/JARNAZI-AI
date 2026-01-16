-- Support staff: limited admin role for replying to Contact messages only.
--
-- Assumes:
--   - public.profiles.role is TEXT
--   - public.contact_messages exists

begin;

-- Helper: support check (admin/super_admin/support)
create or replace function public.is_support(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role in ('admin', 'super_admin', 'support')
  );
$$;

-- Expand contact_messages policies to include support
alter table public.contact_messages enable row level security;

drop policy if exists contact_select_admin_or_owner on public.contact_messages;
create policy contact_select_admin_or_owner
on public.contact_messages
for select
to authenticated
using (public.is_support(auth.uid()) or user_id = auth.uid());

drop policy if exists contact_update_admin on public.contact_messages;
create policy contact_update_admin
on public.contact_messages
for update
to authenticated
using (public.is_support(auth.uid()))
with check (public.is_support(auth.uid()));

-- Keep deletes admin-only
drop policy if exists contact_delete_admin on public.contact_messages;
create policy contact_delete_admin
on public.contact_messages
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Guardrail: support can only change reply/status fields
create or replace function public.enforce_support_contact_update()
returns trigger
language plpgsql
as $$
declare
  r text;
begin
  select p.role into r from public.profiles p where p.id = auth.uid();

  if r = 'support' and not public.is_admin(auth.uid()) then
    if (new.user_id is distinct from old.user_id)
      or (new.email is distinct from old.email)
      or (new.name is distinct from old.name)
      or (new.subject is distinct from old.subject)
      or (new.message is distinct from old.message)
    then
      raise exception 'support can only reply to messages';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_support_contact_update on public.contact_messages;
create trigger trg_enforce_support_contact_update
before update on public.contact_messages
for each row
execute function public.enforce_support_contact_update();

commit;
