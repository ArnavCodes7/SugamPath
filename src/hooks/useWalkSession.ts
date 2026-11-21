import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { backend, newToken, trackUrlFor } from '../services/backend';
import { SAFE } from '../lib/i18nSafety';
import { AudioGuide, vibrate } from '../lib/safety/audioGuide';
import { mapBearing } from '../lib/safety/effort';
import { readBattery, requestWakeLock, speak, warmUpPermissions } from '../lib/safety/device';
import { reportHazardLocal } from '../lib/safety/hazards';
import { clearActiveTrip, saveActiveTrip, saveProgress } from '../lib/safety/offlineCache';
import { haversineM, PocketPulseSensor, type PulseEvent } from '../lib/safety/pocketPulse';
import { recordWalk } from '../lib/safety/surfaceStore';
import type {
  ActiveTrip,
  EmergencyContact,
  GeoFix,
  HazardKind,
  HazardSource,
  SosEvent,
  TripState,
} from '../types/safety';
import type { LanguageCode } from '../types/sugampath';

export interface WalkRoute {
  routeId: string;
  placeId: string;
  placeName: string;
  gateName: string;
  title: string;
  steps: Array<{ id: string; instruction: string; distance_m: number }>;
  points: Array<{ x: number; y: number }>;
  cautions: string[];
}

interface Options {
  language: LanguageCode;
  contact: EmergencyContact | null;
  passiveMapping: boolean;
  visualOnly: boolean;
  route: WalkRoute;
  stepIndex: number;
  onStepChange: (i: number) => void;
}

export type WalkPhase = 'idle' | 'walking' | 'arrived';
export type SosState =
  | { state: 'idle' }
  | { state: 'countdown'; secondsLeft: number; kind: SosEvent['kind'] }
  | { state: 'sent'; kind: SosEvent['kind'] };

export const SOS_COUNTDOWN_S = 8;
const STEP_LENGTH_M = 0.65;
const ADVANCE_AT = 0.85; // advance when this share of a step's distance is walked
const TRIP_PUSH_MS = 5000;

/** Bearing (compass degrees) of the path during step i, taken from the route polyline (map north is up). */
export function bearingForStep(route: WalkRoute, i: number): number | null {
  const pts = route.points;
  if (pts.length < 2 || !route.steps.length) return null;
  const seg = Math.min(pts.length - 2, Math.floor((i * (pts.length - 1)) / route.steps.length));
  return mapBearing(pts[seg], pts[seg + 1]);
}

function gateBearingFrom(route: WalkRoute, i: number): number | null {
  const pts = route.points;
  if (pts.length < 2) return null;
  const seg = Math.min(pts.length - 2, Math.floor((i * (pts.length - 1)) / route.steps.length));
  return mapBearing(pts[seg], pts[pts.length - 1]);
}

export function useWalkSession(opts: Options) {
  const o = useRef(opts);
  o.current = opts;

  const [phase, setPhase] = useState<WalkPhase>('idle');
  const [sos, setSos] = useState<SosState>({ state: 'idle' });
  const [token, setToken] = useState<string | null>(null);
  const [mappedM, setMappedM] = useState(0);

  const audio = useMemo(() => new AudioGuide(), []);
  const sensor = useRef<PocketPulseSensor | null>(null);
  const releaseWake = useRef<(() => void) | null>(null);
  const tokenRef = useRef<string | null>(null);
  const phaseRef = useRef<WalkPhase>('idle');
  const sosRef = useRef<SosState>({ state: 'idle' });
  const countdownTimer = useRef<number | null>(null);
  const pushTimer = useRef<number | null>(null);
  const walked = useRef({ step: 0, total: 0 });
  const lastGpsAt = useRef(0);
  const lastFixRef = useRef<GeoFix | null>(null);
  const battery = useRef<number | null>(null);
  const streak = useRef<{ kind: string; n: number }>({ kind: '', n: 0 });
  const reportedKinds = useRef(new Set<string>());
  const stepIdx = useRef(opts.stepIndex);
  stepIdx.current = opts.stepIndex;

  const setPhaseBoth = (p: WalkPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const setSosBoth = (s: SosState) => {
    sosRef.current = s;
    setSos(s);
  };

  const buildTripState = useCallback((status: TripState['status']): TripState => {
    const { route, language, contact } = o.current;
    const i = Math.min(stepIdx.current, route.steps.length - 1);
    const fix = sensor.current?.position ?? null;
    return {
      token: tokenRef.current ?? '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      language,
      travellerLabel: '',
      placeName: route.placeName,
      gateName: route.gateName,
      routeTitle: route.title,
      totalSteps: route.steps.length,
      stepIndex: i,
      currentInstruction: route.steps[i]?.instruction ?? '',
      status,
      position: fix,
      battery: battery.current,
      cautions: route.cautions,
      contactName: contact?.name,
    };
  }, []);

  const pushTrip = useCallback((status?: TripState['status']) => {
    if (!tokenRef.current) return;
    const s = buildTripState(status ?? (sosRef.current.state === 'sent' ? 'sos' : 'walking'));
    void backend.updateTrip(tokenRef.current, {
      stepIndex: s.stepIndex,
      currentInstruction: s.currentInstruction,
      position: s.position,
      battery: s.battery,
      status: s.status,
    });
  }, [buildTripState]);

  // ------------------------------------------------------------------ hazards from passive sensing
  const reportHazard = useCallback((kind: HazardKind, source: HazardSource) => {
    const { route } = o.current;
    const at = Date.now();
    reportHazardLocal({ placeId: route.placeId, gateName: route.gateName, kind, source, at });
    void backend.reportHazard({ placeId: route.placeId, gateName: route.gateName, kind, source, at });
  }, []);

  // ------------------------------------------------------------------ SOS
  const sendSos = useCallback(async (kind: SosEvent['kind']) => {
    const event: SosEvent = {
      kind,
      at: Date.now(),
      position: sensor.current?.position ?? null,
      battery: battery.current,
    };
    setSosBoth({ state: 'sent', kind });
    vibrate([400, 150, 400]);
    if (tokenRef.current) await backend.raiseSos(tokenRef.current, event);
    const { language, contact, visualOnly } = o.current;
    if (!visualOnly) speak(SAFE[language].sosSentSpeech(contact?.name ?? null), language);
  }, []);

  const clearCountdown = () => {
    if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
    countdownTimer.current = null;
  };

  const triggerSos = useCallback((kind: SosEvent['kind']) => {
    if (sosRef.current.state !== 'idle') return;
    const { language, visualOnly } = o.current;
    let left = SOS_COUNTDOWN_S;
    setSosBoth({ state: 'countdown', secondsLeft: left, kind });
    vibrate([300, 100, 300]);
    audio.chime('beep');
    if (!visualOnly) speak(SAFE[language].sosCountdownSpeech, language);
    clearCountdown();
    countdownTimer.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearCountdown();
        void sendSos(kind);
        return;
      }
      setSosBoth({ state: 'countdown', secondsLeft: left, kind });
      audio.chime('beep');
      vibrate(200);
    }, 1000);
  }, [audio, sendSos]);

  const cancelSos = useCallback(() => {
    if (sosRef.current.state !== 'countdown') return;
    clearCountdown();
    setSosBoth({ state: 'idle' });
    audio.chime('cancel');
    const { language, visualOnly } = o.current;
    if (!visualOnly) speak(SAFE[language].sosCancelled, language);
  }, [audio]);

  const confirmSafe = useCallback(() => {
    if (sosRef.current.state !== 'sent') return;
    setSosBoth({ state: 'idle' });
    audio.chime('ok');
    if (tokenRef.current) void backend.resolveSos(tokenRef.current);
  }, [audio]);

  // ------------------------------------------------------------------ progress
  const advance = useCallback(() => {
    const { route, onStepChange } = o.current;
    walked.current.step = 0;
    if (stepIdx.current >= route.steps.length - 1) {
      setPhaseBoth('arrived');
      pushTrip('arrived');
      return;
    }
    const next = stepIdx.current + 1;
    stepIdx.current = next;
    onStepChange(next);
    saveProgress(next);
    pushTrip();
  }, [pushTrip]);

  const addDistance = useCallback((m: number) => {
    if (phaseRef.current !== 'walking' || sosRef.current.state === 'countdown') return;
    walked.current.step += m;
    walked.current.total += m;
    const step = o.current.route.steps[stepIdx.current];
    if (step && walked.current.step >= step.distance_m * ADVANCE_AT) advance();
  }, [advance]);

  /** Metres left in the current step, rounded to 5 for speech. */
  const distanceLeftM = useCallback(() => {
    const step = o.current.route.steps[stepIdx.current];
    if (!step) return 0;
    return Math.max(5, Math.round((step.distance_m - walked.current.step) / 5) * 5);
  }, []);

  const handlePulse = useCallback((e: PulseEvent) => {
    if (e.type === 'fall') {
      triggerSos('fall');
      return;
    }
    if (e.type === 'step') {
      // Footfalls move us along only when GPS has gone quiet (tunnels, basements).
      if (Date.now() - lastGpsAt.current > 8000) addDistance(STEP_LENGTH_M);
      return;
    }
    // Three same-kind 2 s windows in a row = a real surface, not a blip.
    const s = streak.current;
    if (s.kind === e.type) s.n++;
    else {
      s.kind = e.type;
      s.n = 1;
    }
    if (s.n >= 3 && o.current.passiveMapping && e.confidence >= 0.5) {
      const kind: HazardKind | null = e.type === 'stairs' ? 'stairs' : e.type === 'rough' ? 'rough_surface' : null;
      if (kind && !reportedKinds.current.has(kind)) {
        reportedKinds.current.add(kind);
        reportHazard(kind, 'pocket-pulse');
      }
    }
  }, [addDistance, reportHazard, triggerSos]);

  const handleFix = useCallback((fix: GeoFix) => {
    const prev = lastFixRef.current;
    lastFixRef.current = fix;
    lastGpsAt.current = Date.now();
    if (prev && (fix.accuracy ?? 0) <= 30) {
      const d = haversineM(prev, fix);
      if (d >= 2 && d < 60) addDistance(d);
    }
  }, [addDistance]);

  // ------------------------------------------------------------------ lifecycle
  const teardown = useCallback(() => {
    clearCountdown();
    if (pushTimer.current !== null) window.clearInterval(pushTimer.current);
    pushTimer.current = null;
    sensor.current?.stop();
    audio.stopCompass();
    releaseWake.current?.();
    releaseWake.current = null;
  }, [audio]);

  const flushSurface = useCallback(() => {
    const samples = sensor.current?.samples ?? [];
    if (!samples.length) return;
    recordWalk(o.current.route.routeId, 'accessible', samples);
    if (o.current.passiveMapping) {
      void backend.submitSurfaceSamples(samples.map((s) => ({ ...s, placeId: o.current.route.placeId })));
    }
    sensor.current!.samples.length = 0;
  }, []);

  /** Must be called from a tap. */
  const start = useCallback(async (opts2: { resume?: ActiveTrip; warmUp?: boolean } = {}) => {
    if (phaseRef.current === 'walking') return;
    const { route, language, contact } = o.current;

    // Kick off every permission request inside the gesture, then wait for them together.
    const motionP = PocketPulseSensor.requestPermission();
    const audioP = audio.unlock();
    const compassP = audio.startCompass();
    const wakeP = requestWakeLock();
    const warmP = opts2.warmUp ? warmUpPermissions() : Promise.resolve();
    await Promise.allSettled([motionP, audioP, compassP, warmP]);
    releaseWake.current = await wakeP;
    battery.current = await readBattery();

    walked.current = { step: 0, total: 0 };
    streak.current = { kind: '', n: 0 };
    reportedKinds.current.clear();
    lastFixRef.current = null;

    const tok = opts2.resume?.token ?? newToken();
    tokenRef.current = tok;
    setToken(tok);

    sensor.current = new PocketPulseSensor({ onEvent: handlePulse, onFix: handleFix });
    sensor.current.start();

    // Offline Corridor Survival: cache everything before the first step.
    const startIndex = opts2.resume?.stepIndex ?? 0;
    stepIdx.current = startIndex;
    o.current.onStepChange(startIndex);
    const trip: ActiveTrip = {
      token: tok,
      startedAt: opts2.resume?.startedAt ?? Date.now(),
      placeId: route.placeId,
      placeName: route.placeName,
      routeId: route.routeId,
      gateName: route.gateName,
      language,
      steps: route.steps.map((s, i) => ({
        id: s.id,
        instruction: s.instruction,
        distance_m: s.distance_m,
        bearing: bearingForStep(route, i),
      })),
      stepIndex: startIndex,
      gateBearing: gateBearingFrom(route, 0),
      cautions: route.cautions,
      contact,
    };
    void saveActiveTrip(trip);

    if (opts2.resume) pushTrip('walking');
    else void backend.createTrip(buildTripState('walking'));

    pushTimer.current = window.setInterval(async () => {
      battery.current = (await readBattery()) ?? battery.current;
      pushTrip();
    }, TRIP_PUSH_MS);

    setSosBoth({ state: 'idle' });
    setPhaseBoth('walking');
  }, [audio, buildTripState, handleFix, handlePulse, pushTrip]);

  /** Walk finished (arrival check pending). Sensors stop, trip stays visible to family as "arrived". */
  const finishArrival = useCallback(() => {
    teardown();
    setMappedM(Math.round(walked.current.total));
    flushSurface();
    void clearActiveTrip();
  }, [flushSurface, teardown]);

  useEffect(() => {
    if (phase === 'arrived') finishArrival();
  }, [phase, finishArrival]);

  /** Back to idle. `ended` marks the family link as finished. */
  const stop = useCallback((ended = true) => {
    if (phaseRef.current === 'walking') flushSurface();
    teardown();
    if (tokenRef.current && ended && phaseRef.current !== 'arrived') {
      void backend.updateTrip(tokenRef.current, { status: 'ended' });
    }
    void clearActiveTrip();
    setSosBoth({ state: 'idle' });
    setPhaseBoth('idle');
  }, [flushSurface, teardown]);

  useEffect(
    () => () => {
      teardown();
    },
    [teardown]
  );

  // Keep the family page's text in step with the language/route even before the first push.
  const trackUrl = token ? trackUrlFor(token) : null;

  return {
    phase,
    sos,
    token,
    trackUrl,
    audio,
    mappedM,
    start,
    stop,
    advance,
    triggerSos,
    cancelSos,
    confirmSafe,
    distanceLeftM,
    reportHazard,
    position: () => sensor.current?.position ?? null,
    bearing: () => bearingForStep(o.current.route, stepIdx.current),
    gateBearing: () => gateBearingFrom(o.current.route, stepIdx.current),
  };
}

export type WalkSession = ReturnType<typeof useWalkSession>;
