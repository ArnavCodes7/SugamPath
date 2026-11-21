-- SugamPath backend schema (Supabase / Postgres). Run once in the SQL editor.
-- Zero-login model: the caregiver link /track/<token> carries a 16-char random token.
-- Treat the token as the secret. Anyone with it can read that one trip, nobody can list trips.

create table if not exists trips (
  token       text primary key check (char_length(token) >= 16),
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists surface_samples (
  id          bigint generated always as identity primary key,
  t           bigint not null,
  kind        text not null check (kind in ('stairs','rough','smooth')),
  confidence  real not null,
  lat         double precision,
  lng         double precision,
  place_id    text
);

create table if not exists hazard_reports (
  id          bigint generated always as identity primary key,
  place_id    text not null,
  gate_name   text not null,
  kind        text not null,
  source      text not null,
  at          timestamptz not null default now()
);
create index if not exists hazard_reports_place on hazard_reports (place_id, at desc);

create table if not exists arrival_checks (
  id          bigint generated always as identity primary key,
  place_id    text not null,
  gate_name   text not null,
  step_free   boolean not null,
  at          timestamptz not null default now()
);

create table if not exists legal_reports (
  audit_id       text primary key,
  issue_id       text not null,
  track          text not null check (track in ('structural','municipal')),
  evidence_hash  text not null,
  generated_at   bigint not null
);

alter table trips            enable row level security;
alter table surface_samples  enable row level security;
alter table hazard_reports   enable row level security;
alter table arrival_checks   enable row level security;
alter table legal_reports    enable row level security;

-- Anonymous devices may write. Reads of trips go through get_trip(token) so rows cannot be listed.
create policy "anon insert samples"  on surface_samples for insert to anon with check (true);
create policy "anon insert hazards"  on hazard_reports  for insert to anon with check (true);
create policy "anon read hazards"    on hazard_reports  for select to anon using (at > now() - interval '30 days');
create policy "anon insert arrivals" on arrival_checks  for insert to anon with check (true);
create policy "anon insert reports"  on legal_reports   for insert to anon with check (true);
create policy "anon upsert trips"    on trips for insert to anon with check (true);
create policy "anon update trips"    on trips for update to anon using (true) with check (true);

create or replace function get_trip(p_token text) returns jsonb
language sql security definer set search_path = public as
$$ select state from trips where token = p_token $$;
grant execute on function get_trip(text) to anon;

-- Realtime: the app uses Broadcast channels named "trip:<token>", which need no table publication.
-- TODO before launch: restrict "anon update trips" (e.g. require the writer to present the token via an RPC)
-- and add a cron job deleting trips older than 24 h.
