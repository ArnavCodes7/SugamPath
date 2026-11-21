-- Run once in the Supabase SQL editor (after seed.sql and routing.sql).
-- PostgREST returns geography columns as hex WKB, so the app gets plain lon/lat from this function instead.
create or replace function places_list(p_city text)
returns table (
  external_id text, name text, place_type text, step_free text, ramp_present text,
  confidence real, lon double precision, lat double precision, routable boolean
)
language sql stable as $$
  select p.external_id, p.name, p.place_type, p.step_free, p.ramp_present, p.confidence,
         st_x(p.geom::geometry), st_y(p.geom::geometry),
         exists (select 1 from gates g where g.place_external_id = p.external_id and g.node_id is not null)
  from places p
  where p.city = p_city
  order by p.name;
$$;
