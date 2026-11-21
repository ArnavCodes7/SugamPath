import type { Mode, PathProps, PlaceRow, RouteLeg } from './accessibility-types';
import type { BarrierInfo } from './campusRouter';
import type { LanguageCode, RouteOption } from '../types/sugampath';

/**
 * Turns a real campus route (legs from Supabase / campusRouter) into the RouteOption shape the
 * navigation stack (walk session, effort, slope, hazards, Walk-With-Me, blind mode) already uses.
 *
 * points are metres relative to the destination: x grows east, y grows south (map "north up"),
 * which is exactly what effort.ts / elevation.ts / useWalkSession expect.
 */

type Dir = 'left' | 'right' | 'slightLeft' | 'slightRight' | 'straight';

const T = {
  en: {
    dirs: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
    kind: {
      footway: 'footpath', path: 'path', pedestrian: 'walkway', steps: 'steps', crossing: 'crossing',
      service: 'service road', residential: 'campus road', connector: 'entrance path',
    } as Record<string, string>,
    head: (dir: string, k: string, m: number) => `Head ${dir} on the ${k} for ${m} m`,
    turn: { left: 'Turn left', right: 'Turn right', slightLeft: 'Bear left', slightRight: 'Bear right', straight: 'Continue straight' } as Record<Dir, string>,
    onto: (t: string, k: string, m: number) => `${t} onto the ${k} for ${m} m`,
    cross: (sig: string) => `Cross the road${sig}`,
    sig: { audible_signal: ' at the sound signal', signal: ' at the signal', none: ' carefully (no signal)', unknown: '' } as Record<string, string>,
    arrive: (name: string) => `Arrive at ${name}`,
    entrance: (name: string) => `${name} entrance`,
    warnBarrier: 'Barrier on this stretch',
    warnSteps: 'Has steps',
    warnRough: 'Rough or unpaved surface',
    warnObstruction: 'Obstruction reported',
    warnLowConf: 'Some paths are not verified yet',
    shortest: 'Shortest way',
    safest: 'Easiest way for you',
  },
  hi: {
    dirs: ['उत्तर', 'उत्तर-पूर्व', 'पूर्व', 'दक्षिण-पूर्व', 'दक्षिण', 'दक्षिण-पश्चिम', 'पश्चिम', 'उत्तर-पश्चिम'],
    kind: {
      footway: 'फ़ुटपाथ', path: 'रास्ते', pedestrian: 'पैदल मार्ग', steps: 'सीढ़ियों', crossing: 'क्रॉसिंग',
      service: 'सर्विस रोड', residential: 'कैंपस रोड', connector: 'प्रवेश रास्ते',
    } as Record<string, string>,
    head: (dir: string, k: string, m: number) => `${dir} की ओर ${k} पर ${m} मीटर चलें`,
    turn: { left: 'बाएँ मुड़ें', right: 'दाएँ मुड़ें', slightLeft: 'थोड़ा बाएँ चलें', slightRight: 'थोड़ा दाएँ चलें', straight: 'सीधे चलते रहें' } as Record<Dir, string>,
    onto: (t: string, k: string, m: number) => `${t}, ${k} पर ${m} मीटर`,
    cross: (sig: string) => `सड़क पार करें${sig}`,
    sig: { audible_signal: ' (आवाज़ वाला सिग्नल)', signal: ' (सिग्नल पर)', none: ' ध्यान से (सिग्नल नहीं)', unknown: '' } as Record<string, string>,
    arrive: (name: string) => `${name} पहुँचें`,
    entrance: (name: string) => `${name} प्रवेश`,
    warnBarrier: 'इस हिस्से पर रुकावट',
    warnSteps: 'सीढ़ियाँ हैं',
    warnRough: 'कच्ची या खराब सतह',
    warnObstruction: 'रुकावट की सूचना',
    warnLowConf: 'कुछ रास्ते अभी जाँचे नहीं गए',
    shortest: 'सबसे छोटा रास्ता',
    safest: 'आपके लिए आसान रास्ता',
  },
  pa: {
    dirs: ['ਉੱਤਰ', 'ਉੱਤਰ-ਪੂਰਬ', 'ਪੂਰਬ', 'ਦੱਖਣ-ਪੂਰਬ', 'ਦੱਖਣ', 'ਦੱਖਣ-ਪੱਛਮ', 'ਪੱਛਮ', 'ਉੱਤਰ-ਪੱਛਮ'],
    kind: {
      footway: 'ਫੁੱਟਪਾਥ', path: 'ਰਸਤੇ', pedestrian: 'ਪੈਦਲ ਮਾਰਗ', steps: 'ਪੌੜੀਆਂ', crossing: 'ਕ੍ਰਾਸਿੰਗ',
      service: 'ਸਰਵਿਸ ਰੋਡ', residential: 'ਕੈਂਪਸ ਰੋਡ', connector: 'ਦਾਖ਼ਲਾ ਰਸਤੇ',
    } as Record<string, string>,
    head: (dir: string, k: string, m: number) => `${dir} ਵੱਲ ${k} ਤੇ ${m} ਮੀਟਰ ਚੱਲੋ`,
    turn: { left: 'ਖੱਬੇ ਮੁੜੋ', right: 'ਸੱਜੇ ਮੁੜੋ', slightLeft: 'ਥੋੜ੍ਹਾ ਖੱਬੇ', slightRight: 'ਥੋੜ੍ਹਾ ਸੱਜੇ', straight: 'ਸਿੱਧੇ ਚੱਲਦੇ ਰਹੋ' } as Record<Dir, string>,
    onto: (t: string, k: string, m: number) => `${t}, ${k} ਤੇ ${m} ਮੀਟਰ`,
    cross: (sig: string) => `ਸੜਕ ਪਾਰ ਕਰੋ${sig}`,
    sig: { audible_signal: ' (ਆਵਾਜ਼ ਵਾਲਾ ਸਿਗਨਲ)', signal: ' (ਸਿਗਨਲ ਤੇ)', none: ' ਧਿਆਨ ਨਾਲ (ਸਿਗਨਲ ਨਹੀਂ)', unknown: '' } as Record<string, string>,
    arrive: (name: string) => `${name} ਪਹੁੰਚੋ`,
    entrance: (name: string) => `${name} ਦਾਖ਼ਲਾ`,
    warnBarrier: 'ਇਸ ਹਿੱਸੇ ਤੇ ਰੁਕਾਵਟ',
    warnSteps: 'ਪੌੜੀਆਂ ਹਨ',
    warnRough: 'ਕੱਚੀ ਜਾਂ ਖ਼ਰਾਬ ਸਤ੍ਹਾ',
    warnObstruction: 'ਰੁਕਾਵਟ ਦੀ ਸੂਚਨਾ',
    warnLowConf: 'ਕੁਝ ਰਸਤੇ ਅਜੇ ਜਾਂਚੇ ਨਹੀਂ ਗਏ',
    shortest: 'ਸਭ ਤੋਂ ਛੋਟਾ ਰਸਤਾ',
    safest: 'ਤੁਹਾਡੇ ਲਈ ਆਸਾਨ ਰਸਤਾ',
  },
};

/** Walking speed (m/s) per mode, for the minutes estimate. */
const SPEED: Record<Mode, number> = { standard: 1.3, wheelchair: 1.0, blind: 0.9, walker: 0.8 };

function bearing(a: number[], b: number[]): number {
  const toRad = Math.PI / 180;
  const y = Math.sin((b[0] - a[0]) * toRad) * Math.cos(b[1] * toRad);
  const x =
    Math.cos(a[1] * toRad) * Math.sin(b[1] * toRad) -
    Math.sin(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.cos((b[0] - a[0]) * toRad);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const dist2 = (a: number[], b: number[]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

function turnOf(delta: number): Dir {
  const d = ((delta + 540) % 360) - 180; // -180..180, + = right
  const a = Math.abs(d);
  if (a < 25) return 'straight';
  if (a < 60) return d > 0 ? 'slightRight' : 'slightLeft';
  return d > 0 ? 'right' : 'left';
}

interface OrientedLeg {
  coords: number[][];
  props: PathProps | undefined;
  length: number;
  barrier?: BarrierInfo;
}

/** Orient every leg so it starts where the previous one ended. */
function orient(legs: RouteLeg[], propsByExt: Map<string, PathProps>, barriers: Map<number, BarrierInfo>): OrientedLeg[] {
  const out: OrientedLeg[] = [];
  legs.forEach((l, i) => {
    let c = l.geojson.coordinates.map((p) => [p[0], p[1]]);
    if (c.length < 2) return;
    if (out.length) {
      const prevEnd = out[out.length - 1].coords.at(-1)!;
      if (dist2(c[c.length - 1], prevEnd) < dist2(c[0], prevEnd)) c = c.reverse();
    } else if (legs[i + 1]) {
      const next = legs[i + 1].geojson.coordinates;
      const nEnds = [next[0], next[next.length - 1]];
      const startNear = Math.min(...nEnds.map((p) => dist2(c[0], p)));
      const endNear = Math.min(...nEnds.map((p) => dist2(c[c.length - 1], p)));
      if (startNear < endNear) c = c.reverse();
    }
    const props = propsByExt.get(l.external_id);
    out.push({ coords: c, props, length: Number(l.length_m) || 0, barrier: props ? barriers.get(props.id) : undefined });
  });
  return out;
}

function kindKey(p: PathProps | undefined): string {
  if (!p) return 'path';
  if (p.is_connector) return 'connector';
  return p.kind;
}

export interface BuiltRoute {
  option: RouteOption;
  /** Share of the route on smooth surfaces (0-100), from the Supabase segment data. */
  smoothPct: number;
  /** Segments on this route with a wheelchair-blocking barrier. */
  wheelchairBarriers: number;
}

export function buildRouteOption(
  legs: RouteLeg[],
  propsByExt: Map<string, PathProps>,
  barriers: Map<number, BarrierInfo>,
  mode: Mode,
  kind: 'standard' | 'accessible',
  dest: PlaceRow,
  language: LanguageCode
): BuiltRoute {
  const t = T[language] ?? T.en;
  const ol = orient(legs, propsByExt, barriers);
  const total = ol.reduce((s, l) => s + l.length, 0);

  // Stretches: consecutive legs of the same kind with no real turn between them.
  type Stretch = { legs: OrientedLeg[]; length: number; kind: string };
  const stretches: Stretch[] = [];
  for (const l of ol) {
    const k = kindKey(l.props);
    const last = stretches.at(-1);
    if (last) {
      const prev = last.legs.at(-1)!.coords;
      const turn = turnOf(bearing(l.coords[0], l.coords[1]) - bearing(prev.at(-2)!, prev.at(-1)!));
      const sameClass = (k === 'crossing') === (last.kind === 'crossing');
      if (sameClass && (turn === 'straight' || l.length < 8) && (k === last.kind || l.length < 15 || k === 'connector')) {
        last.legs.push(l);
        last.length += l.length;
        continue;
      }
    }
    stretches.push({ legs: [l], length: l.length, kind: k });
  }
  // Fold tiny non-crossing stretches into the previous one.
  for (let i = stretches.length - 1; i > 0; i--) {
    const s = stretches[i];
    if (s.length < 12 && s.kind !== 'crossing' && stretches[i - 1].kind !== 'crossing') {
      stretches[i - 1].legs.push(...s.legs);
      stretches[i - 1].length += s.length;
      stretches.splice(i, 1);
    }
  }

  const steps: RouteOption['steps'] = [];
  const warnings = new Set<string>();
  stretches.forEach((s, i) => {
    const m = Math.max(1, Math.round(s.length));
    const first = s.legs[0];
    const props = first.props;
    const k = t.kind[s.kind] ?? t.kind.path;
    const notes: string[] = [];
    if (s.legs.some((l) => l.barrier)) notes.push(t.warnBarrier);
    if (s.legs.some((l) => l.props?.has_steps)) notes.push(t.warnSteps);
    if (s.legs.some((l) => l.props?.surface === 'broken' || l.props?.surface === 'unpaved')) notes.push(t.warnRough);
    if (s.legs.some((l) => l.props?.obstruction === 'severe')) notes.push(t.warnObstruction);
    notes.forEach((n) => warnings.add(n));
    const audited = s.legs.every((l) => (l.props?.confidence ?? 0) >= 0.5);

    let instruction: string;
    let type: RouteOption['steps'][number]['type'] = 'walk';
    if (s.kind === 'crossing') {
      type = 'cross';
      instruction = t.cross(t.sig[props?.signal ?? 'unknown'] ?? '');
    } else if (i === 0) {
      const b = bearing(first.coords[0], first.coords[1]);
      instruction = t.head(t.dirs[Math.round(b / 45) % 8], k, m);
    } else {
      const prev = stretches[i - 1].legs.at(-1)!.coords;
      const turn = turnOf(bearing(first.coords[0], first.coords[1]) - bearing(prev.at(-2)!, prev.at(-1)!));
      instruction = t.onto(t.turn[turn], k, m);
    }
    steps.push({
      id: `s${i + 1}`,
      type,
      instruction,
      distance_m: m,
      warning: notes.length ? notes.join(' · ') : undefined,
      audited,
    });
  });
  steps.push({ id: `s${steps.length + 1}`, type: 'enter_gate', instruction: t.arrive(dest.name), distance_m: 5, audited: true });

  // Points in metres relative to the destination (x east, y south).
  const kx = 111_320 * Math.cos((dest.lat * Math.PI) / 180);
  const ky = 110_540;
  const points: Array<{ x: number; y: number }> = [];
  for (const l of ol)
    for (const c of l.coords) {
      const p = { x: (c[0] - dest.lon) * kx, y: -(c[1] - dest.lat) * ky };
      const last = points.at(-1);
      if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 0.5) points.push(p);
    }

  const share = (pred: (p: PathProps) => boolean) =>
    total ? Math.round((ol.reduce((s, l) => s + (l.props && pred(l.props) ? l.length : 0), 0) / total) * 100) : 0;
  const audited_pct = share((p) => p.confidence >= 0.5);
  if (audited_pct < 100) warnings.add(t.warnLowConf);

  const stairsCount = ol.filter((l) => l.props?.has_steps || l.barrier?.types.includes('steps')).length;

  return {
    option: {
      kind,
      label: kind === 'standard' ? t.shortest : t.safest,
      gate_chosen: t.entrance(dest.name),
      distance_m: Math.round(total),
      duration_min: Math.max(1, Math.round(total / SPEED[mode] / 60)),
      stairs_count: stairsCount,
      steepest_slope_pct: 0, // no slope data in the network yet; live elevation fills this in
      tactile_coverage_pct: share((p) => p.tactile_paving === 'yes' || p.tactile_paving === 'partial'),
      audited_pct,
      warnings: [...warnings],
      points,
      steps,
    },
    smoothPct: share((p) => p.surface === 'smooth'),
    wheelchairBarriers: ol.filter((l) => l.barrier?.blocksWheelchair).length,
  };
}

/** Empty route used before the user has picked one (keeps hooks unconditional). */
export const EMPTY_ROUTE: RouteOption = {
  kind: 'accessible',
  label: '',
  gate_chosen: '',
  distance_m: 0,
  duration_min: 0,
  stairs_count: 0,
  steepest_slope_pct: 0,
  tactile_coverage_pct: 0,
  audited_pct: 0,
  warnings: [],
  points: [],
  steps: [],
};
