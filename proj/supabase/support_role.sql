-- Add 'support' to user_role enum
-- Note: Altering type inside a transaction block in simple migration scripts can be tricky if not careful,
-- but usually `ALTER TYPE ... ADD VALUE` is safe.
alter type public.user_role add value if not exists 'support' after 'user';

-- Update Contact Messages RLS for Support
-- Ensure RLS is enabled
alter table public.contact_messages enable row level security;

-- Support can VIEW all messages
create policy "Support can view all messages"
  on public.contact_messages
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin', 'support')
    )
  );

-- Support can UPDATE (Reply) messages
create policy "Support can update messages"
  on public.contact_messages
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin', 'support')
    )
  );

-- Support CANNOT Delete messages (Only Admin/Super Admin)
create policy "Admins can delete messages"
  on public.contact_messages
  for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );
