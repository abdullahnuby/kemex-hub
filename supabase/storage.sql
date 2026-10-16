-- شغّل الملف ده في Supabase SQL Editor لإعداد مخزن الملفات.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do nothing;

create policy "auth upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');
create policy "auth delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media');
