
-- Update settings table to be more robust
drop table if exists public.site_settings;
create table public.site_settings (
    key text primary key,
    value text, -- JSON strings allowed
    label text,
    type text default 'text', -- 'text', 'boolean', 'markdown', 'image', 'json'
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.site_settings enable row level security;

create policy "Settings read access" on public.site_settings for select using (true);
create policy "Settings admin write access" on public.site_settings for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- Seed Defaults
insert into public.site_settings (key, value, label, type) values 
('site_title', 'Jarnazi Consensus AI', 'Site Title', 'text'),
('logo_url', '/logo.jpg', 'Logo URL', 'image'),
('enable_free_trial', 'true', 'Enable Free Trial', 'boolean'),
('token_plans', '[{"name": "Starter", "tokens": 10, "price": 9.99}, {"name": "Pro", "tokens": 50, "price": 39.99}]', 'Token Plans', 'json'),
('privacy_policy', '## Privacy Policy\n\nYour privacy is prioritized.', 'Privacy Policy', 'markdown'),
('terms_of_service', '## Terms of Service\n\nStandard terms apply.', 'Terms of Service', 'markdown')
on conflict (key) do update set value = EXCLUDED.value;

-- Ensure storage bucket exists for logo uploads
insert into storage.buckets (id, name, public) values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

create policy "Public Access to Assets" on storage.objects for select using ( bucket_id = 'public-assets' );
create policy "Admin Upload Assets" on storage.objects for insert with check (
    bucket_id = 'public-assets' and 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- Seed Super Admin (Ensure info@jarnazi.com exists and is admin)
-- NOTE: We cannot insert into auth.users directly via standard SQL in some Supabase contexts easily without extensions 
-- So we rely on the application to SignUp the user, or we update the role if the email matches.

-- Update role trigger for specific email
create or replace function public.promote_super_admin()
returns trigger as $$
begin
  if new.email = 'info@jarnazi.com' then
    update public.profiles set role = 'super_admin' where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute procedure public.promote_super_admin();

-- Also try to promote if already exists (best effort for existing DB)
update public.profiles set role = 'super_admin' where email = 'info@jarnazi.com';
