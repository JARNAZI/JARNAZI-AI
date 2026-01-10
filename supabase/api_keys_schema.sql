-- API Keys Storage (Encrypted via Supabase Vault or Environment)
-- Note: For production, use Supabase Secrets/Vault. This table stores references.
create table if not exists public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  key_name text not null unique, -- e.g., 'OPENAI_API_KEY'
  key_value text, -- Encrypted or reference to env var
  is_from_env boolean default false, -- True if from Supabase Edge Function env
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for api_keys (admin only)
alter table public.api_keys enable row level security;

-- Only accessible via service role or admin functions
create policy "Service role can manage API keys" on public.api_keys
  for all using (auth.role() = 'service_role');
