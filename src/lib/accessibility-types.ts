// Types for the Supabase data produced by sat-osm-builder. Copy to src/lib/accessibility-types.ts.
export type Mode = "standard" | "wheelchair" | "blind" | "walker";
export type StepFree = "yes" | "partial" | "no" | "unknown";

/** Return row of rpc("places_list", { p_city }). */
export interface PlaceRow {
  external_id: string;
  name: string;
  place_type: "hospital" | "college" | "park" | "government" | "railway_station" | "bus_stop" | "commercial" | "other";
  step_free: StepFree;
  ramp_present: "yes" | "no" | "unknown";
  confidence: number;
  lon: number;
  lat: number;
  /** false = place has no connected gate, so it cannot be a route start/end. */
  routable: boolean;
}

/** Properties of each feature in rpc("network_geojson", { p_city }). */
export interface PathProps {
  id: number;
  external_id: string;
  city: string;
  source: number;
  target: number;
  length_m: number;
  kind: "footway" | "path" | "pedestrian" | "steps" | "crossing" | "service" | "residential";
  surface: "smooth" | "rough" | "broken" | "unpaved" | "unknown";
  has_steps: boolean;
  kerb_ramp: "present" | "absent" | "unknown";
  tactile_paving: "yes" | "partial" | "no" | "unknown";
  obstruction: "none" | "some" | "severe" | "unknown";
  width_m: number | null;
  signal: "none" | "signal" | "audible_signal" | "unknown";
  score_wheelchair: number; // 0-100
  score_blind: number;
  score_walker: number;
  cost_standard: number;
  cost_wheelchair: number; // 999999 = blocked
  cost_blind: number;
  cost_walker: number;
  confidence: number;
  is_connector: boolean; // synthetic gate->path link, hide from feature lists
  label: "ai_estimate";
}
export type NetworkGeoJson = GeoJSON.FeatureCollection<GeoJSON.LineString, PathProps>;

/** Return row of rpc("route_between_places", { p_city, p_from, p_to, p_mode }). Empty array = no accessible route. */
export interface RouteLeg {
  seq: number;
  external_id: string;
  length_m: number;
  geojson: GeoJSON.LineString;
}

export const BLOCKED_COST = 999999;
export const CITY = "patiala";
export const CAMPUS_CENTER: [number, number] = [76.3665, 30.3565]; // [lon, lat]
