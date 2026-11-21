-- Run AFTER seed.sql. Enable the pgrouting extension first (Database -> Extensions, or the line below).
create extension if not exists pgrouting;

create or replace function route_between_places(p_city text, p_from text, p_to text, p_mode text)
returns table (seq int, external_id text, length_m double precision, geojson jsonb)
language plpgsql stable as $$
declare s int; t int; col text;
begin
  if p_mode not in ('standard','wheelchair','blind','walker') then raise exception 'bad mode'; end if;
  col := 'cost_' || p_mode;
  select node_id into s from gates where place_external_id = p_from and node_id is not null limit 1;
  select node_id into t from gates where place_external_id = p_to   and node_id is not null limit 1;
  return query
    select r.seq, e.external_id, e.length_m, st_asgeojson(e.geom::geometry)::jsonb
    from pgr_dijkstra(
           format('select id, source, target, %1$I as cost, %1$I as reverse_cost
                   from path_segments where city = %2$L and %1$I < 999999', col, p_city),
           s, t, false) r
    join path_segments e on e.id = r.edge
    order by r.seq;
end $$;

create or replace function network_geojson(p_city text) returns jsonb language sql stable as $$
  select jsonb_build_object('type','FeatureCollection','features', coalesce(jsonb_agg(
    jsonb_build_object('type','Feature','geometry', st_asgeojson(geom::geometry)::jsonb,
      'properties', to_jsonb(p) - 'geom')), '[]'::jsonb))
  from path_segments p where city = p_city;
$$;

-- Browser (anon key) is read-only. Writes happen only with the service-role key.
alter table places enable row level security;
alter table gates enable row level security;
alter table path_segments enable row level security;
create policy "public read" on places for select using (true);
create policy "public read" on gates for select using (true);
create policy "public read" on path_segments for select using (true);
