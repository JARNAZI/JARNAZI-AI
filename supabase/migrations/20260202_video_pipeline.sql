
-- Video Pipeline Tables

create table if not exists public.video_jobs (
  id uuid default uuid_generate_v4() primary key,
  debate_id uuid references public.debates(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending', -- pending, running, composing, done, failed
  resolution_status text, -- detailed status check
  output_url text,
  music_url text,
  voice_url text,
  error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.video_shots (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.video_jobs(id) on delete cascade not null,
  prompt text not null,
  provider_kind text, -- video, image
  provider_config jsonb, -- specific model/provider preference
  status text default 'pending', -- pending, running, done, failed
  output_url text,
  error text,
  attempt_count int default 0,
  metadata jsonb, -- duration, style, etc
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.video_jobs enable row level security;
alter table public.video_shots enable row level security;

create policy "Users can view own video jobs" on public.video_jobs
  for select using (auth.uid() = user_id);

create policy "Users can view own video shots" on public.video_shots
  for select using ( 
    exists (select 1 from public.video_jobs where id = video_shots.job_id and user_id = auth.uid()) 
  );
  
-- Allow service role full access (default, but good to be explicit if restrictive policies exist)
-- (Assuming service role bypasses RLS, which is standard in Supabase)
