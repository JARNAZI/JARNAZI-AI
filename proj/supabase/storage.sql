-- Create a new storage bucket for debate attachments
insert into storage.buckets (id, name, public)
values ('debate-attachments', 'debate-attachments', true);

-- Policy to allow authenticated uploads
create policy "Authenticated users can upload debate attachments"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'debate-attachments' );

-- Policy to allow public read access
create policy "Public Access to Debate Attachments"
on storage.objects for select
to public
using ( bucket_id = 'debate-attachments' );
