# Task: accessibility-aware campus navigation map

Add a map screen to this React app that shows an accessibility-scored pedestrian network for the Thapar campus (Patiala) and routes between places for wheelchair, blind and walker users. All data is already in our Supabase project; this app only **reads** it.

Match the existing stack and conventions of this repo (framework, router, styling, state, data fetching). If there is no map library yet, use `maplibre-gl` with `react-map-gl/maplibre`.

## Setup
- Env (public values only): the Supabase URL and the **anon** key. Use whatever env names this repo already uses (Vite: `VITE_SUPABASE_*`, Next: `NEXT_PUBLIC_SUPABASE_*`). Reuse the existing Supabase client if there is one. Never use or ask for a service-role key; this feature does no writes.
- Copy `accessibility-types.ts` into `src/lib/` (shared types and constants: `CITY = "patiala"`, `CAMPUS_CENTER`).

## Data you can call (already deployed)
All calls use `supabase.rpc(...)` with the anon key:
1. `network_geojson({ p_city: "patiala" })` returns a GeoJSON `FeatureCollection` of `LineString` path segments. Feature `properties` is typed as `PathProps`. Geometry is lon/lat.
2. `places_list({ p_city: "patiala" })` returns `PlaceRow[]` with plain `lon`/`lat`. (`places_list` comes from `places.sql`, which I run once in Supabase. If the call errors with "function not found", tell me instead of working around it.)
3. `route_between_places({ p_city, p_from, p_to, p_mode })` returns `RouteLeg[]`. `p_from`/`p_to` are `PlaceRow.external_id`. `p_mode` is `"standard" | "wheelchair" | "blind" | "walker"`. An empty array means **no accessible route exists**. Legs are ordered by `seq`. Sum `length_m` for the total distance.

Do not query the `places` table directly for coordinates: its `geom` column comes back as hex WKB, not usable lon/lat.

## UI requirements
1. **Map** centred on `CAMPUS_CENTER` (zoom ~16). Basemap toggle: a street style (e.g. CARTO Voyager `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`) and a satellite raster option (Esri World Imagery `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`, with Esri attribution).
2. **Network layer:** draw path segments, excluding `is_connector` features from popups and legends. Colour by the selected mode's score (`score_wheelchair` / `score_blind` / `score_walker`): red below 40, amber 40-74, green 75+. Segments with `has_steps` are dashed. Dim anything with `confidence < 0.5`.
3. **Mode selector** (wheelchair / blind / walker / standard) that recolours the network and is passed as `p_mode` to routing.
4. **Places:** markers from `places_list` with name labels. Places with `routable === false` are shown greyed and cannot be picked as route endpoints.
5. **Route panel:** two searchable dropdowns (from / to, filtered by name), a swap button, a "Find route" action. Draw the returned legs as one thick highlighted line above the network. Show total distance in metres (rounded) and the number of legs. Fit the map to the route. If the result is empty, show a clear "No accessible route for this mode" message; do not treat it as an error.
6. **Segment popup** on click: kind, surface, width, steps, kerb ramp, tactile paving, obstruction, the three scores, length. Show "Unknown" rather than hiding unknown values.
7. **Legend** explaining the score colours and the dashed (steps) style.
8. **Disclaimer, always visible:** every row has `label = "ai_estimate"`. Show a persistent notice such as "Accessibility data is estimated from satellite imagery and may be wrong. Verify on site." Never present scores as surveyed fact.
9. Loading and error states for each of the three calls. Fetch the network and places once and cache them (the data changes only when I re-run the pipeline). Responsive on mobile, keyboard-accessible controls, and colours must not be the only signal (use dashes/labels/popup text too).

## Edge cases to handle
- Network may be small or sparse right now (it is a work in progress); render gracefully with few or zero features.
- Cost `>= 999999` (`BLOCKED_COST`) means blocked for that mode; the SQL already excludes blocked segments from routing, so just don't recommend them.
- A route request must not fire when from or to is missing or both are the same place.
- Do not hardcode place ids; always read them from `places_list`.

## Out of scope
No writes to Supabase, no auth, no pipeline or SQL changes, no geocoding or live GPS (a possible later step).

## Acceptance
- `tsc` / lint pass and the app builds.
- With the current data, the map renders coloured segments and place markers, switching mode recolours the network, and picking two routable places draws a route or shows the no-route message.
- Brief summary of what was added and where.
