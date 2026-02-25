-- =============================================
-- FIX: Ensure Admin can see all users & sync role
-- =============================================

-- 1. Ensure the is_admin function doesn't cause recursion and is efficient
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid
      and role in ('admin', 'super_admin')
  );
$$;

-- 2. Update Profiles RLS Policy to be super clear
drop policy if exists "Profiles select policy" on public.profiles;
create policy "Profiles select policy"
on public.profiles for select
to authenticated
using (
  auth.uid() = id 
  or (select role from public.profiles where id = auth.uid()) in ('admin', 'super_admin')
);

-- 3. Ensure all existing users have a profile row (Sync check)
insert into public.profiles (id, email, full_name, role)
select 
  u.id, 
  u.email, 
  u.raw_user_meta_data->>'full_name',
  'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 4. HELPER: Grant admin role to a specific email (Optional: User can run this)
-- update public.profiles set role = 'admin' where email = 'your-admin-email@example.com';
