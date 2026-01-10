-- Notifications Table
create type notification_type as enum ('info', 'warning', 'error', 'success');

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  type notification_type default 'info',
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Auto-cleanup Trigger (Max 10)
create or replace function public.cleanup_notifications()
returns trigger as $$
begin
  delete from public.notifications
  where id in (
    select id from public.notifications
    where user_id = new.user_id
    order by created_at desc
    offset 10
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_notification_created
  after insert on public.notifications
  for each row execute procedure public.cleanup_notifications();
