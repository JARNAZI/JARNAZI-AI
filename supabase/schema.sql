-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('user', 'admin', 'super_admin');
create type ai_category as enum ('text', 'image', 'video', 'audio', 'math', 'security');
create type debate_status as enum ('pending', 'active', 'completed', 'failed');

-- Profiles Table (Extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  role user_role default 'user'::user_role,
  token_balance integer default 0,
  is_banned boolean default false,
  free_trial_used boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI Providers Table (Dynamic Management)
create table public.ai_providers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  provider text not null, -- e.g., 'openai', 'anthropic'
  category ai_category not null default 'text',
  base_url text, -- Optional override
  model_id text not null, -- e.g., 'gpt-4-turbo'
  config jsonb default '{}'::jsonb, -- Store non-sensitive config
  is_active boolean default true,
  priority integer default 0, -- Lower number = higher priority
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Debates Table
create table public.debates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic text not null,
  status debate_status default 'pending',
  summary text, -- Final consensus summary
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Debate Turns (Individual responses)
create table public.debate_turns (
  id uuid default uuid_generate_v4() primary key,
  debate_id uuid references public.debates(id) on delete cascade not null,
  ai_provider_id uuid references public.ai_providers(id) on delete set null,
  ai_name_snapshot text, -- In case provider is deleted
  content text, -- Markdown text or JSON
  media_url text, -- For image/video results
  is_error boolean default false,
  sequence_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generated Media (Retention Policy)
create table public.generated_media (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  debate_id uuid references public.debates(id) on delete cascade,
  url text not null,
  type text not null, -- 'image' or 'video'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null -- Scheduled for deletion
);

-- Token Transactions / Audit Log
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb,
  ip_address text,
  performed_by_admin_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic Secure Defaults)
alter table public.profiles enable row level security;
alter table public.ai_providers enable row level security;
alter table public.debates enable row level security;
alter table public.debate_turns enable row level security;
alter table public.generated_media enable row level security;

-- Profiles: Users can view their own, Admins can view all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- AI Providers: Public read (for functionality) or authenticated only
create policy "Authenticated can read active providers" on public.ai_providers
  for select using (auth.role() = 'authenticated' and is_active = true);

-- Enable Admin full access (Implementation depends on role check function)
-- For now, we assume service role bypasses RLS for admin tasks.

-- Trigger for Profile creation on Auth Signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, token_balance)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 1); -- 1 Free token trial
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
