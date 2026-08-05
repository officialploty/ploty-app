-- Ploty — Connectivity & Nearby Places
-- Run after schema.sql (and nearby_plots.sql). Additive only.
--
-- Adds a curated master landmark database plus a join table that stores,
-- for every plot/layout, the 10 nearest landmarks with a precomputed
-- distance and estimated drive time. sync_listing_landmarks() writes up to
-- 35 straight-line candidates first (top 5 per category, cheap, instant,
-- never blank) — per-category, not a single global top-N, because
-- high-weight categories like connectivity (roads/metro, weight 5) can
-- otherwise dominate every slot and starve healthcare/education/etc out of
-- the candidate pool entirely. An Ola Maps Distance Matrix call then
-- refines those candidates to real routable distance/time and trims to the
-- final 10 (capped at 3/category) — see
-- supabase/functions/_shared/landmarks.ts. This is NOT live data — the
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
  -- category-tier importance (1-5), NOT the same as `priority` above (which
  -- ranks landmarks against others of the same type). This is what lets a
  -- highway 3km away outrank a mall 200m away when picking the "headline"
  -- landmark for a listing — derived from icon since that already encodes
  -- the subtype (road/metro/airport vs school/mall/etc).
  weight integer generated always as (
    case icon
      when '🚗' then 5  -- roads & highways
      when '🚇' then 5  -- metro
      when '✈️' then 5  -- airport
      when '🚆' then 4  -- railway
      when '🚌' then 4  -- bus terminal
      when '🏢' then 4  -- employment / IT park
      when '🎓' then 3  -- education
      when '🏥' then 3  -- healthcare
      when '🛍' then 2  -- shopping
      when '🌳' then 2  -- recreation
      when '🏛' then 2  -- civic
      else 3
    end
  ) stored,
  created_at timestamptz not null default now()
);

create index landmarks_location_idx on public.landmarks using gist (location);
create index landmarks_city_idx on public.landmarks (city);

alter table public.landmarks enable row level security;

create policy "landmarks are publicly readable"
  on public.landmarks for select
  using (true);

-- RLS policies only gate which rows a role can see — the role still
-- needs the base table-level privilege first, which isn't implied by
-- "enable row level security" or a permissive policy.
grant select on public.landmarks to anon, authenticated;

-- service_role bypasses RLS but still needs this explicit grant — see the
-- longer note next to the matching grant on listing_landmarks below.
grant select on public.landmarks to service_role;

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

grant select on public.listing_landmarks to anon, authenticated;

-- service_role bypasses RLS but still needs an explicit table grant —
-- Supabase's default privilege wiring doesn't automatically extend to
-- tables created via manual SQL (as opposed to the managed migration
-- pipeline). Needed by refineListingDistances() in the Edge Function
-- layer, which writes real Ola Maps distances back after the DB trigger's
-- straight-line pass — see supabase/functions/_shared/landmarks.ts.
grant select, update, delete on public.listing_landmarks to service_role;


-- ============================================================
-- SYNC FUNCTION — recomputes the top-5-per-category candidate landmarks
-- for one listing (straight-line only; refineListingDistances() in the
-- Edge Function layer narrows this to the final 10 using real Ola Maps
-- drive distance/time).
-- security definer: owners can't write listing_landmarks directly (it's
-- read-only via RLS), so this runs as the table owner, the same way
-- handle_new_user() bypasses RLS on profiles.
--
-- Ranking isn't pure distance — a highway 3km away is a more useful thing
-- to show a buyer than a mall 200m away. Each category tier (`weight`,
-- 2-5) is worth 10 score points, so one tier of difference outweighs up
-- to a 10km gap in distance before proximity wins out. Rank 1 (the
-- highest-scoring row) is what the listing card features as its headline
-- landmark — see listCardFields() in fields.js. Candidates are picked top-5
-- PER CATEGORY (not one global top-N) — a single global ranking lets
-- high-weight categories like connectivity (roads/metro, weight 5) sweep
-- every slot and starve out healthcare/education/shopping/etc entirely,
-- which then breaks the Edge Function's per-category cap downstream since
-- it has nothing but one category to choose from.
-- ============================================================

create or replace function public.sync_listing_landmarks(
  p_owner_type text, p_owner_id uuid, p_lat double precision, p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.listing_landmarks
  where owner_type = p_owner_type and owner_id = p_owner_id;

  insert into public.listing_landmarks (owner_type, owner_id, landmark_id, rank, distance_km, drive_time_min)
  select
    p_owner_type,
    p_owner_id,
    candidates.id,
    row_number() over (order by candidates.score desc),
    round(candidates.distance_km::numeric, 1),
    -- rough urban drive-time estimate: 28 km/h average, minimum 1 minute
    greatest(1, round(candidates.distance_km / 28 * 60)::int)
  from (
    select
      l.id,
      (ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000) as distance_km,
      (l.weight * 10 - (ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000)) as score,
      row_number() over (
        partition by l.category
        order by (l.weight * 10 - (ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000)) desc
      ) as category_rank
    from public.landmarks l
  ) candidates
  where candidates.category_rank <= 5;
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
set search_path = public, extensions
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
set search_path = public, extensions
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
  ('OMR (Rajiv Gandhi Salai)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2279, 12.9010), 4326)::geography, 'Chennai', 10),
  ('ECR (East Coast Road)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2500, 12.8500), 4326)::geography, 'Chennai', 9),
  ('Outer Ring Road (ORR)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1000, 13.0500), 4326)::geography, 'Chennai', 9),
  ('Chennai Bypass', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1650, 13.0700), 4326)::geography, 'Chennai', 8),
  ('Poonamallee High Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1950, 13.0550), 4326)::geography, 'Chennai', 7),
  ('Anna Salai (Mount Road)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2610, 13.0600), 4326)::geography, 'Chennai', 8),
  ('Inner Ring Road (Jawaharlal Nehru Road)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2200, 13.0200), 4326)::geography, 'Chennai', 7),
  ('Velachery Main Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2200, 12.9750), 4326)::geography, 'Chennai', 6),
  ('Medavakkam Main Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1980, 12.9180), 4326)::geography, 'Chennai', 6),
  ('Sardar Patel Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2350, 13.0080), 4326)::geography, 'Chennai', 6),
  ('Radhakrishnan Salai', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2650, 13.0400), 4326)::geography, 'Chennai', 5),
  ('Kamarajar Salai (Beach Road)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2820, 13.0550), 4326)::geography, 'Chennai', 5),
  ('Arcot Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2050, 13.0450), 4326)::geography, 'Chennai', 6),
  ('NH32 (Chennai–Trichy Highway)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.0500, 12.8900), 4326)::geography, 'Chennai', 7),
  ('NH16 (Chennai–Kolkata Highway)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2900, 13.1600), 4326)::geography, 'Chennai', 7),
  ('NH48 (Chennai–Bengaluru Highway)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.0800, 13.0300), 4326)::geography, 'Chennai', 7),
  ('NH716 (Chennai–Tiruvallur Highway)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1000, 13.1400), 4326)::geography, 'Chennai', 6),
  ('Vandalur–Kelambakkam Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1400, 12.8600), 4326)::geography, 'Chennai', 6),
  ('Thoraipakkam–Pallavaram Radial Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1900, 12.9500), 4326)::geography, 'Chennai', 6),
  ('Mount Poonamallee Road (Ramapuram)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1800, 13.0250), 4326)::geography, 'Chennai', 6),
  ('100 Feet Road (Ashok Nagar/Vadapalani)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2080, 13.0400), 4326)::geography, 'Chennai', 6),
  ('Kutchery Road (Mylapore)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2680, 13.0350), 4326)::geography, 'Chennai', 4),
  ('TTK Road (Alwarpet)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2500, 13.0350), 4326)::geography, 'Chennai', 5),
  ('Chamiers Road (RA Puram)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2550, 13.0300), 4326)::geography, 'Chennai', 4),
  ('Nelson Manickam Road (Aminjikarai)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2260, 13.0730), 4326)::geography, 'Chennai', 5),
  ('Harrington Road (Chetpet)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2470, 13.0680), 4326)::geography, 'Chennai', 4),
  ('Eldams Road (Alwarpet/Teynampet)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2470, 13.0380), 4326)::geography, 'Chennai', 4),
  ('Cathedral Road (Gopalapuram)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2530, 13.0480), 4326)::geography, 'Chennai', 5),
  ('Greams Road (Thousand Lights)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2580, 13.0600), 4326)::geography, 'Chennai', 5),
  ('Khader Nawaz Khan Road (Nungambakkam)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2470, 13.0570), 4326)::geography, 'Chennai', 4),
  ('North Usman Road (T. Nagar)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2340, 13.0420), 4326)::geography, 'Chennai', 5),
  ('South Usman Road (T. Nagar)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2340, 13.0380), 4326)::geography, 'Chennai', 5),
  ('Ranganathan Street (T. Nagar)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2330, 13.0410), 4326)::geography, 'Chennai', 5),
  ('G.N. Chetty Road (T. Nagar)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2340, 13.0470), 4326)::geography, 'Chennai', 4),
  ('Lattice Bridge Road (Adyar)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2480, 13.0050), 4326)::geography, 'Chennai', 5),
  ('Venkatanarayana Road (T. Nagar)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2360, 13.0400), 4326)::geography, 'Chennai', 4),
  ('Santhome High Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2780, 13.0300), 4326)::geography, 'Chennai', 4),
  ('R.K. Mutt Road (Mylapore)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2700, 13.0330), 4326)::geography, 'Chennai', 4),
  ('Rajaji Salai (Parrys)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2900, 13.0930), 4326)::geography, 'Chennai', 4),
  ('NSC Bose Road (George Town)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2830, 13.0900), 4326)::geography, 'Chennai', 4),
  ('Wall Tax Road (Periamet)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2750, 13.0950), 4326)::geography, 'Chennai', 3),
  ('Konnur High Road (Ayanavaram)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2280, 13.1050), 4326)::geography, 'Chennai', 4),
  ('Paper Mills Road (Perambur)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2400, 13.1150), 4326)::geography, 'Chennai', 3),
  ('Redhills Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.1800, 13.1900), 4326)::geography, 'Chennai', 4),
  ('Grand Northern Trunk Road (GNT Road, Madhavaram)', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2400, 13.1500), 4326)::geography, 'Chennai', 5),
  ('Thiruvottiyur High Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.3000, 13.1600), 4326)::geography, 'Chennai', 4),
  ('Sriperumbudur Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(79.9400, 12.9700), 4326)::geography, 'Chennai', 5),
  ('Sholinganallur–Medavakkam Road', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2100, 12.9100), 4326)::geography, 'Chennai', 5),
  ('Perungudi MGR Salai', 'connectivity', '🚗', ST_SetSRID(ST_MakePoint(80.2400, 12.9650), 4326)::geography, 'Chennai', 4),

  -- Connectivity — Metro Stations (Chennai Metro Phase 1, Blue Line)
  ('Wimco Nagar Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.3000, 13.2200), 4326)::geography, 'Chennai', 4),
  ('Wimco Nagar Depot Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2950, 13.2150), 4326)::geography, 'Chennai', 4),
  ('Thiruvottiyur Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.3020, 13.1650), 4326)::geography, 'Chennai', 4),
  ('Thiruvottiyur Theradi Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2990, 13.1580), 4326)::geography, 'Chennai', 4),
  ('Kaladipet Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2950, 13.1450), 4326)::geography, 'Chennai', 4),
  ('Tollgate Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2900, 13.1350), 4326)::geography, 'Chennai', 4),
  ('New Washermanpet Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2870, 13.1250), 4326)::geography, 'Chennai', 4),
  ('Tondiarpet Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2830, 13.1230), 4326)::geography, 'Chennai', 4),
  ('Sir Theagaraya College Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2800, 13.1180), 4326)::geography, 'Chennai', 4),
  ('Washermanpet Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2820, 13.1150), 4326)::geography, 'Chennai', 6),
  ('Mannadi Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2870, 13.0960), 4326)::geography, 'Chennai', 5),
  ('High Court Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2870, 13.0900), 4326)::geography, 'Chennai', 5),
  ('Chennai Central Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2757, 13.0827), 4326)::geography, 'Chennai', 9),
  ('Government Estate Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2650, 13.0700), 4326)::geography, 'Chennai', 6),
  ('LIC Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2650, 13.0620), 4326)::geography, 'Chennai', 5),
  ('Thousand Lights Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2550, 13.0580), 4326)::geography, 'Chennai', 5),
  ('AG-DMS Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2450, 13.0450), 4326)::geography, 'Chennai', 5),
  ('Teynampet Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2470, 13.0400), 4326)::geography, 'Chennai', 5),
  ('Nandanam Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2400, 13.0330), 4326)::geography, 'Chennai', 5),
  ('Saidapet Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2230, 13.0200), 4326)::geography, 'Chennai', 5),
  ('Guindy Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2200, 13.0100), 4326)::geography, 'Chennai', 8),
  ('Alandur Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2010, 13.0030), 4326)::geography, 'Chennai', 8),
  ('Nanganallur Road Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1980, 12.9950), 4326)::geography, 'Chennai', 5),
  ('Meenambakkam Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1750, 12.9800), 4326)::geography, 'Chennai', 6),
  ('Chennai Airport Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1690, 12.9950), 4326)::geography, 'Chennai', 8),

  -- Connectivity — Metro Stations (Green Line)
  ('Egmore Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2609, 13.0732), 4326)::geography, 'Chennai', 7),
  ('Nehru Park Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2500, 13.0780), 4326)::geography, 'Chennai', 4),
  ('Kilpauk Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2420, 13.0800), 4326)::geography, 'Chennai', 5),
  ('Pachaiyappa''s College Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2380, 13.0830), 4326)::geography, 'Chennai', 4),
  ('Shenoy Nagar Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2320, 13.0850), 4326)::geography, 'Chennai', 4),
  ('Anna Nagar East Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2250, 13.0870), 4326)::geography, 'Chennai', 5),
  ('Anna Nagar Tower Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2130, 13.0850), 4326)::geography, 'Chennai', 6),
  ('Thirumangalam Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2050, 13.0800), 4326)::geography, 'Chennai', 4),
  ('Koyambedu Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1950, 13.0700), 4326)::geography, 'Chennai', 6),
  ('CMBT Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1780, 13.0700), 4326)::geography, 'Chennai', 7),
  ('Arumbakkam Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2100, 13.0720), 4326)::geography, 'Chennai', 4),
  ('Vadapalani Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2120, 13.0500), 4326)::geography, 'Chennai', 5),
  ('Ashok Nagar Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2050, 13.0350), 4326)::geography, 'Chennai', 4),
  ('Ekkattuthangal Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.2080, 13.0180), 4326)::geography, 'Chennai', 4),
  ('St. Thomas Mount Metro', 'connectivity', '🚇', ST_SetSRID(ST_MakePoint(80.1950, 13.0000), 4326)::geography, 'Chennai', 5),

  -- Connectivity — Railway Stations (mainline + suburban + MRTS)
  ('Chennai Central', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2757, 13.0827), 4326)::geography, 'Chennai', 9),
  ('Chennai Egmore', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2609, 13.0732), 4326)::geography, 'Chennai', 8),
  ('Chennai Beach', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2900, 13.0940), 4326)::geography, 'Chennai', 6),
  ('Chennai Fort', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2850, 13.0900), 4326)::geography, 'Chennai', 4),
  ('Tambaram Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1000, 12.9246), 4326)::geography, 'Chennai', 9),
  ('Chengalpattu Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(79.9760, 12.6900), 4326)::geography, 'Chennai', 7),
  ('Avadi Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1000, 13.1150), 4326)::geography, 'Chennai', 6),
  ('Perambur Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2380, 13.1100), 4326)::geography, 'Chennai', 5),
  ('Villivakkam Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2100, 13.0980), 4326)::geography, 'Chennai', 4),
  ('Ambattur Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1600, 13.1150), 4326)::geography, 'Chennai', 5),
  ('Korattur Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1750, 13.1050), 4326)::geography, 'Chennai', 4),
  ('Pattabiram Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1350, 13.1350), 4326)::geography, 'Chennai', 4),
  ('Tiruvallur Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.0000, 13.1430), 4326)::geography, 'Chennai', 5),
  ('Guindy Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2200, 13.0080), 4326)::geography, 'Chennai', 6),
  ('Mambalam Railway Station (T. Nagar)', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2260, 13.0400), 4326)::geography, 'Chennai', 6),
  ('Kodambakkam Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2280, 13.0500), 4326)::geography, 'Chennai', 5),
  ('Nungambakkam Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2420, 13.0600), 4326)::geography, 'Chennai', 5),
  ('Chetpet Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2450, 13.0680), 4326)::geography, 'Chennai', 4),
  ('St. Thomas Mount Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1980, 12.9990), 4326)::geography, 'Chennai', 5),
  ('Pallavaram Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1500, 12.9670), 4326)::geography, 'Chennai', 5),
  ('Chromepet Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1420, 12.9500), 4326)::geography, 'Chennai', 5),
  ('Guduvancheri Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.0650, 12.8450), 4326)::geography, 'Chennai', 4),
  ('Urapakkam Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.0850, 12.8600), 4326)::geography, 'Chennai', 4),
  ('Vandalur Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.0810, 12.8900), 4326)::geography, 'Chennai', 5),
  ('Perungalathur Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.0980, 12.9050), 4326)::geography, 'Chennai', 4),
  ('Selaiyur Railway Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.1150, 12.9150), 4326)::geography, 'Chennai', 4),
  ('Velachery MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2200, 12.9750), 4326)::geography, 'Chennai', 6),
  ('Taramani MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2450, 12.9860), 4326)::geography, 'Chennai', 5),
  ('Thiruvanmiyur MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2600, 12.9830), 4326)::geography, 'Chennai', 5),
  ('Mandaveli MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2670, 13.0300), 4326)::geography, 'Chennai', 4),
  ('Chepauk MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2800, 13.0630), 4326)::geography, 'Chennai', 4),
  ('Light House MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2800, 13.0450), 4326)::geography, 'Chennai', 4),
  ('Kotturpuram MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2440, 13.0180), 4326)::geography, 'Chennai', 4),
  ('Kasturba Nagar MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2570, 13.0000), 4326)::geography, 'Chennai', 4),
  ('Adyar MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2570, 13.0060), 4326)::geography, 'Chennai', 5),
  ('Indira Nagar MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2570, 12.9950), 4326)::geography, 'Chennai', 4),
  ('Tidel Park MRTS Station', 'connectivity', '🚆', ST_SetSRID(ST_MakePoint(80.2450, 12.9910), 4326)::geography, 'Chennai', 5),

  -- Connectivity — Bus Terminals
  ('Kilambakkam Bus Terminus', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.0700, 12.8300), 4326)::geography, 'Chennai', 7),
  ('CMBT (Koyambedu Bus Terminus)', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.1780, 13.0700), 4326)::geography, 'Chennai', 8),
  ('Tambaram Bus Stand', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.1170, 12.9246), 4326)::geography, 'Chennai', 7),
  ('Broadway Bus Terminus', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.2830, 13.0930), 4326)::geography, 'Chennai', 5),
  ('Thiruvanmiyur Bus Terminus', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.2600, 12.9830), 4326)::geography, 'Chennai', 4),
  ('Poonamallee Bus Stand', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.1100, 13.0480), 4326)::geography, 'Chennai', 4),
  ('Madhavaram Bus Terminus', 'connectivity', '🚌', ST_SetSRID(ST_MakePoint(80.2320, 13.1450), 4326)::geography, 'Chennai', 4),

  -- Connectivity — Airport
  ('Chennai International Airport', 'connectivity', '✈️', ST_SetSRID(ST_MakePoint(80.1709, 12.9941), 4326)::geography, 'Chennai', 10),

  -- Employment
  ('SIPCOT Siruseri', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2245, 12.8236), 4326)::geography, 'Chennai', 9),
  ('SIPCOT Oragadam', 'employment', '🏢', ST_SetSRID(ST_MakePoint(79.9950, 12.7900), 4326)::geography, 'Chennai', 9),
  ('SIPCOT Irungattukottai', 'employment', '🏢', ST_SetSRID(ST_MakePoint(79.9500, 12.9900), 4326)::geography, 'Chennai', 7),
  ('DLF IT Park (Manapakkam)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.1830, 13.0080), 4326)::geography, 'Chennai', 8),
  ('DLF Cybercity (Ramapuram)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.1750, 13.0250), 4326)::geography, 'Chennai', 6),
  ('TIDEL Park (Taramani)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2450, 12.9910), 4326)::geography, 'Chennai', 8),
  ('TIDEL Park II (Siruseri)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2200, 12.8250), 4326)::geography, 'Chennai', 6),
  ('RMZ Millenia', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2420, 12.9630), 4326)::geography, 'Chennai', 7),
  ('Olympia Tech Park', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2100, 13.0100), 4326)::geography, 'Chennai', 7),
  ('Ascendas IT Park (Taramani)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2450, 12.9860), 4326)::geography, 'Chennai', 7),
  ('Mahindra World City', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.0100, 12.7900), 4326)::geography, 'Chennai', 8),
  ('Guindy Industrial Estate', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2050, 13.0100), 4326)::geography, 'Chennai', 6),
  ('Ambattur Industrial Estate', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.1550, 13.1150), 4326)::geography, 'Chennai', 6),
  ('ELCOT SEZ (Sholinganallur)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2270, 12.9010), 4326)::geography, 'Chennai', 6),
  ('One Indiabulls Park (Thoraipakkam)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2380, 12.9420), 4326)::geography, 'Chennai', 5),
  ('Ramanujan IT City (Taramani)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2440, 12.9880), 4326)::geography, 'Chennai', 6),
  ('World Trade Center Chennai (Perungudi)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2430, 12.9660), 4326)::geography, 'Chennai', 5),
  ('ETA Techno Park (Thoraipakkam)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2380, 12.9400), 4326)::geography, 'Chennai', 5),
  ('Global Infocity Park (Perungudi)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2440, 12.9650), 4326)::geography, 'Chennai', 5),
  ('Renaissance Tech Park (Ambattur)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.1600, 13.0950), 4326)::geography, 'Chennai', 5),
  ('TCS Siruseri (Synergy Park)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2230, 12.8250), 4326)::geography, 'Chennai', 6),
  ('Infosys Mahindra City (Siruseri)', 'employment', '🏢', ST_SetSRID(ST_MakePoint(80.2100, 12.8200), 4326)::geography, 'Chennai', 6),

  -- Education — Schools
  ('PSBB K.K. Nagar', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2100, 13.0350), 4326)::geography, 'Chennai', 7),
  ('PSBB Nungambakkam', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2450, 13.0620), 4326)::geography, 'Chennai', 6),
  ('PSBB Millennium (OMR)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2270, 12.8950), 4326)::geography, 'Chennai', 6),
  ('PSBB Siruseri', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2230, 12.8230), 4326)::geography, 'Chennai', 5),
  ('DAV Gopalapuram', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2550, 13.0500), 4326)::geography, 'Chennai', 6),
  ('DAV Mogappair', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1750, 13.0850), 4326)::geography, 'Chennai', 5),
  ('Velammal Mogappair', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1750, 13.0850), 4326)::geography, 'Chennai', 7),
  ('Velammal Surapet', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2050, 13.1250), 4326)::geography, 'Chennai', 5),
  ('Velammal T. Nagar', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2330, 13.0400), 4326)::geography, 'Chennai', 5),
  ('SBOA Anna Nagar', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2100, 13.0850), 4326)::geography, 'Chennai', 6),
  ('SBOA Egmore', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2600, 13.0750), 4326)::geography, 'Chennai', 5),
  ('Chettinad Vidyashram', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2270, 12.8950), 4326)::geography, 'Chennai', 6),
  ('Maharishi Vidya Mandir', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2420, 13.0700), 4326)::geography, 'Chennai', 6),
  ('Vidya Mandir (Mylapore)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2680, 13.0330), 4326)::geography, 'Chennai', 5),
  ('Sishya School (Adyar)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2550, 13.0050), 4326)::geography, 'Chennai', 5),
  ('The School - KFI (Thiruvanmiyur)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2600, 12.9830), 4326)::geography, 'Chennai', 5),
  ('Bala Vidya Mandir (Adyar)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2550, 13.0080), 4326)::geography, 'Chennai', 5),
  ('Don Bosco (Egmore)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2620, 13.0730), 4326)::geography, 'Chennai', 5),
  ('Good Shepherd (Egmore)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2640, 13.0720), 4326)::geography, 'Chennai', 4),
  ('Rosary Matriculation (Santhome)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2780, 13.0330), 4326)::geography, 'Chennai', 4),
  ('National Public School (Gopalapuram)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2540, 13.0480), 4326)::geography, 'Chennai', 5),
  ('Bharatiya Vidya Bhavan (Kilpauk)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2420, 13.0800), 4326)::geography, 'Chennai', 4),
  ('Church Park Convent', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2600, 13.0600), 4326)::geography, 'Chennai', 4),
  ('Sacred Heart Matriculation', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2450, 13.0350), 4326)::geography, 'Chennai', 4),
  ('Holy Angels School', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2200, 13.0650), 4326)::geography, 'Chennai', 4),
  ('Sri Sankara Senior Secondary (Adyar)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2500, 13.0000), 4326)::geography, 'Chennai', 5),
  ('Chinmaya Vidyalaya (Anna Nagar)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2100, 13.0900), 4326)::geography, 'Chennai', 4),
  ('St. John''s School (Virugambakkam)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1900, 13.0500), 4326)::geography, 'Chennai', 4),
  ('Ramakrishna Mission School (T. Nagar)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2340, 13.0400), 4326)::geography, 'Chennai', 4),
  ('MCC Higher Secondary School (Chetpet)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2450, 13.0680), 4326)::geography, 'Chennai', 4),

  -- Education — Colleges & Universities
  ('IIT Madras', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2337, 12.9915), 4326)::geography, 'Chennai', 10),
  ('Anna University (Guindy)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2350, 13.0108), 4326)::geography, 'Chennai', 8),
  ('Anna University CEG Campus', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2360, 13.0100), 4326)::geography, 'Chennai', 6),
  ('Anna University MIT Campus (Chromepet)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1420, 12.9500), 4326)::geography, 'Chennai', 6),
  ('SRM University (Kattankulathur)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.0440, 12.8230), 4326)::geography, 'Chennai', 8),
  ('VIT Chennai (Kelambakkam)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1534, 12.8406), 4326)::geography, 'Chennai', 7),
  ('Sathyabama University (Sholinganallur)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2210, 12.8720), 4326)::geography, 'Chennai', 7),
  ('Hindustan University (Padur)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2270, 12.8460), 4326)::geography, 'Chennai', 6),
  ('Saveetha University (Thandalam)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.0110, 13.0330), 4326)::geography, 'Chennai', 6),
  ('Loyola College', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2470, 13.0400), 4326)::geography, 'Chennai', 6),
  ('Madras Christian College (Tambaram)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1100, 12.9300), 4326)::geography, 'Chennai', 6),
  ('Stella Maris College', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2620, 13.0450), 4326)::geography, 'Chennai', 5),
  ('Presidency College', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2800, 13.0700), 4326)::geography, 'Chennai', 5),
  ('DG Vaishnav College', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2350, 13.0450), 4326)::geography, 'Chennai', 4),
  ('Ethiraj College', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2600, 13.0680), 4326)::geography, 'Chennai', 4),
  ('Women''s Christian College', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2620, 13.0480), 4326)::geography, 'Chennai', 4),
  ('SSN College of Engineering', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2280, 12.8250), 4326)::geography, 'Chennai', 5),
  ('St. Joseph''s College of Engineering', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2350, 12.9600), 4326)::geography, 'Chennai', 4),
  ('Rajalakshmi Engineering College', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.0100, 13.0050), 4326)::geography, 'Chennai', 4),
  ('B.S. Abdur Rahman University (Vandalur)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.0930, 12.8100), 4326)::geography, 'Chennai', 5),
  ('Sri Ramachandra Medical College (Porur)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1750, 13.0400), 4326)::geography, 'Chennai', 6),
  ('Vels University (Pallavaram)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1450, 12.9800), 4326)::geography, 'Chennai', 4),
  ('Dr. MGR Educational and Research Institute (Maduravoyal)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.1650, 13.0650), 4326)::geography, 'Chennai', 4),
  ('Queen Mary''s College (Marina)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2820, 13.0480), 4326)::geography, 'Chennai', 4),
  ('Madras Medical College (Park Town)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2760, 13.0800), 4326)::geography, 'Chennai', 5),
  ('Stanley Medical College (Old Washermanpet)', 'education', '🎓', ST_SetSRID(ST_MakePoint(80.2870, 13.1120), 4326)::geography, 'Chennai', 4),

  -- Healthcare
  ('Apollo Hospitals (Greams Road)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2570, 13.0620), 4326)::geography, 'Chennai', 9),
  ('Apollo Hospitals (OMR)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2260, 12.8930), 4326)::geography, 'Chennai', 7),
  ('MIOT International (Manapakkam)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.1870, 13.0090), 4326)::geography, 'Chennai', 8),
  ('Global Hospitals (Perumbakkam)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2120, 12.9080), 4326)::geography, 'Chennai', 7),
  ('SIMS Hospital (Vadapalani)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2130, 13.0500), 4326)::geography, 'Chennai', 7),
  ('Kauvery Hospital (Alwarpet)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2530, 13.0330), 4326)::geography, 'Chennai', 7),
  ('Fortis Malar (Adyar)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2570, 13.0070), 4326)::geography, 'Chennai', 7),
  ('MGM Healthcare (Aminjikarai)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2260, 13.0730), 4326)::geography, 'Chennai', 6),
  ('Sri Ramachandra Medical Centre (Porur)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.1750, 13.0400), 4326)::geography, 'Chennai', 6),
  ('Rela Institute (Chromepet)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.1400, 12.9550), 4326)::geography, 'Chennai', 6),
  ('Gleneagles Global Health City (Perumbakkam)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2100, 12.9100), 4326)::geography, 'Chennai', 6),
  ('Vijaya Hospital (Vadapalani)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2100, 13.0520), 4326)::geography, 'Chennai', 5),
  ('Billroth Hospitals', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2400, 13.0600), 4326)::geography, 'Chennai', 5),
  ('Frontier Lifeline Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2280, 13.0950), 4326)::geography, 'Chennai', 5),
  ('Dr. Kamakshi Memorial Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2270, 12.9650), 4326)::geography, 'Chennai', 5),
  ('Chettinad Hospital (Kelambakkam)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.1550, 12.7950), 4326)::geography, 'Chennai', 5),
  ('Government General Hospital (Rajiv Gandhi GH)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2750, 13.0830), 4326)::geography, 'Chennai', 6),
  ('Stanley Medical Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2870, 13.1120), 4326)::geography, 'Chennai', 5),
  ('Sundaram Medical Foundation (Shenoy Nagar)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2300, 13.0850), 4326)::geography, 'Chennai', 4),
  ('Prashanth Hospitals', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2150, 13.0530), 4326)::geography, 'Chennai', 4),
  ('Kanchi Kamakoti CHILDS Trust Hospital (Nungambakkam)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2420, 13.0600), 4326)::geography, 'Chennai', 5),
  ('Voluntary Health Services (Adyar)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2450, 12.9950), 4326)::geography, 'Chennai', 4),
  ('Apollo Children''s Hospital', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2600, 13.0700), 4326)::geography, 'Chennai', 5),
  ('Madras ENT Research Foundation (Chetpet)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2450, 13.0700), 4326)::geography, 'Chennai', 4),
  ('Sankara Nethralaya (College Road)', 'healthcare', '🏥', ST_SetSRID(ST_MakePoint(80.2570, 13.0600), 4326)::geography, 'Chennai', 6),

  -- Lifestyle & Shopping
  ('Phoenix MarketCity (Velachery)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2180, 12.9910), 4326)::geography, 'Chennai', 8),
  ('VR Chennai (Anna Nagar)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2170, 13.0870), 4326)::geography, 'Chennai', 8),
  ('Express Avenue (Royapettah)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2610, 13.0580), 4326)::geography, 'Chennai', 7),
  ('Nexus Vijaya Mall (Vadapalani)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2120, 13.0500), 4326)::geography, 'Chennai', 6),
  ('Grand Square Mall (Nolambur)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.1600, 13.0800), 4326)::geography, 'Chennai', 5),
  ('Ampa Skywalk (Aminjikarai)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2260, 13.0750), 4326)::geography, 'Chennai', 5),
  ('Chennai Citi Centre (Mylapore)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2620, 13.0400), 4326)::geography, 'Chennai', 5),
  ('Spencer Plaza (Anna Salai)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2650, 13.0620), 4326)::geography, 'Chennai', 5),
  ('Palazzo Mall (Manapakkam)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.1850, 13.0100), 4326)::geography, 'Chennai', 4),
  ('Park Square Mall (Taramani)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2440, 12.9870), 4326)::geography, 'Chennai', 4),
  ('Marina Mall (Egmore)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2500, 13.0700), 4326)::geography, 'Chennai', 4),
  ('Prince Plaza (T. Nagar)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.2330, 13.0410), 4326)::geography, 'Chennai', 4),
  ('Bharat Mall (Pallavaram)', 'shopping', '🛍', ST_SetSRID(ST_MakePoint(80.1500, 12.9650), 4326)::geography, 'Chennai', 4),

  -- Recreation
  ('Marina Beach', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2824, 13.0500), 4326)::geography, 'Chennai', 8),
  ('Elliot''s Beach', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2670, 13.0000), 4326)::geography, 'Chennai', 7),
  ('Pallikaranai Marsh', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2130, 12.9370), 4326)::geography, 'Chennai', 6),
  ('Guindy National Park', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2350, 13.0100), 4326)::geography, 'Chennai', 6),
  ('Semmozhi Poonga', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2540, 13.0490), 4326)::geography, 'Chennai', 5),
  ('Vandalur Zoo (Arignar Anna Zoological Park)', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.0810, 12.8830), 4326)::geography, 'Chennai', 6),
  ('MGM Dizzee World', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2350, 12.8700), 4326)::geography, 'Chennai', 5),
  ('VGP Universal Kingdom', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2550, 12.9250), 4326)::geography, 'Chennai', 4),
  ('Kishkinta', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.1400, 12.9100), 4326)::geography, 'Chennai', 4),
  ('Cholamandal Artists Village', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2500, 12.8950), 4326)::geography, 'Chennai', 3),
  ('Muttukadu Boat House', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2500, 12.8150), 4326)::geography, 'Chennai', 4),
  ('DakshinaChitra', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2450, 12.8300), 4326)::geography, 'Chennai', 4),
  ('Madras Crocodile Bank (ECR)', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2470, 12.8350), 4326)::geography, 'Chennai', 4),
  ('Anna Nagar Tower Park', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2130, 13.0850), 4326)::geography, 'Chennai', 4),
  ('Guindy Snake Park', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2330, 13.0090), 4326)::geography, 'Chennai', 4),
  ('Birla Planetarium (Kotturpuram)', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2440, 13.0180), 4326)::geography, 'Chennai', 4),
  ('Government Museum (Egmore)', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2600, 13.0700), 4326)::geography, 'Chennai', 4),
  ('Kalakshetra Foundation (Thiruvanmiyur)', 'recreation', '🌳', ST_SetSRID(ST_MakePoint(80.2560, 12.9950), 4326)::geography, 'Chennai', 3),

  -- Government & Civic
  ('Chennai Collector Office', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2825, 13.0836), 4326)::geography, 'Chennai', 4),
  ('Chennai Corporation Office (Ripon Building)', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2785, 13.0878), 4326)::geography, 'Chennai', 4),
  ('Tambaram Sub-Registrar Office', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.1170, 12.9246), 4326)::geography, 'Chennai', 4),
  ('Chengalpattu Collectorate', 'civic', '🏛', ST_SetSRID(ST_MakePoint(79.9800, 12.6920), 4326)::geography, 'Chennai', 3),
  ('Kancheepuram Collectorate', 'civic', '🏛', ST_SetSRID(ST_MakePoint(79.7150, 12.8350), 4326)::geography, 'Chennai', 3),
  ('RTO Chennai Central (Ayanavaram)', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2280, 13.0950), 4326)::geography, 'Chennai', 3),
  ('Chennai General Post Office (Anna Salai)', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2870, 13.0930), 4326)::geography, 'Chennai', 3),
  ('Income Tax Office (Nungambakkam)', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2450, 13.0620), 4326)::geography, 'Chennai', 3),
  ('Chennai City Civil Court', 'civic', '🏛', ST_SetSRID(ST_MakePoint(80.2870, 13.0900), 4326)::geography, 'Chennai', 3);


-- ============================================================
-- ONE-TIME BACKFILL — computes landmarks for listings that already
-- existed before this migration ran (new listings get this from the
-- trigger automatically going forward).
-- ============================================================

select public.sync_listing_landmarks('plot', id, lat, lng) from public.plots;
select public.sync_listing_landmarks('layout', id, lat, lng) from public.layouts;
