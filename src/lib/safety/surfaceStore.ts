import type { SurfaceSample } from '../../types/safety';

/**
 * Smoothness per route, 0-100.
 * Seeds are sample data; live Pocket-Pulse walks are blended in as they arrive.
 */
const SEED_SMOOTH: Record<string, { standard: number; accessible: number }> = {
  'rt-ndls-rc': { standard: 62, accessible: 90 },
  'rt-chd-stn': { standard: 70, accessible: 88 },
  'rt-pta-stn': { standard: 58, accessible: 84 },
};
const FALLBACK = { standard: 70, accessible: 85 };

const KEY = 'sugampath_surface_v1';

interface Tally {
  smooth: number;
  rough: number;
  stairs: number;
}

function load(): Record<string, Tally> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '{}') as Record<string, Tally>;
  } catch {
    return {};
  }
}

/** Adds one finished walk's windows to the route's running tally. */
export function recordWalk(routeId: string, kind: 'standard' | 'accessible', samples: SurfaceSample[]) {
  if (!samples.length) return;
  const all = load();
  const k = `${routeId}:${kind}`;
  const t = all[k] ?? { smooth: 0, rough: 0, stairs: 0 };
  for (const s of samples) {
    if (s.kind === 'smooth') t.smooth++;
    else if (s.kind === 'rough') t.rough++;
    else t.stairs++;
  }
  all[k] = t;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getSmoothPct(routeId: string, kind: 'standard' | 'accessible'): number {
  const seed = (SEED_SMOOTH[routeId] ?? FALLBACK)[kind];
  const t = load()[`${routeId}:${kind}`];
  if (!t) return seed;
  const n = t.smooth + t.rough + t.stairs;
  if (n < 3) return seed;
  // Seed counts as 10 windows of prior knowledge so one walk can't swing it wildly.
  const live = (t.smooth / n) * 100;
  return Math.round((seed * 10 + live * n) / (10 + n));
}
