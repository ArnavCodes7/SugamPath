import type {
  ActiveHazard,
  Hazard,
  HazardKind,
  HazardSource,
  HazardTier,
} from '../../types/safety';

const HOUR = 3600_000;
const DAY = 24 * HOUR;

/** 3-tier decay: structural never expires, maintenance 14 days, transient 3 hours. */
export const DECAY_MS: Record<HazardTier, number | null> = {
  structural: null,
  maintenance: 14 * DAY,
  transient: 3 * HOUR,
};

export const PEAK_START_HOUR = 17;
export const PEAK_END_HOUR = 20;
/** Evening reports on at least this many different days flag a peak-hour blockage. */
const PEAK_MIN_DAYS = 2;
const PEAK_MIN_REPORTS = 3;

export function tierForKind(kind: HazardKind): HazardTier {
  switch (kind) {
    case 'stairs':
    case 'no_ramp':
      return 'structural';
    case 'rough_surface':
    case 'broken_lift':
      return 'maintenance';
    default:
      return 'transient';
  }
}

export function isPeakWindow(ts: number): boolean {
  const h = new Date(ts).getHours();
  return h >= PEAK_START_HOUR && h < PEAK_END_HOUR;
}

export function detectPeakHour(reports: number[]): boolean {
  const evening = reports.filter(isPeakWindow);
  if (evening.length < PEAK_MIN_REPORTS) return false;
  const days = new Set(evening.map((r) => new Date(r).toDateString()));
  return days.size >= PEAK_MIN_DAYS;
}

/**
 * Resolves a stored hazard into what the router should act on right now.
 * Returns null when it has expired and is not a recurring peak-hour blockage.
 */
export function resolveHazard(h: Hazard, now: number): ActiveHazard | null {
  const last = Math.max(...h.reports);
  const ttl = DECAY_MS[h.tier];
  const expiresAt = ttl === null ? null : last + ttl;
  const peakHour = h.tier !== 'structural' && detectPeakHour(h.reports);
  const alive = expiresAt === null || now < expiresAt;

  if (alive) {
    const status = h.tier === 'structural' ? 'standing' : h.tier === 'transient' ? 'live' : 'standing';
    return { ...h, status, lastReportedAt: last, expiresAt, peakHour };
  }
  // Expired, but a recurring evening blockage still matters during the rush window.
  if (peakHour && isPeakWindow(now)) {
    return { ...h, status: 'peak', lastReportedAt: last, expiresAt, peakHour };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Seed hazards (sample data, same spirit as the rest of the demo content)
// ---------------------------------------------------------------------------

function eveningOnDay(daysAgo: number, hour = 18, minute = 10): number {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function buildSeeds(): Hazard[] {
  const now = Date.now();
  return [
    {
      id: 'hz-seed-rc-g4-stairs',
      placeId: 'plc-ndls-rajiv-chowk',
      gateName: 'Gate 4 — Foot Overbridge Link',
      kind: 'stairs',
      tier: 'structural',
      source: 'seed',
      reports: [now - 30 * DAY],
    },
    {
      id: 'hz-seed-rc-g1-lift',
      placeId: 'plc-ndls-rajiv-chowk',
      gateName: 'Gate 1 — Palika Bazaar Concourse',
      kind: 'broken_lift',
      tier: 'maintenance',
      source: 'seed',
      reports: [now - 3 * DAY, now - 2 * DAY, now - 4 * HOUR],
    },
    {
      id: 'hz-seed-rc-g2-vendor',
      placeId: 'plc-ndls-rajiv-chowk',
      gateName: 'Gate 2 — Radial Road 3 Side Entrance',
      kind: 'vendor',
      tier: 'transient',
      source: 'seed',
      reports: [eveningOnDay(1), eveningOnDay(2, 18, 40), eveningOnDay(3, 17, 55)],
    },
    {
      id: 'hz-seed-chd-g3-scooter',
      placeId: 'plc-chd-railway',
      gateName: 'Gate 3 — Side Ramp & Battery Cart Bay',
      kind: 'parked_vehicle',
      tier: 'transient',
      source: 'seed',
      reports: [now - 40 * 60_000],
    },
  ];
}

// ---------------------------------------------------------------------------
// Local store (device-only; backend.reportHazard mirrors it when connected)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'sugampath_hazards_v1';
export const HAZARDS_CHANGED_EVENT = 'sugampath:hazards-changed';

const seeds = buildSeeds();

function loadUser(): Hazard[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Hazard[]) : [];
  } catch {
    return [];
  }
}

function saveUser(list: Hazard[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-200)));
  } catch {
    // storage full: skip
  }
  window.dispatchEvent(new Event(HAZARDS_CHANGED_EVENT));
}

export function getAllHazards(): Hazard[] {
  return [...seeds, ...loadUser()];
}

/** Active hazards at a place, newest first. */
export function getActiveHazards(placeId: string, now = Date.now()): ActiveHazard[] {
  return getAllHazards()
    .filter((h) => h.placeId === placeId)
    .map((h) => resolveHazard(h, now))
    .filter((h): h is ActiveHazard => h !== null)
    .sort((a, b) => b.lastReportedAt - a.lastReportedAt);
}

export interface HazardReportInput {
  placeId: string;
  gateName: string;
  kind: HazardKind;
  source: HazardSource;
  at?: number;
}

/** Adds a report. A repeat of the same gate + kind extends the existing hazard instead of duplicating it. */
export function reportHazardLocal(input: HazardReportInput): Hazard {
  const at = input.at ?? Date.now();
  const user = loadUser();
  const existing =
    user.find((h) => h.placeId === input.placeId && h.gateName === input.gateName && h.kind === input.kind) ||
    seeds.find((h) => h.placeId === input.placeId && h.gateName === input.gateName && h.kind === input.kind);

  if (existing && user.includes(existing)) {
    existing.reports.push(at);
    saveUser(user);
    return existing;
  }
  const created: Hazard = {
    id: `hz-${at.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    placeId: input.placeId,
    gateName: input.gateName,
    kind: input.kind,
    tier: tierForKind(input.kind),
    source: input.source,
    reports: [...(existing?.reports ?? []), at],
  };
  saveUser([...user, created]);
  return created;
}

/** "Yes, the lift works": extends nothing, but clears maintenance hazards of that kind for the gate. */
export function clearMaintenanceHazards(placeId: string, gateName: string, kinds: HazardKind[]) {
  const user = loadUser().filter(
    (h) => !(h.placeId === placeId && h.gateName === gateName && kinds.includes(h.kind) && h.tier !== 'structural')
  );
  saveUser(user);
}
