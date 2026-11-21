-- SugamPath community layer: accessible-friendly place marks, votes, and road photos.
-- Run once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.
--
-- Auth: Dashboard -> Authentication -> URL Configuration
--   Site URL            = your deployed URL (e.g. https://sugampath.vercel.app)
--   Redirect URLs       = also add http://localhost:3000/** for local dev
-- Optional: Authentication -> Email Templates -> Magic Link, add {{ .Token }} so the email
-- also shows a 6-digit code (the app has a "type the code" fallback for PWAs).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- place marks
create table if not exists community_marks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name   text not null default 'Member',
  place_ext_id  text,                         -- links to an existing campus place when picked from the list
  name          text not null check (char_length(name) between 2 and 120),
  lat           double precision not null check (lat between -90 and 90),
  lon           double precision not null check (lon between -180 and 180),
  verdict       text not null default 'friendly' check (verdict in ('friendly','partial','not_friendly')),
  features      text[] not null default '{}',
  modes         text[] not null default '{}', -- wheelchair | blind | walker
  note          text check (note is null or char_length(note) <= 500),
  created_at    timestamptz not null default now()
);
create index if not exists community_marks_created_idx on community_marks (created_at desc);
create index if not exists community_marks_place_idx   on community_marks (place_ext_id);

create table if not exists community_mark_votes (
  mark_id    uuid not null references community_marks(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vote       text not null check (vote in ('confirm','dispute')),
  created_at timestamptz not null default now(),
  primary key (mark_id, user_id)
);

-- ---------------------------------------------------------------- road photos (stored now, processed later)
create table if not exists road_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name   text not null default 'Member',
  storage_path  text not null,                -- <user_id>/<uuid>.jpg inside bucket road-photos
  lat           double precision,
  lon           double precision,
  accuracy_m    real,
  place_ext_id  text,
  tags          text[] not null default '{}',
  note          text check (note is null or char_length(note) <= 500),
  width         int,
  height        int,
  bytes         int,
  -- Automated pipeline picks up status = 'pending', fills ai_result, flips to 'processed'.
  status        text not null default 'pending' check (status in ('pending','processing','processed','rejected')),
  ai_result     jsonb,
  processed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists road_photos_status_idx  on road_photos (status, created_at);
create index if not exists road_photos_created_idx on road_photos (created_at desc);

-- ---------------------------------------------------------------- vote counts
create or replace view community_marks_v with (security_invoker = true) as
select m.*,
       coalesce(sum((v.vote = 'confirm')::int), 0)::int as confirms,
       coalesce(sum((v.vote = 'dispute')::int), 0)::int as disputes
from community_marks m
left join community_mark_votes v on v.mark_id = m.id
group by m.id;

-- ---------------------------------------------------------------- RLS
alter table community_marks      enable row level security;
alter table community_mark_votes enable row level security;
alter table road_photos          enable row level security;

drop policy if exists "marks readable"       on community_marks;
drop policy if exists "marks insert own"     on community_marks;
drop policy if exists "marks delete own"     on community_marks;
create policy "marks readable"   on community_marks for select to anon, authenticated using (true);
create policy "marks insert own" on community_marks for insert to authenticated with check (user_id = auth.uid());
create policy "marks delete own" on community_marks for delete to authenticated using (user_id = auth.uid());

drop policy if exists "votes readable"   on community_mark_votes;
drop policy if exists "votes insert own" on community_mark_votes;
drop policy if exists "votes update own" on community_mark_votes;
drop policy if exists "votes delete own" on community_mark_votes;
create policy "votes readable"   on community_mark_votes for select to anon, authenticated using (true);
create policy "votes insert own" on community_mark_votes for insert to authenticated with check (user_id = auth.uid());
create policy "votes update own" on community_mark_votes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "votes delete own" on community_mark_votes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "photos readable"   on road_photos;
drop policy if exists "photos insert own" on road_photos;
drop policy if exists "photos delete own" on road_photos;
create policy "photos readable"   on road_photos for select to anon, authenticated using (true);
create policy "photos insert own" on road_photos for insert to authenticated
  with check (user_id = auth.uid() and storage_path like auth.uid()::text || '/%');
create policy "photos delete own" on road_photos for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('road-photos', 'road-photos', true, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "road photos read"   on storage.objects;
drop policy if exists "road photos upload" on storage.objects;
drop policy if exists "road photos delete" on storage.objects;
create policy "road photos read"   on storage.objects for select to anon, authenticated using (bucket_id = 'road-photos');
create policy "road photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'road-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "road photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'road-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- realtime (instant feed updates)
do $$ begin
  alter publication supabase_realtime add table community_marks;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table road_photos;
exception when others then null; end $$;
