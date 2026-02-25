create type message_status as enum ('pending', 'replied');

create table public.contact_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status message_status default 'pending',
  admin_reply text,
  replied_at timestamp with time zone,
  replied_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.contact_messages enable row level security;

-- Public can insert (contact form)
create policy "Anyone can insert contact messages" on public.contact_messages
  for insert with check (true);

-- Admin can read/update all (assumed via service role or admin policy)
-- Users can see their own messages
create policy "Users can view own messages" on public.contact_messages
  for select using (auth.uid() = user_id);
