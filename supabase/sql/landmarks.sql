-- Ploty — Connectivity & Nearby Places
-- Run after schema.sql (and nearby_plots.sql). Additive only.
--
-- Adds a curated master landmark database plus a join table that stores,
-- for every plot/layout, the 10 nearest landmarks with a precomputed
-- distance and estimated drive time. This is NOT live data — the
-- landmark list is maintained by hand every 6-12 months, and the
-- per-listing distances are computed once (via trigger) whenever a
-- listing's location is set or changed.

-- ============================================================
-- LANDMARKS — curated master list, one row per real-world place
-- ============================================================

create table public.landmarks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in (
    'connectivity', 'employment', 'education', 'healthcare', 'shopping', 'recreation', 'civic'
  )),
  icon text not null default '📍',
  location geography(point, 4326) not null,
  lat double precision generated always as (ST_Y(location::geometry)) stored,
  lng double precision generated always as (ST_X(location::geometry)) stored,
  city text not null,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create index landmarks_location_idx on public.landmarks using gist (location);
create index landmarks_city_idx on public.landmarks (city);

alter table public.landmarks enable row level security;

create policy "landmarks are publicly readable"
  on public.landmarks for select
  using (true);

create policy "staff can maintain landmarks"
  on public.landmarks for all
  to authenticated
  using (exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'staff'
  ))
  with check (exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'staff'
  ));


-- ============================================================
-- LISTING_LANDMARKS — precomputed top-10 nearest landmarks per listing
-- (polymorphic owner_type + owner_id, same pattern as media/listing_amenities)
-- ============================================================

create table public.listing_landmarks (
  owner_type text not null check (owner_type in ('plot', 'layout')),
  owner_id uuid not null,
  landmark_id uuid not null references public.landmarks(id) on delete cascade,
  rank integer not null,
  distance_km numeric not null,
  drive_time_min integer not null,
  primary key (owner_type, owner_id, landmark_id)
);

create index listing_landmarks_owner_idx on public.listing_landmarks (owner_type, owner_id);

alter table public.listing_landmarks enable row level security;

create policy "listing landmarks are publicly readable"
  on public.listing_landmarks for select
  using (true);


-- ============================================================
-- SYNC FUNCTION — recomputes the top 10 nearest landmarks for one listing
-- security definer: owners can't write listing_landmarks directly (it's
-- read-only via RLS), so this runs as the table owner, the same way
-- handle_new_user() bypasses RLS on profiles.
-- ============================================================

create or replace function public.sync_listing_landmarks(
  p_owner_type text, p_owner_id uuid, p_lat double precision, p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.listing_landmarks
  where owner_type = p_owner_type and owner_id = p_owner_id;

  insert into public.listing_landmarks (owner_type, owner_id, landmark_id, rank, distance_km, drive_time_min)
  select
    p_owner_type,
    p_owner_id,
    l.id,
    row_number() over (order by ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)),
    round((ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000)::numeric, 1),
    -- rough urban drive-time estimate: 28 km/h average, minimum 1 minute
    greatest(1, round((ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000) / 28 * 60)::int)
  from public.landmarks l
  order by ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) asc
  limit 10;
end;
$$;

grant execute on function public.sync_listing_landmarks(text, uuid, double precision, double precision)
  to authenticated, service_role;


-- ============================================================
-- TRIGGERS — recompute automatically on publish or relocation
-- ============================================================

create function public.trg_sync_plot_landmarks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_listing_landmarks('plot', new.id, ST_Y(new.location::geometry), ST_X(new.location::geometry));
  return new;
end;
$$;

create trigger sync_plot_landmarks
  after insert or update of location on public.plots
  for each row execute function public.trg_sync_plot_landmarks();

create function public.trg_sync_layout_landmarks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_listing_landmarks('layout', new.id, ST_Y(new.location::geometry), ST_X(new.location::geometry));
  return new;
end;
$$;

create trigger sync_layout_landmarks
  after insert or update of location on public.layouts
  for each row execute function public.trg_sync_layout_landmarks();


-- ============================================================
-- SEED DATA — Chennai. Coordinates are best-effort landmark centroids,
-- not survey-grade. Re-check and refresh every 6-12 months (see spec).
-- ============================================================

insert into public.landmarks (name, category, icon, location, city, priority) values
  -- Connectivity — Roads & Highways
  ('GST Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1462, 12.9516), 4326)::geography, 'Chennai', 10),
  ('OMR (Old Mahabalipuram Road)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2279, 12.9010), 4326)::geography, 'Chennai', 10),
  ('ECR (East Coast Road)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2500, 12.8500), 4326)::geography, 'Chennai', 9),
  ('Outer Ring Road (ORR)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1000, 13.0500), 4326)::geography, 'Chennai', 9),
  ('Chennai Bypass', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1650, 13.0700), 4326)::geography, 'Chennai', 8),

  -- Connectivity — Metro Stations
  ('Airport Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1700, 12.9950), 4326)::geography, 'Chennai', 8),
  ('Guindy Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2200, 13.0100), 4326)::geography, 'Chennai', 8),
  ('Alandur Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2010, 13.0030), 4326)::geography, 'Chennai', 8),
  ('CMBT Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1780, 13.0700), 4326)::geography, 'Chennai', 7),
  ('Washermenpet Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2820, 13.1150), 4326)::geography, 'Chennai', 6),

  -- Connectivity — Railway Stations
  ('Chennai Central', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2757, 13.0827), 4326)::geography, 'Chennai', 9),
  ('Chennai Egmore', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2609, 13.0732), 4326)::geography, 'Chennai', 8),
  ('Tambaram Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1000, 12.9246), 4326)::geography, 'Chennai', 9),
  ('Chengalpattu Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(79.9760, 12.6900), 4326)::geography, 'Chennai', 7),
  ('Avadi Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1000, 13.1150), 4326)::geography, 'Chennai', 6),

  -- Connectivity — Bus Terminals
  ('Kilambakkam Bus Terminus', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.0700, 12.8300), 4326)::geography, 'Chennai', 7),
  ('CMBT', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.1780, 13.0700), 4326)::geography, 'Chennai', 8),
  ('Tambaram Bus Stand', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.1170, 12.9246), 4326)::geography, 'Chennai', 7),

  -- Connectivity — Airport
  ('Chennai International Airport', 'connectivity', '✈️', ST_SetSRID(ST_MakePoint(80.1709, 12.9941), 4326)::geography, 'Chennai', 10),

  -- Employment
  ('SIPCOT Siruseri', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2245, 12.8236), 4326)::geography, 'Chennai', 9),
  ('SIPCOT Oragadam', 'employment', '🏢', ST_SetSRID(ST_MakePoint(79.9950, 12.7900), 4326)::geography, 'Chennai', 9),
  ('DLF IT Park', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.1830, 13.0080), 4326)::geography, 'Chennai', 8),
  ('TIDEL Park', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2450, 12.9910), 4326)::geography, 'Chennai', 8),
  ('RMZ Millenia', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2420, 12.9630), 4326)::geography, 'Chennai', 7),
  ('Olympia Tech Park', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2100, 13.0100), 4326)::geography, 'Chennai', 7),
  ('Ascendas IT Park', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2450, 12.9860), 4326)::geography, 'Chennai', 7),
  ('Mahindra World City', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.0100, 12.7900), 4326)::geography, 'Chennai', 8),
  ('Guindy Industrial Estate', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2050, 13.0100), 4326)::geography, 'Chennai', 6),

  -- Education — Schools
  ('PSBB School', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2100, 13.0350), 4326)::geography, 'Chennai', 7),
  ('DAV School', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2550, 13.0500), 4326)::geography, 'Chennai', 6),
  ('Velammal School', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1750, 13.0850), 4326)::geography, 'Chennai', 7),
  ('SBOA School', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2100, 13.0850), 4326)::geography, 'Chennai', 6),
  ('Chettinad Vidyashram', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2270, 12.8950), 4326)::geography, 'Chennai', 6),
  ('Maharishi Vidya Mandir', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2420, 13.0700), 4326)::geography, 'Chennai', 6),

  -- Education — Colleges & Universities
  ('IIT Madras', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2337, 12.9915), 4326)::geography, 'Chennai', 10),
  ('Anna University', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2350, 13.0108), 4326)::geography, 'Chennai', 8),
  ('SRM University', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.0440, 12.8230), 4326)::geography, 'Chennai', 8),
  ('VIT Chennai', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1534, 12.8406), 4326)::geography, 'Chennai', 7),
  ('Sathyabama University', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2210, 12.8720), 4326)::geography, 'Chennai', 7),
  ('Hindustan University', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2270, 12.8460), 4326)::geography, 'Chennai', 6),
  ('Saveetha University', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.0110, 13.0330), 4326)::geography, 'Chennai', 6),

  -- Healthcare
  ('Apollo Hospitals', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2570, 13.0620), 4326)::geography, 'Chennai', 9),
  ('MIOT Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.1870, 13.0090), 4326)::geography, 'Chennai', 8),
  ('Global Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2120, 12.9080), 4326)::geography, 'Chennai', 7),
  ('SIMS Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2130, 13.0500), 4326)::geography, 'Chennai', 7),
  ('Kauvery Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2530, 13.0330), 4326)::geography, 'Chennai', 7),
  ('Fortis Malar', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2570, 13.0070), 4326)::geography, 'Chennai', 7),
  ('MGM Healthcare', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2260, 13.0730), 4326)::geography, 'Chennai', 6),

  -- Lifestyle & Shopping
  ('Phoenix MarketCity', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2180, 12.9910), 4326)::geography, 'Chennai', 8),
  ('VR Chennai', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2170, 13.0870), 4326)::geography, 'Chennai', 8),
  ('Express Avenue', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2610, 13.0580), 4326)::geography, 'Chennai', 7),
  ('Marina Mall', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2130, 13.0850), 4326)::geography, 'Chennai', 6),
  ('Nexus Vijaya Mall', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2120, 13.0500), 4326)::geography, 'Chennai', 6),
  ('Grand Square Mall', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.1600, 13.0800), 4326)::geography, 'Chennai', 5),

  -- Recreation
  ('Marina Beach', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2824, 13.0500), 4326)::geography, 'Chennai', 8),
  ("Elliot's Beach", 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2670, 13.0000), 4326)::geography, 'Chennai', 7),
  ('Pallikaranai Marsh', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2130, 12.9370), 4326)::geography, 'Chennai', 6),
  ('Guindy National Park', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2350, 13.0100), 4326)::geography, 'Chennai', 6),
  ('Semmozhi Poonga', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2540, 13.0490), 4326)::geography, 'Chennai', 5),
  ('Vandalur Zoo', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.0810, 12.8830), 4326)::geography, 'Chennai', 6),

  -- Government & Civic
  ('Chennai Collector Office', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2825, 13.0836), 4326)::geography, 'Chennai', 4),
  ('Chennai Corporation Office', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2785, 13.0878), 4326)::geography, 'Chennai', 4),
  ('Tambaram Sub-Registrar Office', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.1170, 12.9246), 4326)::geography, 'Chennai', 4);


-- ============================================================
-- ONE-TIME BACKFILL — computes landmarks for listings that already
-- existed before this migration ran (new listings get this from the
-- trigger automatically going forward).
-- ============================================================

select public.sync_listing_landmarks('plot', id, lat, lng) from public.plots;
select public.sync_listing_landmarks('layout', id, lat, lng) from public.layouts;
