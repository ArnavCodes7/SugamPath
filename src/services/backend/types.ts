import type {
  ArrivalCheckInput,
  HazardKind,
  HazardSource,
  SosEvent,
  SurfaceSample,
  SurroundingsResult,
  TripState,
} from '../../types/safety';

export interface HazardReport {
  placeId: string;
  gateName: string;
  kind: HazardKind;
  source: HazardSource;
  at: number;
}

export interface LegalReportRecord {
  auditId: string;
  issueId: string;
  track: 'structural' | 'municipal';
  evidenceHash: string;
  generatedAt: number;
}

export interface SurroundingsRequest {
  imageDataUrl: string;
  language: 'en' | 'hi' | 'pa';
  placeId?: string;
}

/**
 * The single seam between the app and any server.
 * The UI only ever imports `backend` from './index'. To go live, implement this interface
 * (see supabaseBackend.ts) and register it. No component changes needed.
 */
export interface SugamBackend {
  readonly name: string;

  // --- Walk-With-Me ---------------------------------------------------------
  /** Token is generated on the device so trips can start with no network. */
  createTrip(trip: TripState): Promise<void>;
  updateTrip(token: string, patch: Partial<TripState>): Promise<void>;
  raiseSos(token: string, sos: SosEvent): Promise<void>;
  resolveSos(token: string): Promise<void>;
  getTrip(token: string): Promise<TripState | null>;
  /** Realtime. Returns an unsubscribe function. Must call back once with current state if known. */
  subscribeTrip(token: string, onChange: (trip: TripState) => void): () => void;

  // --- Crowd data -----------------------------------------------------------
  submitSurfaceSamples(samples: SurfaceSample[]): Promise<void>;
  reportHazard(report: HazardReport): Promise<void>;
  /** Shared hazards for a place from other users. Local backend returns []. */
  fetchHazards(placeId: string): Promise<HazardReport[]>;
  submitArrivalCheck(check: ArrivalCheckInput): Promise<void>;

  // --- AI -------------------------------------------------------------------
  /** On-demand "What's ahead?" when the user is stuck. One frame in, spoken guidance out. */
  analyzeSurroundings(req: SurroundingsRequest): Promise<SurroundingsResult>;

  // --- Reporting ------------------------------------------------------------
  recordLegalReport(report: LegalReportRecord): Promise<void>;
}

/** Writes that can be queued while offline and replayed later. */
export type QueuedWrite =
  | { op: 'updateTrip'; token: string; patch: Partial<TripState> }
  | { op: 'raiseSos'; token: string; sos: SosEvent }
  | { op: 'resolveSos'; token: string }
  | { op: 'createTrip'; trip: TripState }
  | { op: 'submitSurfaceSamples'; samples: SurfaceSample[] }
  | { op: 'reportHazard'; report: HazardReport }
  | { op: 'submitArrivalCheck'; check: ArrivalCheckInput }
  | { op: 'recordLegalReport'; report: LegalReportRecord };
