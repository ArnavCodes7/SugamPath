import { BLOCKED_COST, type Mode, type NetworkGeoJson, type PathProps, type RouteLeg } from './accessibility-types';
import type { BarrierRow, GateNodes } from '../hooks/useCampusData';

/**
 * Barrier- and tactile-aware routing over the Supabase campus network.
 * Mirrors supabase/routing_barriers.sql (same costs, same gates, same Dijkstra) so it can
 * move server-side unchanged once that SQL is applied.
 *
 *  wheelchair: base cost_wheelchair; any annotation that blocks wheelchairs removes the segment.
 *  blind:      base cost_blind × tactile bonus (yes 0.5, partial 0.75)
 *              × pedestrian-way preference (footway/path/pedestrian 0.9, roads 1.3)
 *              × crossing signal (audible 0.7, none 1.5) × 2 near any barrier.
 *  walker:     base cost_walker × 3 on segments with a barrier.
 *  standard:   base cost_standard.
 *  Segments with cost >= BLOCKED_COST are never used.
 */

export interface BarrierInfo {
  blocksWheelchair: boolean;
  types: string[];
}

const SNAP_M = 8;

function toMeters(lat0: number) {
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110_540;
  return (lon: number, lat: number): [number, number] => [lon * kx, lat * ky];
}

function distPointToSegment(p: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Snaps every blocking annotation to a segment: its linked edge, else the nearest path within 8 m. */
export function snapBarriers(network: NetworkGeoJson | null, barriers: BarrierRow[]): Map<number, BarrierInfo> {
  const out = new Map<number, BarrierInfo>();
  const feats = network?.features ?? [];
  if (!feats.length) return out;
  const byExt = new Map<string, PathProps>();
  for (const f of feats) byExt.set(f.properties.external_id, f.properties);
  const proj = toMeters(feats[0].geometry.coordinates[0]?.[1] ?? 30.35);
  const projected = feats
    .filter((f) => !f.properties.is_connector)
    .map((f) => ({ id: f.properties.id, pts: f.geometry.coordinates.map(([x, y]) => proj(x, y)) }));

  for (const b of barriers) {
    if (b.blocks === 'none') continue;
    let segId: number | null = null;
    const linked = b.edge_external_id ? byExt.get(b.edge_external_id) : undefined;
    if (linked) segId = linked.id;
    else {
      const p = proj(b.lon, b.lat);
      let best = SNAP_M;
      for (const s of projected)
        for (let i = 1; i < s.pts.length; i++) {
          const d = distPointToSegment(p, s.pts[i - 1], s.pts[i]);
          if (d <= best) {
            best = d;
            segId = s.id;
          }
        }
    }
    if (segId == null) continue;
    const cur = out.get(segId) ?? { blocksWheelchair: false, types: [] };
    cur.blocksWheelchair ||= b.blocks === 'wheelchair';
    if (!cur.types.includes(b.type)) cur.types.push(b.type);
    out.set(segId, cur);
  }
  return out;
}

export function segmentCost(p: PathProps, mode: Mode, barrier: BarrierInfo | undefined): number {
  const base = Number(p[`cost_${mode}` as keyof PathProps]);
  if (!Number.isFinite(base) || base >= BLOCKED_COST) return BLOCKED_COST;
  switch (mode) {
    case 'wheelchair':
      return barrier?.blocksWheelchair ? BLOCKED_COST : base;
    case 'blind': {
      const tactile = p.tactile_paving === 'yes' ? 0.5 : p.tactile_paving === 'partial' ? 0.75 : 1;
      const way =
        p.kind === 'footway' || p.kind === 'pedestrian' || p.kind === 'path'
          ? 0.9
          : p.kind === 'residential' || p.kind === 'service'
            ? 1.3
            : 1;
      const crossing =
        p.kind === 'crossing' ? (p.signal === 'audible_signal' ? 0.7 : p.signal === 'none' ? 1.5 : 1) : 1;
      return base * tactile * way * crossing * (barrier ? 2 : 1);
    }
    case 'walker':
      return barrier ? base * 3 : base;
    default:
      return base;
  }
}

/** Tiny binary min-heap keyed by cost. */
class Heap {
  private a: [number, number][] = [];
  get size() {
    return this.a.length;
  }
  push(v: [number, number]) {
    const a = this.a;
    a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): [number, number] {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

/** Shortest accessible route between two places. [] = no accessible route for this mode. */
export function findCampusRoute(
  network: NetworkGeoJson,
  gateNodes: GateNodes,
  barriers: Map<number, BarrierInfo>,
  fromPlace: string,
  toPlace: string,
  mode: Mode
): RouteLeg[] {
  const s = gateNodes[fromPlace];
  const t = gateNodes[toPlace];
  if (s == null || t == null || s === t) return [];

  type Edge = { to: number; cost: number; f: number };
  const adj = new Map<number, Edge[]>();
  const add = (a: number, e: Edge) => {
    const list = adj.get(a);
    if (list) list.push(e);
    else adj.set(a, [e]);
  };
  network.features.forEach((f, i) => {
    const p = f.properties;
    const c = segmentCost(p, mode, barriers.get(p.id));
    if (c >= BLOCKED_COST) return;
    add(p.source, { to: p.target, cost: c, f: i });
    add(p.target, { to: p.source, cost: c, f: i });
  });

  const dist = new Map<number, number>([[s, 0]]);
  const prev = new Map<number, { node: number; f: number }>();
  const heap = new Heap();
  heap.push([0, s]);
  while (heap.size) {
    const [d, u] = heap.pop();
    if (u === t) break;
    if (d > (dist.get(u) ?? Infinity)) continue;
    for (const e of adj.get(u) ?? []) {
      const nd = d + e.cost;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, { node: u, f: e.f });
        heap.push([nd, e.to]);
      }
    }
  }
  if (!prev.has(t)) return [];

  const legs: RouteLeg[] = [];
  for (let n = t; n !== s; ) {
    const step = prev.get(n)!;
    const f = network.features[step.f];
    legs.push({ seq: 0, external_id: f.properties.external_id, length_m: Number(f.properties.length_m) || 0, geojson: f.geometry });
    n = step.node;
  }
  legs.reverse();
  legs.forEach((l, i) => (l.seq = i + 1));
  return legs;
}

/**
 * Accessibility score (0-100) of the paths right around a place for a mode:
 * length-weighted mean of the mode score of non-connector segments within `radius` m,
 * with wheelchair-blocking barriers counted as 0. null when nothing is mapped nearby.
 */
export function placeScore(
  network: NetworkGeoJson | null,
  barriers: Map<number, BarrierInfo>,
  lon: number,
  lat: number,
  mode: Mode,
  radius = 60
): number | null {
  const feats = network?.features ?? [];
  if (!feats.length) return null;
  const proj = toMeters(lat);
  const p = proj(lon, lat);
  let sum = 0;
  let w = 0;
  for (const f of feats) {
    const pr = f.properties;
    if (pr.is_connector) continue;
    const pts = f.geometry.coordinates.map(([x, y]) => proj(x, y));
    let near = false;
    for (let i = 1; i < pts.length && !near; i++) near = distPointToSegment(p, pts[i - 1], pts[i]) <= radius;
    if (!near) continue;
    const b = barriers.get(pr.id);
    const score =
      mode === 'standard'
        ? Math.min(pr.score_wheelchair, pr.score_blind, pr.score_walker)
        : mode === 'wheelchair' && b?.blocksWheelchair
          ? 0
          : Number(pr[`score_${mode}` as keyof PathProps]);
    if (!Number.isFinite(score)) continue;
    const len = Math.max(1, Number(pr.length_m) || 1);
    sum += score * len;
    w += len;
  }
  return w ? Math.round(sum / w) : null;
}

export interface PlaceFacts {
  /** Share of nearby path length on smooth surface (null = surface not mapped). */
  smoothPct: number | null;
  /** Barrier annotations within the radius that block wheelchairs. */
  barriers: number;
  /** Nearby segments with steps (or steps annotations). */
  steps: number;
  /** Mapped path segments nearby. */
  segments: number;
}

/** Plain facts about the paths right around a place, straight from the Supabase data. */
export function placeFacts(
  network: NetworkGeoJson | null,
  barrierRows: BarrierRow[],
  lon: number,
  lat: number,
  radius = 60
): PlaceFacts {
  const proj = toMeters(lat);
  const p = proj(lon, lat);
  let known = 0;
  let smooth = 0;
  let steps = 0;
  let segments = 0;
  for (const f of network?.features ?? []) {
    const pr = f.properties;
    if (pr.is_connector) continue;
    const pts = f.geometry.coordinates.map(([x, y]) => proj(x, y));
    let near = false;
    for (let i = 1; i < pts.length && !near; i++) near = distPointToSegment(p, pts[i - 1], pts[i]) <= radius;
    if (!near) continue;
    segments++;
    if (pr.has_steps) steps++;
    const len = Number(pr.length_m) || 0;
    if (pr.surface !== 'unknown') {
      known += len;
      if (pr.surface === 'smooth') smooth += len;
    }
  }
  let barriers = 0;
  for (const b of barrierRows) {
    const bp = proj(b.lon, b.lat);
    if (Math.hypot(bp[0] - p[0], bp[1] - p[1]) > radius) continue;
    if (b.type === 'steps') steps++;
    if (b.blocks === 'wheelchair') barriers++;
  }
  return { smoothPct: known ? Math.round((smooth / known) * 100) : null, barriers, steps, segments };
}

/**
 * Self-heals gates whose graph node has no path attached (e.g. after the data pipeline re-runs and
 * renumbers nodes): re-snaps each such place to the nearest node of the main connected network.
 * Returns the same map when nothing needs repairing.
 */
export function repairGateNodes(
  network: NetworkGeoJson | null,
  places: { external_id: string; lon: number; lat: number }[] | null,
  gateNodes: GateNodes | null,
  maxSnapM = 150
): GateNodes | null {
  const feats = network?.features ?? [];
  if (!feats.length || !places || !gateNodes) return gateNodes;

  // Union-find over nodes to find the largest connected component.
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    while (parent.get(x) !== r) {
      const n = parent.get(x)!;
      parent.set(x, r);
      x = n;
    }
    return r;
  };
  const pos = new Map<number, [number, number]>();
  for (const f of feats) {
    const { source, target } = f.properties;
    const c = f.geometry.coordinates;
    if (!c.length) continue;
    if (!pos.has(source)) pos.set(source, [c[0][0], c[0][1]]);
    if (!pos.has(target)) pos.set(target, [c[c.length - 1][0], c[c.length - 1][1]]);
    for (const n of [source, target]) if (!parent.has(n)) parent.set(n, n);
    parent.set(find(source), find(target));
  }
  const sizes = new Map<number, number>();
  for (const n of parent.keys()) sizes.set(find(n), (sizes.get(find(n)) ?? 0) + 1);
  let mainRoot = -1;
  let best = 0;
  for (const [r, s] of sizes) if (s > best) ((best = s), (mainRoot = r));

  let out: GateNodes | null = null;
  for (const p of places) {
    const cur = gateNodes[p.external_id];
    if (cur != null && parent.has(cur) && find(cur) === mainRoot) continue; // already connected
    const proj = toMeters(p.lat);
    const pp = proj(p.lon, p.lat);
    let bestNode: number | null = null;
    let bestD = maxSnapM;
    for (const [n, [lon, lat]] of pos) {
      if (find(n) !== mainRoot) continue;
      const q = proj(lon, lat);
      const d = Math.hypot(q[0] - pp[0], q[1] - pp[1]);
      if (d < bestD) ((bestD = d), (bestNode = n));
    }
    if (bestNode == null) continue;
    out ??= { ...gateNodes };
    out[p.external_id] = bestNode;
  }
  return out ?? gateNodes;
}
