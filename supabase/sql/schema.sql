-- Ploty — Phase 1 schema
-- Run this whole file in Supabase SQL Editor (Project > SQL Editor > New query > Run)

create extension if not exists pgcrypto;
-- postgis already enabled via dashboard

-- ============================================================
-- PROFILES — extends auth.users with app-specific fields
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are self-updatable"
  on public.profiles for update
  using (auth.uid() = id);

-- auto-create a profile row whenever someone signs up via Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- AMENITIES — shared, growing master list
-- ============================================================

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- case-insensitive uniqueness: "cricket net" and "Cricket Net" are the same row
create unique index amenities_name_ci_idx on public.amenities (lower(name));

alter table public.amenities enable row level security;

create policy "amenities are publicly readable"
  on public.amenities for select
  using (true);

create policy "authenticated users can add new amenities"
  on public.amenities for insert
  to authenticated
  with check (true);

insert into public.amenities (name) values
  ('Water Connection'), ('EB Connection'), ('Drainage'), ('Tar Road'),
  ('Compound Wall'), ('Corner Plot'), ('Gated Layout'), ('Park Nearby'),
  ('Streetlights'), ('Sewage Line');


-- ============================================================
-- PLOTS — individual listings, instant-publish, no review gate
-- ============================================================

create table public.plots (
  id uuid primary key default gen_random_uuid(),
  locality text not null,
  city text not null,
  area text not null,
  landmark text,
  notes text,
  owner text,
  contact text,
  location geography(point, 4326) not null,
  lat double precision generated always as (ST_Y(location::geometry)) stored,
  lng double precision generated always as (ST_X(location::geometry)) stored,
  sqft numeric not null,
  ppsf numeric not null,
  amenity_count integer,
  submitted_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index plots_location_idx on public.plots using gist (location);
create index plots_city_area_idx on public.plots (city, area);

alter table public.plots enable row level security;

create policy "plots are publicly readable"
  on public.plots for select
  using (true);

create policy "authenticated users can publish plots"
  on public.plots for insert
  to authenticated
  with check (auth.uid() = submitted_by);

create policy "owners can update their own plots"
  on public.plots for update
  to authenticated
  using (auth.uid() = submitted_by);


-- ============================================================
-- LAYOUTS — developer listings, reviewed path
-- ============================================================

create table public.layouts (
  id uuid primary key default gen_random_uuid(),
  locality text not null,
  city text not null,
  area text not null,
  landmark text,
  notes text,
  owner text,          -- developer / company name
  contact text,
  location geography(point, 4326) not null,
  lat double precision generated always as (ST_Y(location::geometry)) stored,
  lng double precision generated always as (ST_X(location::geometry)) stored,
  plot_count integer not null,
  size_min numeric not null,
  size_max numeric not null,
  ppsf_min numeric not null,
  ppsf_max numeric not null,
  approval_number text,
  amenity_count integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index layouts_location_idx on public.layouts using gist (location);
create index layouts_status_idx on public.layouts (status);

alter table public.layouts enable row level security;

create policy "approved layouts are publicly readable"
  on public.layouts for select
  using (status = 'approved');

create policy "staff can read all layouts"
  on public.layouts for select
  to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'staff'
  ));

create policy "authenticated users can submit layouts"
  on public.layouts for insert
  to authenticated
  with check (auth.uid() = submitted_by and status = 'pending');

create policy "staff can update layout status"
  on public.layouts for update
  to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'staff'
  ));

create policy "owners can update their own layouts"
  on public.layouts for update
  to authenticated
  using (auth.uid() = submitted_by);


-- ============================================================
-- MEDIA — photos/videos, shared across plots and layouts
-- ============================================================

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('plot', 'layout')),
  owner_id uuid not null,
  storage_path text not null,
  type text not null check (type in ('photo', 'video')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index media_owner_idx on public.media (owner_type, owner_id);

alter table public.media enable row level security;

create policy "media is publicly readable"
  on public.media for select
  using (true);

create policy "owners can attach media to their own plots"
  on public.media for insert
  to authenticated
  with check (
    (owner_type = 'plot' and exists (
      select 1 from public.plots where plots.id = owner_id and plots.submitted_by = auth.uid()
    ))
    or
    (owner_type = 'layout' and exists (
      select 1 from public.layouts where layouts.id = owner_id and layouts.submitted_by = auth.uid()
    ))
  );


-- ============================================================
-- LISTING_AMENITIES — join table
-- ============================================================

create table public.listing_amenities (
  owner_type text not null check (owner_type in ('plot', 'layout')),
  owner_id uuid not null,
  amenity_id uuid not null references public.amenities(id),
  primary key (owner_type, owner_id, amenity_id)
);

create index listing_amenities_owner_idx on public.listing_amenities (owner_type, owner_id);

alter table public.listing_amenities enable row level security;

create policy "listing amenities are publicly readable"
  on public.listing_amenities for select
  using (true);

create policy "owners can tag amenities on their own listings"
  on public.listing_amenities for insert
  to authenticated
  with check (
    (owner_type = 'plot' and exists (
      select 1 from public.plots where plots.id = owner_id and plots.submitted_by = auth.uid()
    ))
    or
    (owner_type = 'layout' and exists (
      select 1 from public.layouts where layouts.id = owner_id and layouts.submitted_by = auth.uid()
    ))
  );


-- ============================================================
-- FAVORITES
-- ============================================================

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text not null check (listing_type in ('plot', 'layout')),
  listing_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_type, listing_id)
);

alter table public.favorites enable row level security;

create policy "users manage their own favorites"
  on public.favorites for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- MANUAL STEP — after running this file:
-- Set yourself as staff so you can test the review queue.
-- Replace the email with whatever you sign up with, then run
-- this UPDATE separately (not part of the block above):
--
-- update public.profiles set role = 'staff'
-- where id = (select id from auth.users where phone = '+91XXXXXXXXXX');
-- ============================================================
