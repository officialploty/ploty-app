-- Ploty — Day 15: Storage bucket for listing photos/videos
-- Run this whole file in Supabase SQL Editor (Project > SQL Editor > New query > Run)

insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do nothing;

-- anyone can view listing media (it's public-facing, same as the listings themselves)
create policy "listing media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-media');

-- authenticated users can only upload into a folder prefixed with their own user id
-- (e.g. "<uid>/plot/<plot_id>/0.jpg") — keeps uploads scoped without needing to know
-- the plot/layout id ahead of time at the storage-policy level
create policy "authenticated users can upload into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
