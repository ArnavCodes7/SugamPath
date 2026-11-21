// Shared types for the safety layer: hazards, live trips, SOS, surface sensing.

export interface EmergencyContact {
  name: string;
  phone: string; // digits with optional leading +
}

export type HazardTier = 'structural' | 'maintenance' | 'transient';

export type HazardKind =
  | 'stairs'
  | 'no_ramp'
  | 'rough_surface'
  | 'broken_lift'
  | 'blocked_path'
  | 'vendor'
  | 'parked_vehicle'
  | 'other';

export type HazardSource = 'pocket-pulse' | 'arrival-check' | 'whats-ahead' | 'voice' | 'seed';

export interface Hazard {
  id: string;
  placeId: string;
  /** Matches RouteOption.gate_chosen / Gate.name so the router can attach it to a route. */
  gateName: string;
  kind: HazardKind;
  tier: HazardTier;
  source: HazardSource;
  /** Every time someone reports/confirms this hazard (epoch ms). */
  reports: number[];
}

export type HazardStatus = 'standing' | 'live' | 'peak';

export interface ActiveHazard extends Hazard {
  status: HazardStatus;
  lastReportedAt: number;
  /** Epoch ms when a transient/maintenance hazard clears itself. null = never. */
  expiresAt: number | null;
  /** Repeated evening reports detected. */
  peakHour: boolean;
}

export type SurfaceKind = 'stairs' | 'rough' | 'smooth';

export interface SurfaceSample {
  t: number;
  kind: SurfaceKind;
  confidence: number;
  lat: number | null;
  lng: number | null;
  placeId?: string;
}

export type TripStatus = 'walking' | 'arrived' | 'ended' | 'sos';

export interface GeoFix {
  lat: number;
  lng: number;
  accuracy: number | null;
  t: number;
}

export interface SosEvent {
  kind: 'manual' | 'fall';
  at: number;
  position: GeoFix | null;
  battery: number | null;
  resolvedAt?: number;
}

/** What the caregiver's /track/<token> page renders. */
export interface TripState {
  token: string;
  createdAt: number;
  updatedAt: number;
  language: 'en' | 'hi' | 'pa';
  travellerLabel: string;
  placeName: string;
  gateName: string;
  routeTitle: string;
  totalSteps: number;
  stepIndex: number;
  currentInstruction: string;
  status: TripStatus;
  position: GeoFix | null;
  battery: number | null;
  cautions: string[];
  contactName?: string;
  sos?: SosEvent;
}

export interface ArrivalCheckInput {
  placeId: string;
  gateName: string;
  stepFree: boolean;
  at: number;
}

/** What the "What's ahead?" endpoint returns. */
export interface SurroundingsResult {
  guidance: string;
  hazard?: { kind: HazardKind; side?: 'left' | 'right' | 'ahead' };
}

/** A route step as stored for offline use. */
export interface CachedStep {
  id: string;
  instruction: string;
  distance_m: number;
  /** Compass bearing (degrees, 0 = north) of the path for this step, if known. */
  bearing: number | null;
}

/** Everything needed to keep guiding with no network. */
export interface ActiveTrip {
  token: string;
  startedAt: number;
  placeId: string;
  placeName: string;
  routeId: string;
  gateName: string;
  language: 'en' | 'hi' | 'pa';
  steps: CachedStep[];
  stepIndex: number;
  /** Final target bearing from route start, for "where is the gate". */
  gateBearing: number | null;
  cautions: string[];
  contact: EmergencyContact | null;
}
