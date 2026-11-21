export type TravelMode = 'wheelchair' | 'blind' | 'walker' | 'standard';

export type LanguageCode = 'en' | 'hi' | 'pa';

export type UserRole = 'traveller' | 'auditor';

export interface UserProfile {
  onboarded: boolean;
  role: UserRole;
  language: LanguageCode;
  mode: TravelMode;
  city: CitySlug;
  bigText: boolean;
  xlText?: boolean;
  voiceEnabled: boolean;
  highContrast: boolean;
  visualOnly?: boolean;
  /** Person alerted by SOS / fall detection. Stored on this device only. */
  emergencyContact?: { name: string; phone: string } | null;
  /** Share anonymous surface readings (smooth / rough / stairs) while walking. Default on. */
  passiveMapping?: boolean;
}

export type VerificationLabel = 'verified' | 'ai_estimate' | 'not_verified' | 'unrated';

export type DataSourceTag = 'Team audit' | 'Contributor' | 'AI estimate' | 'Sample data' | 'GTFS' | 'OpenStreetMap';

export type CitySlug = 'new-delhi' | 'chandigarh' | 'patiala';

export type PlaceType =
  | 'railway_station'
  | 'bus_stand'
  | 'bus_stop'
  | 'metro_station'
  | 'hospital'
  | 'market'
  | 'college';

export type IssueCategory =
  | 'no_ramp'
  | 'broken_lift'
  | 'blocked_tactile'
  | 'missing_tactile'
  | 'steep_ramp'
  | 'obstruction'
  | 'open_drain'
  | 'no_low_floor_bus'
  | 'other';

export type IssueStatus = 'open' | 'acknowledged' | 'fixed' | 'wont_fix';

export type TriState = 'yes' | 'no' | 'unknown';
export type StepFreeState = 'yes' | 'partial' | 'no' | 'unknown';
export type RampSlopeState = 'gentle' | 'moderate' | 'steep' | 'unknown';
export type DoorWidthState = 'wide' | 'standard' | 'narrow' | 'unknown';
export type SurfaceState = 'smooth' | 'rough' | 'broken' | 'unpaved' | 'unknown';
export type TactilePresence = 'yes' | 'partial' | 'no' | 'unknown';
export type TactileCondition = 'intact' | 'broken' | 'blocked' | 'unknown';

export interface ObstructionFinding {
  type: 'parked_vehicle' | 'vendor' | 'construction' | 'open_drain' | 'pole' | 'garbage' | 'other';
  severity: 'minor' | 'major';
}

export interface AuditFindings {
  subject: 'gate' | 'footpath' | 'crossing' | 'bus_stop' | 'other';
  scene: string;
  image_quality: 'good' | 'poor' | 'unusable';
  step_free_access: StepFreeState;
  steps_count_estimate: number | null;
  ramp: {
    present: TriState;
    slope: RampSlopeState;
    handrail: TriState;
  };
  lift: {
    present: TriState;
    working: TriState;
  };
  doorway_width: DoorWidthState;
  surface: SurfaceState;
  kerb_ramp: 'present' | 'absent' | 'unknown';
  tactile_paving: {
    present: TactilePresence;
    condition: TactileCondition;
  };
  obstructions: ObstructionFinding[];
  crossing_signal: 'none' | 'signal' | 'audible_signal' | 'unknown';
  open_drain_adjacent: boolean;
  ai_confidence: number;
  uncertainty_notes: string;
}

export interface Gate {
  id: string;
  place_id: string;
  name: string;
  kind: 'main_entrance' | 'side_entrance' | 'platform_access' | 'parking';
  step_free: StepFreeState;
  ramp_present: TriState;
  ramp_slope: RampSlopeState;
  lift_present: TriState;
  lift_working: TriState;
  steps_count: number | null;
  door_width: DoorWidthState;
  tactile_paving: TactilePresence;
  score_wheelchair: number;
  score_blind: number;
  score_walker: number;
  confidence: number;
  label: VerificationLabel;
  source: DataSourceTag;
  confirmations: number;
  disputes: number;
  last_checked: string;
  proof_photo?: string;
  proof_alt?: string;
  map_offset: { x: number; y: number };
}

export interface BusRouteInfo {
  id: string;
  city: CitySlug;
  route_no: string;
  name: string;
  agency: string;
  stop_name: string;
  wheelchair_accessible: 'yes' | 'some' | 'no' | 'unknown';
  source: 'GTFS' | 'Sample data';
  frequency_min: number;
}

export interface ExtractedReviewTag {
  id: string;
  gate_reference: string;
  topic: 'ramp' | 'lift' | 'steps' | 'tactile' | 'toilet' | 'bus' | 'parking' | 'staff_help' | 'other';
  polarity: 'positive' | 'negative' | 'neutral';
  claim: string;
  confidence: number;
}

export interface PlaceReview {
  id: string;
  place_id: string;
  author_label: string;
  source: 'User review' | 'Sample review';
  language: 'en' | 'hi' | 'pa' | 'mixed';
  text: string;
  created_at: string;
  tags: ExtractedReviewTag[];
}

export interface Place {
  id: string;
  city: CitySlug;
  city_name: string;
  type: PlaceType;
  name: string;
  name_hi: string;
  name_pa: string;
  address: string;
  lat: number;
  lng: number;
  map_pos: { x: number; y: number };
  score_wheelchair: number | null;
  score_blind: number | null;
  score_walker: number | null;
  confidence: number;
  label: VerificationLabel;
  source: DataSourceTag;
  last_audited_at: string;
  summary: string;
  gates: Gate[];
  nearby_buses: BusRouteInfo[];
  reviews: PlaceReview[];
}

export interface IssueEvent {
  id: string;
  type: 'status_change' | 'note' | 'created';
  actor: string;
  timestamp: string;
  old_status?: IssueStatus;
  new_status?: IssueStatus;
  note: string;
}

export interface AuditIssue {
  id: string;
  city: CitySlug;
  city_name: string;
  place_id: string;
  place_name: string;
  gate_id?: string;
  gate_name?: string;
  target_type: 'gate' | 'path_segment' | 'bus_stop' | 'place';
  category: IssueCategory;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: IssueStatus;
  affected_daily_commuters: number;
  confirmations: number;
  disputes: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  map_pos: { x: number; y: number };
  proof_photo?: string;
  proof_alt?: string;
  provider: 'Gemini' | 'Groq';
  model: string;
  prompt_version: string;
  processing_ms: number;
  label: VerificationLabel;
  source: DataSourceTag;
  findings: AuditFindings;
  events: IssueEvent[];
}

export interface PathSegmentMap {
  id: string;
  city: CitySlug;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score_wheelchair: number;
  score_blind: number;
  score_walker: number;
  has_steps: boolean;
  audited: boolean;
}

export interface RouteOption {
  kind: 'standard' | 'accessible';
  label: string;
  gate_chosen: string;
  distance_m: number;
  duration_min: number;
  stairs_count: number;
  steepest_slope_pct: number;
  tactile_coverage_pct: number;
  audited_pct: number;
  warnings: string[];
  points: Array<{ x: number; y: number }>;
  unaudited_segments?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  steps: Array<{
    id: string;
    type: 'walk' | 'cross' | 'enter_gate' | 'use_lift' | 'use_ramp' | 'warning';
    instruction: string;
    distance_m: number;
    warning?: string;
    audited: boolean;
  }>;
}

export interface DemoRoutePair {
  id: string;
  city: CitySlug;
  city_name: string;
  title: string;
  start_label: string;
  end_label: string;
  place_id: string;
  comparison_summary: Record<TravelMode, string>;
  routes: Record<TravelMode, { standard: RouteOption; accessible: RouteOption }>;
}

export interface AuditQueueRecord {
  id: string;
  city: CitySlug;
  place_name: string;
  target_label: string;
  subject: AuditFindings['subject'];
  status: 'done' | 'processing' | 'pending' | 'failed';
  provider: 'Gemini' | 'Groq' | 'Queued';
  model: string;
  prompt_version: string;
  processing_ms: number;
  cache_hit: boolean;
  sha256_short: string;
  created_at: string;
  photo: string;
  photo_alt: string;
  findings: AuditFindings;
}
