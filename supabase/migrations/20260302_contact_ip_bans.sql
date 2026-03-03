-- Add ip tracking and blocking for contact forms

-- 1. Add IP to contact messages
ALTER TABLE public.contact_messages
ADD COLUMN ip_address text;

-- 2. Create Banned IPs table
CREATE TABLE public.banned_ips (
    ip text PRIMARY KEY,
    reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS to block public access
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

-- Only service role / admin can manage bans (no public policies)
