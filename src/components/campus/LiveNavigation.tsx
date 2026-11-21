import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/maplibre';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Ban,
  Check,
  ChevronUp,
  Compass,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Layers,
  LocateFixed,
  Navigation,
  Play,
  ShieldCheck,
  Square,
  TrafficCone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { RouteLeg } from '../../lib/accessibility-types';
import type { BarrierRow } from '../../hooks/useCampusData';
import { useDemoWalker, useLiveGps } from '../../hooks/useLiveGps';
import type { WalkSession } from '../../hooks/useWalkSession';
import { CM } from '../../lib/i18nCommunity';
import { SAFE } from '../../lib/i18nSafety';
import {
  angleDiff,
  buildRouteLine,
  maneuverAt,
  pointAt,
  project,
  slice,
  SPEED_MS,
  stepEnds,
  stepIndexAt,
  type Maneuver,
} from '../../lib/liveNav';
import { SATELLITE_STYLE, STREET_STYLE } from '../../lib/mapStyles';
import type { EmergencyContact } from '../../types/safety';
import type { LanguageCode } from '../../types/sugampath';
import { HoldButton } from '../safety/HoldButton';
import { ShareTrip } from '../safety/ShareTrip';

interface NavStep {
  id: string;
  type?: string;
  instruction: string;
  distance_m: number;
  warning?: string;
}

interface Props {
  language: LanguageCode;
  mode: string;
  legs: RouteLeg[];
  steps: NavStep[];
  stepIndex: number;
  session: WalkSession;
  destName: string;
  barriers: BarrierRow[];
  contact: EmergencyContact | null;
  /** voice is allowed for this user (not visual-only) */
  voiceAllowed: boolean;
  muted: boolean;
  onToggleMute: () => void;
  speak: (text: string) => void;
  onStop: () => void;
}

const ROUTE_BLUE = '#2563eb';
const OFF_ROUTE_MIN_M = 28;
const FAR_M = 220;

const MANEUVER_ICON: Record<Maneuver, typeof ArrowUp> = {
  straight: ArrowUp,
  slightLeft: ArrowUpLeft,
  slightRight: ArrowUpRight,
  left: CornerUpLeft,
  right: CornerUpRight,
  arrive: Flag,
};

const round5 = (m: number) => Math.max(5, Math.round(m / 5) * 5);

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.max(0, Math.round(m))} m`;
}

/** Smoothly glides a displayed point toward the latest GPS fix (no jumps between 1 Hz updates). */
function useGlide(target: { lon: number; lat: number } | null) {
  const [shown, setShown] = useState(target);
  const cur = useRef(target);
  const tgt = useRef(target);
  tgt.current = target;
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const to = tgt.current;
      if (to) {
        const c = cur.current ?? to;
        const k = 0.22;
        const next = { lon: c.lon + (to.lon - c.lon) * k, lat: c.lat + (to.lat - c.lat) * k };
        const moved = Math.abs(next.lon - c.lon) + Math.abs(next.lat - c.lat) > 1e-9;
        cur.current = next;
        if (moved && t - last > 50) {
          last = t;
          setShown(next);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return shown;
}

export function LiveNavigation({
  language,
  mode,
  legs,
  steps,
  stepIndex,
  session,
  destName,
  barriers,
  contact,
  voiceAllowed,
  muted,
  onToggleMute,
  speak,
  onStop,
}: Props) {
  const c = CM[language];
  const S = SAFE[language];
  const mapRef = useRef<MapRef>(null);
  const line = useMemo(() => buildRouteLine(legs), [legs]);
  const ends = useMemo(() => (line ? stepEnds(steps, line.total) : []), [line, steps]);

  const [demo, setDemo] = useState(false);
  const [follow, setFollow] = useState(true);
  const [headingUp, setHeadingUp] = useState(true);
  const [satellite, setSatellite] = useState(false);
  const [open, setOpen] = useState(false);

  const gps = useLiveGps(true);
  const demoFix = useDemoWalker(line, demo);
  const fix = demo ? demoFix : gps.fix;

  // ---- where on the route are we?
  const alongRef = useRef(0);
  const proj = useMemo(() => (line && fix ? project(line, fix.lon, fix.lat, alongRef.current) : null), [line, fix]);
  const offLimit = Math.max(OFF_ROUTE_MIN_M, (fix?.accuracy ?? 0) * 1.6);
  const off = proj ? proj.off : 0;
  const far = !!proj && !demo && off > FAR_M;
  const offRoute = !!proj && !far && off > offLimit;
  const onRoute = !!proj && !far && !offRoute;
  // Progress only moves while we are on the route (and never goes backwards past small GPS noise).
  if (proj && onRoute && proj.along > alongRef.current - 15) alongRef.current = Math.max(alongRef.current, proj.along);
  const along = alongRef.current;
  const total = line?.total ?? 0;
  const remaining = Math.max(0, total - along);

  const lastIdx = Math.max(0, steps.length - 1);
  const idx = Math.min(stepIndex, lastIdx);
  const nextStep = steps[idx + 1];
  const toNext = idx >= lastIdx ? remaining : Math.max(0, (ends[idx] ?? total) - along);
  const speedMs = SPEED_MS[mode] ?? 1.1;
  const etaMin = Math.max(1, Math.ceil(remaining / speedMs / 60));
  const arriveAt = new Date(Date.now() + (remaining / speedMs) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ---- geometry drives the step card (GPS or demo)
  const advancedFor = useRef(-1);
  useEffect(() => {
    advancedFor.current = -1;
  }, [stepIndex]);
  useEffect(() => {
    if (!line || !onRoute || !ends.length) return;
    if (advancedFor.current === stepIndex) return;
    const geoIdx = stepIndexAt(ends, along);
    const arrived = idx >= lastIdx && remaining <= 10;
    if (geoIdx > stepIndex || arrived) {
      advancedFor.current = stepIndex;
      session.advance();
    }
  }, [along, onRoute, stepIndex, line, ends, idx, lastIdx, remaining, session]);

  // ---- voice cues (step text itself is read by the parent on step change)
  const say = useCallback(
    (t: string) => {
      if (voiceAllowed && !muted) speak(t);
    },
    [voiceAllowed, muted, speak]
  );
  const announced = useRef(new Set<string>());
  useEffect(() => {
    if (!onRoute || !nextStep || idx >= lastIdx) return;
    const key = `pre-${idx}`;
    if (toNext < 28 && toNext > 7 && !announced.current.has(key)) {
      announced.current.add(key);
      say(`${c.navIn(round5(toNext))}. ${nextStep.instruction}`);
    }
  }, [toNext, onRoute, idx, lastIdx, nextStep, say, c]);
  const wasOff = useRef(false);
  useEffect(() => {
    if (offRoute && !wasOff.current) say(`${c.navOffRoute(Math.round(off))}. ${c.navOffRouteHint}`);
    if (!offRoute && wasOff.current && onRoute) say(c.navBackOn);
    wasOff.current = offRoute;
  }, [offRoute, onRoute, off, say, c]);
  useEffect(() => {
    if (muted) window.speechSynthesis?.cancel();
  }, [muted]);

  // ---- map camera
  const glide = useGlide(fix ? { lon: fix.lon, lat: fix.lat } : null);
  const bearing = useRef(0);
  const [mapBearing, setMapBearing] = useState(0);
  useEffect(() => {
    if (!fix || !follow || far) return;
    if (headingUp && fix.heading != null && (fix.simulated || (fix.speed ?? 1) > 0.3)) {
      bearing.current = bearing.current + angleDiff(fix.heading, bearing.current) * 0.5;
    }
    const b = headingUp ? bearing.current : 0;
    setMapBearing(b);
    mapRef.current?.easeTo({
      center: [fix.lon, fix.lat],
      bearing: b,
      pitch: headingUp ? 48 : 0,
      zoom: 18.2,
      duration: 900,
      essential: true,
    });
  }, [fix, follow, headingUp, far]);

  // Away from the route (not on campus): frame both the user and the route start once.
  const framed = useRef(false);
  useEffect(() => {
    if (!line) return;
    if (fix && !far) return;
    if (framed.current && !far) return;
    framed.current = true;
    const pts = [...line.pts, ...(fix ? [[fix.lon, fix.lat] as [number, number]] : [])];
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    mapRef.current?.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], {
      padding: { top: 190, bottom: 210, left: 40, right: 40 },
      maxZoom: 18,
      duration: 800,
      pitch: 0,
      bearing: 0,
    });
  }, [line, far, fix]);

  const recenter = () => {
    setFollow(true);
    if (fix) mapRef.current?.easeTo({ center: [fix.lon, fix.lat], zoom: 18.2, duration: 500 });
  };

  // ---- map data
  const doneKey = Math.round(along);
  const doneFc = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: line ? slice(line, 0, along) : [] },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [line, doneKey]
  );
  const aheadFc = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: line ? slice(line, along, total) : [] },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [line, doneKey]
  );
  const stepMarkers = useMemo(
    () => (line ? ends.slice(0, -1).map((d, i) => ({ i: i + 1, at: pointAt(line, d), d })) : []),
    [line, ends]
  );
  const nearBarriers = useMemo(
    () => (line ? barriers.filter((b) => b.blocks !== 'none' && project(line, b.lon, b.lat).off < 35) : []),
    [line, barriers]
  );
  const maneuvers = useMemo(
    () => (line ? ends.map((d, i) => (i >= ends.length - 1 ? ('arrive' as Maneuver) : maneuverAt(line, d))) : []),
    [line, ends]
  );

  if (!line || !steps.length) return null;

  const upcoming: Maneuver = idx >= lastIdx ? 'arrive' : maneuvers[idx] ?? 'straight';
  const ManIcon = upcoming === 'arrive' ? Flag : steps[idx + 1]?.type === 'cross' ? TrafficCone : MANEUVER_ICON[upcoming];
  const current = steps[idx];
  const gpsLabel =
    gps.status === 'denied' ? c.navGpsWeak : !fix ? c.navGpsSearching : fix.simulated ? c.navDemoBadge : c.navAccuracy(fix.accuracy);
  const gpsTone = !fix ? 'bg-[var(--status-amber)]' : fix.accuracy > 30 ? 'bg-[var(--status-amber)]' : 'bg-[var(--status-good)]';

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0d10] overflow-hidden" role="region" aria-label={c.navSteps}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: line.pts[0][0], latitude: line.pts[0][1], zoom: 17.2 }}
        mapStyle={satellite ? SATELLITE_STYLE : STREET_STYLE}
        style={{ position: 'absolute', inset: 0 }}
        attributionControl={false}
        maxPitch={60}
        onDragStart={(e) => e.originalEvent && setFollow(false)}
        onRotateStart={(e) => e.originalEvent && setFollow(false)}
        onZoomStart={(e) => e.originalEvent && setFollow(false)}
        onRotate={(e) => setMapBearing(e.viewState.bearing)}
      >
        <Source id="nav-done" type="geojson" data={doneFc}>
          <Layer id="nav-done-line" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#94a3b8', 'line-width': 8, 'line-opacity': 0.9 }} />
        </Source>
        <Source id="nav-ahead" type="geojson" data={aheadFc}>
          <Layer id="nav-ahead-casing" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#ffffff', 'line-width': 13 }} />
          <Layer id="nav-ahead-line" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': ROUTE_BLUE, 'line-width': 8 }} />
        </Source>

        {nearBarriers.map((b) => (
          <Marker key={b.external_id} longitude={b.lon} latitude={b.lat} anchor="center">
            <span className="grid place-items-center w-6 h-6 rounded-full bg-white border-2 border-[#d62828] text-[#d62828] shadow">
              <Ban className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </Marker>
        ))}

        {stepMarkers.map((m) => {
          const done = along > m.d - 6;
          const isNext = m.i === idx + 1;
          return (
            <Marker key={m.i} longitude={m.at[0]} latitude={m.at[1]} anchor="center">
              <span
                className={`grid place-items-center rounded-full border-2 font-mono-tabular font-extrabold shadow transition-all ${
                  done
                    ? 'w-5 h-5 bg-slate-400 border-white text-white text-[9px]'
                    : isNext
                      ? 'w-8 h-8 bg-[var(--tactile-yellow)] border-[#17181b] text-[#17181b] text-sm scale-110'
                      : 'w-6 h-6 bg-white border-[#17181b] text-[#17181b] text-[11px]'
                }`}
              >
                {done ? <Check className="w-3 h-3" aria-hidden="true" /> : m.i + 1}
              </span>
            </Marker>
          );
        })}

        <Marker longitude={line.pts[line.pts.length - 1][0]} latitude={line.pts[line.pts.length - 1][1]} anchor="bottom">
          <div className="flex flex-col items-center drop-shadow-lg">
            <span className="px-2 py-1 mb-1 max-w-[140px] truncate rounded-lg bg-[#17181b] text-white text-[11px] font-bold">{destName}</span>
            <span className="w-9 h-9 rounded-full bg-[var(--tactile-yellow)] border-[3px] border-[#17181b] grid place-items-center">
              <Flag className="w-4 h-4 text-[#17181b]" aria-hidden="true" />
            </span>
          </div>
        </Marker>

        {glide && (
          <Marker longitude={glide.lon} latitude={glide.lat} anchor="center" rotation={fix?.heading ?? 0} rotationAlignment="map" pitchAlignment="map">
            <span role="img" aria-label={c.navHeading} className="relative grid place-items-center w-14 h-14">
              <span className="absolute inset-0 rounded-full bg-blue-500/25 animate-ping" />
              {fix?.heading != null && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[10px] border-x-transparent border-b-[18px] border-b-blue-600"
                />
              )}
              <span className="relative w-6 h-6 rounded-full bg-blue-600 border-[4px] border-white shadow-lg" />
            </span>
          </Marker>
        )}
      </Map>

      {/* ============ Top: next maneuver ============ */}
      <div className="absolute inset-x-0 top-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] space-y-2 pointer-events-none">
        <motion.div layout className="pointer-events-auto rounded-3xl bg-[#17181b] text-white shadow-2xl overflow-hidden border border-white/10">
          <div className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--tactile-yellow)] text-[#17181b] grid place-items-center shrink-0">
              <ManIcon className="w-10 h-10" strokeWidth={2.6} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1" aria-live="polite">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono-tabular leading-none">{toNext < 8 ? c.navNow : fmtDist(toNext)}</span>
                <span className="text-[11px] font-bold opacity-60 uppercase tracking-wide">{c.navStepOf(idx + 1, steps.length)}</span>
              </div>
              <div className="text-base font-bold leading-snug mt-1 line-clamp-2">
                {idx >= lastIdx ? current?.instruction : nextStep?.instruction}
              </div>
            </div>
          </div>
          {idx < lastIdx && (
            <div className="px-4 py-2 bg-white/10 text-xs font-semibold flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden="true" />
              <span className="truncate">{current?.instruction}</span>
              {current?.warning && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--status-amber)]/90 text-[#17181b] text-[10px] font-extrabold">{current.warning}</span>
              )}
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {offRoute && (
            <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="pointer-events-auto rounded-2xl bg-[var(--status-amber)] text-[#17181b] px-4 py-3 shadow-xl flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <div>
                <div className="font-extrabold text-sm">{c.navOffRoute(Math.round(off))}</div>
                <div className="text-xs font-semibold">{c.navOffRouteHint}</div>
              </div>
            </motion.div>
          )}
          {!fix && !demo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto rounded-2xl bg-white/95 text-[#17181b] px-4 py-2.5 shadow-xl flex items-center gap-2 text-sm font-bold">
              <LocateFixed className="w-4 h-4 animate-pulse" aria-hidden="true" />
              {gpsLabel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============ Right: map controls ============ */}
      <div className="absolute right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+9.5rem)] flex flex-col gap-2">
        <RoundBtn label={c.navCompass} onClick={() => setHeadingUp((v) => !v)} active={headingUp}>
          <Compass className="w-5 h-5" style={{ transform: `rotate(${-mapBearing}deg)` }} aria-hidden="true" />
        </RoundBtn>
        <RoundBtn label={satellite ? c.navStreet : c.navSatellite} onClick={() => setSatellite((v) => !v)} active={satellite}>
          <Layers className="w-5 h-5" aria-hidden="true" />
        </RoundBtn>
        {voiceAllowed && (
          <RoundBtn label={muted ? c.navUnmute : c.navMute} onClick={onToggleMute} active={muted}>
            {muted ? <VolumeX className="w-5 h-5" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
          </RoundBtn>
        )}
      </div>

      {/* Recenter */}
      <AnimatePresence>
        {!follow && fix && !far && (
          <motion.button
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={recenter}
            className="absolute left-3 bottom-[calc(11.5rem+env(safe-area-inset-bottom))] h-12 px-4 rounded-full bg-blue-600 text-white font-extrabold text-sm shadow-xl inline-flex items-center gap-2"
          >
            <LocateFixed className="w-5 h-5" aria-hidden="true" />
            {c.navRecenter}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Far from the route: offer the demo walk */}
      <AnimatePresence>
        {far && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-3 bottom-[calc(11rem+env(safe-area-inset-bottom))] rounded-3xl bg-white text-[#17181b] shadow-2xl p-4 space-y-3">
            <div>
              <div className="font-extrabold">{c.navFar}</div>
              <div className="text-sm font-semibold text-[#5b5f66]">{c.navFarHint}</div>
            </div>
            <button type="button" onClick={() => setDemo(true)} className="w-full h-12 rounded-2xl bg-[#17181b] text-white font-extrabold inline-flex items-center justify-center gap-2">
              <Play className="w-4 h-4" aria-hidden="true" />
              {c.navDemo}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Bottom sheet ============ */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-2xl rounded-t-[28px] bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] border-t border-[var(--border-line)]">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={c.navSteps}
            className="w-full pt-2 pb-1 grid place-items-center"
          >
            <span className="w-10 h-1.5 rounded-full bg-[var(--border-line)]" />
          </button>

          <div className="px-5 pb-3 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-mono-tabular">{etaMin}</span>
                <span className="text-sm font-bold text-[var(--ink-secondary)]">{c.navMin}</span>
                <span className="text-sm font-bold text-[var(--ink-secondary)]">· {fmtDist(remaining)} {c.navRemaining}</span>
              </div>
              <div className="text-xs font-semibold text-[var(--ink-secondary)] flex items-center gap-2 mt-0.5">
                <span>
                  {c.navEta} {arriveAt}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${gpsTone}`} />
                  {gpsLabel}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="h-11 px-3.5 rounded-xl border-2 border-[var(--border-line)] text-xs font-bold inline-flex items-center gap-1.5"
            >
              {c.navSteps}
              <ChevronUp className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {/* progress */}
          <div className="px-5 pb-3">
            <div className="relative h-2 rounded-full bg-[var(--bg-subtle)]">
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-blue-600" animate={{ width: `${total ? Math.min(100, (along / total) * 100) : 0}%` }} transition={{ ease: 'linear', duration: 0.4 }} />
              {ends.slice(0, -1).map((d, i) => (
                <span key={i} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--ink-primary)]/50" style={{ left: `${(d / total) * 100}%` }} />
              ))}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <ol className="px-5 pb-3 space-y-1.5 max-h-[34dvh] overflow-y-auto">
                  {steps.map((s, i) => {
                    const state = i < idx ? 'done' : i === idx ? 'now' : 'next';
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            const at = i === 0 ? line.pts[0] : pointAt(line, ends[i - 1]);
                            setFollow(false);
                            mapRef.current?.flyTo({ center: at, zoom: 18.5, pitch: 0, bearing: 0, duration: 700 });
                          }}
                          className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl border-2 ${
                            state === 'now' ? 'border-[var(--ink-primary)] bg-[var(--tactile-yellow-soft)]' : 'border-transparent'
                          } ${state === 'done' ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full grid place-items-center text-xs font-extrabold font-mono-tabular shrink-0 ${
                              state === 'done' ? 'bg-[var(--status-good)] text-white' : state === 'now' ? 'bg-[var(--tactile-yellow)] border-2 border-[var(--ink-primary)]' : 'bg-[var(--bg-subtle)]'
                            }`}
                          >
                            {state === 'done' ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold leading-snug">{s.instruction}</span>
                            {s.warning && <span className="block text-[11px] font-bold text-[var(--status-amber)]">{s.warning}</span>}
                          </span>
                          <span className="text-xs font-mono-tabular font-bold text-[var(--ink-secondary)] shrink-0">{s.distance_m} m</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                {session.trackUrl && (
                  <div className="px-5 pb-3">
                    <ShareTrip url={session.trackUrl} language={language} contact={contact} placeName={destName} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] grid grid-cols-[1fr_auto_auto] gap-2.5 items-center">
            <button
              type="button"
              onClick={onStop}
              className="h-14 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-extrabold inline-flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4 fill-current" aria-hidden="true" />
              {c.navEnd}
            </button>
            {demo ? (
              <button type="button" onClick={() => setDemo(false)} className="h-14 px-4 rounded-2xl border-2 border-[var(--ink-primary)] bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-xs font-extrabold">
                {c.navDemoStop}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDemo(true)}
                aria-label={c.navDemo}
                title={c.navDemo}
                className="h-14 w-14 rounded-2xl border-2 border-[var(--border-line)] grid place-items-center"
              >
                <Play className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
            <HoldButton
              holdMs={2000}
              onActivate={() => session.triggerSos('manual')}
              className="h-14 px-4 rounded-2xl border-2 border-[var(--status-red)] text-[var(--status-red)] text-xs font-extrabold"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                {S.sosHold}
              </span>
            </HoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoundBtn({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`w-12 h-12 rounded-full grid place-items-center shadow-xl border-2 ${
        active ? 'bg-[var(--tactile-yellow)] border-[#17181b] text-[#17181b]' : 'bg-white border-white text-[#17181b]'
      }`}
    >
      {children}
    </button>
  );
}
