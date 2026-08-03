-- Adds an RPC function for the 12m duplicate-pin check.
-- ST_DWithin can't be called directly through the REST API — it needs
-- a Postgres function wrapping it, exposed as an RPC.
--
-- Run this in the SQL Editor (schema.sql already ran; this is additive).

create or replace function public.nearby_plots(p_lat double precision, p_lng double precision, p_radius_m integer default 12)
returns table(id uuid, locality text, distance_m double precision)
language sql
stable
as $$
  select
    plots.id,
    plots.locality,
    ST_Distance(plots.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) as distance_m
  from public.plots
  where ST_DWithin(plots.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  order by distance_m asc;
$$;

grant execute on function public.nearby_plots(double precision, double precision, integer) to authenticated;
