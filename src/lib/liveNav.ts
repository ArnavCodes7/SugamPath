import type { RouteLeg } from './accessibility-types';

/** Geometry for live turn-by-turn: where along the route is the user, which step are they on. */

export type LonLat = [number, number];

export interface RouteLine {
  pts: LonLat[];
  /** cum[i] = metres from the start to pts[i]. */
  cum: number[];
  total: number;
  /** metres per degree, at the route's latitude */
  kx: number;
  ky: number;
}

const KY = 110_540;

function d2(a: LonLat, b: LonLat) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

/** Joins the route legs into one ordered polyline (legs come unordered in direction). */
export function buildRouteLine(legs: RouteLeg[]): RouteLine | null {
  const pts: LonLat[] = [];
  legs.forEach((l, i) => {
    let c = l.geojson.coordinates.map((p) => [p[0], p[1]] as LonLat);
    if (c.length < 2) return;
    if (pts.length) {
      const end = pts[pts.length - 1];
      if (d2(c[c.length - 1], end) < d2(c[0], end)) c = c.reverse();
    } else if (legs[i + 1]) {
      const n = legs[i + 1].geojson.coordinates;
      const ends: LonLat[] = [[n[0][0], n[0][1]], [n[n.length - 1][0], n[n.length - 1][1]]];
      const startNear = Math.min(...ends.map((p) => d2(c[0], p)));
      const endNear = Math.min(...ends.map((p) => d2(c[c.length - 1], p)));
      if (startNear < endNear) c = c.reverse();
    }
    for (const p of c) {
      const last = pts[pts.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p);
    }
  });
  if (pts.length < 2) return null;
  const kx = 111_320 * Math.cos((pts[0][1] * Math.PI) / 180);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot((pts[i][0] - pts[i - 1][0]) * kx, (pts[i][1] - pts[i - 1][1]) * KY));
  }
  return { pts, cum, total: cum[cum.length - 1], kx, ky: KY };
}

export interface Projection {
  /** metres from the route start to the nearest point on the route */
  along: number;
  /** metres between the user and that nearest point */
  off: number;
  point: LonLat;
  /** index of the segment (pts[i] -> pts[i+1]) the point lies on */
  seg: number;
}

/** Nearest point on the route to a position. `hint` (metres along) biases towards where the user last was, so loops don't jump. */
export function project(line: RouteLine, lon: number, lat: number, hint?: number): Projection {
  let best: Projection | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < line.pts.length - 1; i++) {
    const a = line.pts[i];
    const b = line.pts[i + 1];
    const ax = a[0] * line.kx, ay = a[1] * line.ky;
    const dx = (b[0] - a[0]) * line.kx, dy = (b[1] - a[1]) * line.ky;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? (((lon * line.kx - ax) * dx + (lat * line.ky - ay) * dy) / len2) : 0;
    t = Math.max(0, Math.min(1, t));
    const px = ax + t * dx, py = ay + t * dy;
    const off = Math.hypot(lon * line.kx - px, lat * line.ky - py);
    const along = line.cum[i] + t * Math.sqrt(len2);
    // Off-route distance dominates; among equals prefer the point near where we were.
    const score = off + (hint !== undefined ? Math.min(40, Math.abs(along - hint) * 0.05) : 0);
    if (score < bestScore) {
      bestScore = score;
      best = { along, off, point: [px / line.kx, py / line.ky], seg: i };
    }
  }
  return best!;
}

export function pointAt(line: RouteLine, d: number): LonLat {
  const x = Math.max(0, Math.min(line.total, d));
  let i = 1;
  while (i < line.cum.length - 1 && line.cum[i] < x) i++;
  const span = line.cum[i] - line.cum[i - 1] || 1;
  const t = (x - line.cum[i - 1]) / span;
  const a = line.pts[i - 1], b = line.pts[i];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function segIndexAt(line: RouteLine, d: number): number {
  let i = 0;
  while (i < line.cum.length - 2 && line.cum[i + 1] < d) i++;
  return i;
}

/** Part of the route between two distances (for the grey "walked" and blue "ahead" lines). */
export function slice(line: RouteLine, from: number, to: number): LonLat[] {
  const a = Math.max(0, Math.min(line.total, from));
  const b = Math.max(0, Math.min(line.total, to));
  if (b <= a) return [];
  const out: LonLat[] = [pointAt(line, a)];
  for (let i = 0; i < line.pts.length; i++) if (line.cum[i] > a && line.cum[i] < b) out.push(line.pts[i]);
  out.push(pointAt(line, b));
  return out;
}

export function bearingDeg(a: LonLat, b: LonLat): number {
  const r = Math.PI / 180;
  const y = Math.sin((b[0] - a[0]) * r) * Math.cos(b[1] * r);
  const x = Math.cos(a[1] * r) * Math.sin(b[1] * r) - Math.sin(a[1] * r) * Math.cos(b[1] * r) * Math.cos((b[0] - a[0]) * r);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Route heading (compass degrees) at a distance along it. */
export function routeBearingAt(line: RouteLine, d: number): number {
  const i = segIndexAt(line, d);
  return bearingDeg(line.pts[i], line.pts[i + 1]);
}

export const angleDiff = (a: number, b: number) => ((a - b + 540) % 360) - 180;

export type Maneuver = 'straight' | 'slightLeft' | 'slightRight' | 'left' | 'right' | 'arrive';

/** What the user has to do at distance d: compare the route's heading 15 m before and 15 m after. */
export function maneuverAt(line: RouteLine, d: number): Maneuver {
  const before = routeBearingAt(line, Math.max(0, d - 12));
  const after = routeBearingAt(line, Math.min(line.total - 0.01, d + 3));
  const delta = angleDiff(after, before);
  const a = Math.abs(delta);
  if (a < 25) return 'straight';
  if (a < 60) return delta > 0 ? 'slightRight' : 'slightLeft';
  return delta > 0 ? 'right' : 'left';
}

/**
 * End distance (metres along the route) of every step. The final "arrive" step has no length:
 * it is active in the last few metres. Step distances are scaled to the real polyline length.
 */
export function stepEnds(steps: Array<{ distance_m: number }>, total: number): number[] {
  const walk = steps.slice(0, -1);
  const sum = walk.reduce((s, x) => s + Math.max(1, x.distance_m), 0) || 1;
  let acc = 0;
  const ends = walk.map((s) => {
    acc += Math.max(1, s.distance_m);
    return (acc / sum) * total;
  });
  ends.push(total);
  return ends;
}

/** Index of the step the user is in at `along` metres. */
export function stepIndexAt(ends: number[], along: number, arriveWithin = 12): number {
  const n = ends.length;
  if (along >= ends[n - 1] - arriveWithin) return n - 1;
  for (let i = 0; i < n - 1; i++) if (along < ends[i] - 6) return i;
  return n - 1;
}

/** Walk speed (m/s) used for the ETA, by mode. */
export const SPEED_MS: Record<string, number> = { standard: 1.3, wheelchair: 1.0, blind: 0.9, walker: 0.8 };
