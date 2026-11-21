import type { RouteOption, TravelMode } from '../../types/sugampath';
import type { ActiveHazard } from '../../types/safety';

export interface EffortBreakdown {
  distanceM: number;
  steps: number;
  maxSlopeDeg: number;
  slopeBand: 'safe' | 'steep' | 'very_steep';
  smoothPct: number;
  crossings: number;
  turns: number;
  /** Hazards that sit on this route's gate. */
  hazards: ActiveHazard[];
  /** Lower is easier. Unitless "effort metres". */
  score: number;
}

const TURN_ANGLE_DEG = 45;

export function slopePctToDeg(pct: number): number {
  return Math.round((Math.atan(pct / 100) * 180) / Math.PI * 10) / 10;
}

/** <= 4.8 deg is the 1:12 ramp limit used in Indian and international accessibility guidance. */
export function slopeBand(deg: number): EffortBreakdown['slopeBand'] {
  if (deg <= 4.8) return 'safe';
  if (deg <= 7) return 'steep';
  return 'very_steep';
}

/** Counts direction changes > 45 degrees along a polyline. Zig-zags cost effort, especially without sight. */
export function countTurns(points: Array<{ x: number; y: number }>): number {
  let turns = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const a = Math.atan2(points[i].y - points[i - 1].y, points[i].x - points[i - 1].x);
    const b = Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x);
    let d = Math.abs(((b - a) * 180) / Math.PI);
    if (d > 180) d = 360 - d;
    if (d > TURN_ANGLE_DEG) turns++;
  }
  return turns;
}

export function polylineLength(points: Array<{ x: number; y: number }>): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

/** Compass bearing (0 = north, clockwise) of a map vector. Map y grows downward, north is up. */
export function mapBearing(from: { x: number; y: number }, to: { x: number; y: number }): number {
  const deg = (Math.atan2(to.x - from.x, from.y - to.y) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export interface EffortOptions {
  mode: TravelMode;
  hazards: ActiveHazard[];
  /** 0-100. Pocket-Pulse smoothness for this route. */
  smoothPct: number;
  /** Optional slope measured from elevation data (degrees). Only ever raises the slope. */
  measuredSlopeDeg?: number | null;
}

export function computeEffort(route: RouteOption, opts: EffortOptions): EffortBreakdown {
  const { mode, smoothPct } = opts;
  const dataSlope = slopePctToDeg(route.steepest_slope_pct);
  const maxSlopeDeg = Math.max(dataSlope, opts.measuredSlopeDeg ?? 0);
  const crossings = route.steps.filter((s) => s.type === 'cross').length;
  const turns = countTurns(route.points);
  const hazards = opts.hazards.filter((h) => h.gateName === route.gate_chosen);

  const stairWeight = mode === 'wheelchair' ? 400 : mode === 'walker' ? 150 : 60;
  const turnWeight = mode === 'blind' ? 25 : 10;

  let score = route.distance_m;
  score += route.stairs_count * stairWeight;
  score += Math.max(0, maxSlopeDeg - 2) * 30;
  score += ((100 - smoothPct) / 100) * route.distance_m * 0.8;
  score += turns * turnWeight;
  score += crossings * 15;

  for (const h of hazards) {
    if (h.status === 'standing' && h.tier === 'structural') score += 300;
    else if (h.tier === 'maintenance') score += 150;
    else if (h.status === 'peak') score += 120;
    else score += 80; // live transient
  }

  return {
    distanceM: route.distance_m,
    steps: route.stairs_count,
    maxSlopeDeg,
    slopeBand: slopeBand(maxSlopeDeg),
    smoothPct: Math.round(smoothPct),
    crossings,
    turns,
    hazards,
    score: Math.round(score),
  };
}
