-- Create a table for global site settings
create table if not exists public.site_settings (
    setting_key text primary key,
    setting_value text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.site_settings enable row level security;

-- Policies:
-- 1. Everyone can READ 'logo_url', 'privacy_policy', 'terms_of_use'
create policy "Public settings are viewable by everyone"
on public.site_settings for select
using (true);

-- 2. Only Admins can UPDATE
create policy "Admins can update settings"
on public.site_settings for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 3. Only Admins can INSERT
create policy "Admins can insert settings"
on public.site_settings for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Insert default values (optional, for safety)
insert into public.site_settings (setting_key, setting_value)
values 
  ('logo_url', ''),
  ('privacy_policy', '## Privacy Policy\n\nYour privacy is important to us.'),
  ('terms_of_use', '## Terms of Use\n\nBy using this service, you agree to the terms.')
on conflict (setting_key) do nothing;
