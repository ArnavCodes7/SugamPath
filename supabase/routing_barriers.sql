-- Barrier- and tactile-aware routing for the campus network.
-- Same signature as the original route_between_places, so the app calls it unchanged.
--
-- Rollback (original body):
--   select ... from pgr_dijkstra(format('select id, source, target, %1$I as cost, %1$I as reverse_cost
--     from path_segments where city = %2$L and %1$I < 999999', col, p_city), s, t, false) ...

-- Each annotation snapped to the segment it sits on: its linked edge if that exists,
-- otherwise the nearest non-connector segment within 8 m.
create or replace function barrier_edges(p_city text)
returns table (segment_id bigint, blocks_wheelchair boolean, barrier_type text)
language sql stable as $$
  select seg.id, bool_or(a.blocks = 'wheelchair'), min(a.type)
  from annotations a
  cross join lateral (
    select s.id
    from path_segments s
    where s.city = a.city
      and (s.external_id = a.edge_external_id
           or (not s.is_connector and st_dwithin(s.geom, a.geom, 8)))
    order by (s.external_id = a.edge_external_id) desc, s.geom <-> a.geom
    limit 1
  ) seg
  where a.city = p_city and a.blocks <> 'none'
  group by seg.id;
$$;

-- Barriers with plain lon/lat for the map (geography comes back as WKB through PostgREST).
create or replace function annotations_list(p_city text)
returns table (external_id text, type text, blocks text, note text, lon double precision, lat double precision,
               segment_external_id text)
language sql stable as $$
  select a.external_id, a.type, a.blocks, a.note,
         st_x(a.geom::geometry), st_y(a.geom::geometry),
         (select s.external_id from path_segments s
           where s.city = a.city
             and (s.external_id = a.edge_external_id
                  or (not s.is_connector and st_dwithin(s.geom, a.geom, 8)))
           order by (s.external_id = a.edge_external_id) desc, s.geom <-> a.geom
           limit 1)
  from annotations a
  where a.city = p_city;
$$;

create or replace function route_between_places(p_city text, p_from text, p_to text, p_mode text)
returns table (seq integer, external_id text, length_m double precision, geojson jsonb)
language plpgsql stable as $function$
declare s int; t int; col text;
begin
  if p_mode not in ('standard','wheelchair','blind','walker') then raise exception 'bad mode'; end if;
  col := 'cost_' || p_mode;
  select node_id into s from gates where place_external_id = p_from and node_id is not null limit 1;
  select node_id into t from gates where place_external_id = p_to   and node_id is not null limit 1;
  if s is null or t is null or s = t then return; end if;

  return query
    select r.seq, e.external_id, e.length_m, st_asgeojson(e.geom::geometry)::jsonb
    from pgr_dijkstra(
      format($q$
        select id, source, target, c as cost, c as reverse_cost from (
          select e.id, e.source, e.target,
            case
              -- Wheelchair: any barrier/steps/ramp annotation that blocks wheelchairs removes the edge.
              when %3$L = 'wheelchair' and coalesce(b.blocks_wheelchair, false) then 999999
              -- Blind: strongly prefer tactile paving, dedicated pedestrian ways, audible crossings.
              when %3$L = 'blind' then e.%1$I
                * case e.tactile_paving when 'yes' then 0.5 when 'partial' then 0.75 else 1 end
                * case when e.kind in ('footway','pedestrian','path') then 0.9
                       when e.kind in ('residential','service') then 1.3 else 1 end
                * case when e.kind = 'crossing' then
                         case e.signal when 'audible_signal' then 0.7 when 'none' then 1.5 else 1 end
                       else 1 end
                * case when b.segment_id is not null then 2 else 1 end
              -- Walker: barriers are passable but costly.
              when %3$L = 'walker' and b.segment_id is not null then e.%1$I * 3
              else e.%1$I
            end as c
          from path_segments e
          left join barrier_edges(%2$L) b on b.segment_id = e.id
          where e.city = %2$L
        ) x where c < 999999
      $q$, col, p_city, p_mode),
      s, t, false) r
    join path_segments e on e.id = r.edge
    order by r.seq;
end $function$;

grant execute on function barrier_edges(text), annotations_list(text), route_between_places(text,text,text,text) to anon, authenticated;
