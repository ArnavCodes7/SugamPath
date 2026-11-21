import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bus,
  CheckCircle2,
  Footprints,
  ListChecks,
  Loader2,
  Map as MapIcon,
  Mic,
  MicOff,
  Navigation,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  getSpeechLocale,
  localizeGateName,
  STRINGS,
} from '../lib/i18n';
import type { SamplePhotoKey } from '../lib/mockPhotoAudit';
import type { ScoringResult } from '../lib/scoring';
import type {
  AuditFindings,
  CitySlug,
  Gate,
  LanguageCode,
  Place,
  TravelMode,
} from '../types/sugampath';
import { CampusMap, type CampusRoute } from './campus/CampusMap';
import { useCampusData } from '../hooks/useCampusData';
import { placeFacts, snapBarriers, type PlaceFacts } from '../lib/campusRouter';
import { buildRouteOption, EMPTY_ROUTE } from '../lib/routeNarration';
import type { PathProps } from '../lib/accessibility-types';
import { CAMPUS_STRINGS } from './campus/strings';
import { RouteNavPanel } from './campus/RouteNavPanel';
import { backend } from '../services/backend';
import { useWalkSession, type WalkRoute } from '../hooks/useWalkSession';
import { cautionText, effortLine, SAFE } from '../lib/i18nSafety';
import { computeEffort } from '../lib/safety/effort';
import { useMeasuredSlope } from '../lib/safety/elevation';
import { getActiveHazards, HAZARDS_CHANGED_EVENT, reportHazardLocal } from '../lib/safety/hazards';
import { loadActiveTrip } from '../lib/safety/offlineCache';
import type { ActiveTrip, EmergencyContact } from '../types/safety';
import { ArrivalCheck } from './safety/ArrivalCheck';
import { BlindWalkingMode } from './safety/BlindWalkingMode';
import { CautionList } from './safety/CautionList';
import { EmergencyContactCard } from './safety/EmergencyContactCard';
import { HoldButton } from './safety/HoldButton';
import { ShareTrip } from './safety/ShareTrip';
import { SosOverlay } from './safety/SosOverlay';
import { PhotoAuditWizard } from './PhotoAuditWizard';

// Heavy screens load on demand (keeps first load and the PWA precache small).
const CommunitySection = lazy(() => import('./community/CommunitySection').then((m) => ({ default: m.CommunitySection })));
const LiveNavigation = lazy(() => import('./campus/LiveNavigation').then((m) => ({ default: m.LiveNavigation })));
const screenFallback = (
  <div role="status" className="grid place-items-center py-24 text-sm font-semibold text-[var(--ink-secondary)]">
    <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
  </div>
);
import { ScoreBadge, TrustLabelText } from './ScoreBadge';

export type TravellerTab = 'home' | 'route' | 'community';

interface TravellerAppProps {
  tab: TravellerTab;
  onTabChange: (tab: TravellerTab) => void;
  places: Place[];
  city: CitySlug;
  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;
  language: LanguageCode;
  voiceEnabled: boolean;
  visualOnly?: boolean;
  isOffline: boolean;
  onToggleOffline: () => void;
  onOpenPreferences: () => void;
  emergencyContact: EmergencyContact | null;
  passiveMapping: boolean;
  onSaveContact: (c: EmergencyContact) => void;
  onVerifyGate: (placeId: string, gateId: string, vote: 'confirm' | 'dispute') => void;
  onFocusPlaceCity: (placeId: string) => void;
  onAuditComplete: (payload: {
    placeId: string;
    result: ScoringResult;
    findings: AuditFindings;
    photoUrl: string;
    sceneText: string;
    sampleKey?: SamplePhotoKey;
  }) => void;
}

function getPlaceName(place: Place, lang: LanguageCode): string {
  if (lang === 'hi' && place.name_hi) return place.name_hi;
  if (lang === 'pa' && place.name_pa) return place.name_pa;
  return place.name;
}

function getPlaceScore(place: Place, mode: TravelMode): number | null {
  if (mode === 'wheelchair') return place.score_wheelchair;
  if (mode === 'blind') return place.score_blind;
  if (mode === 'walker') return place.score_walker;
  const vals = [place.score_wheelchair, place.score_blind, place.score_walker].filter(
    (n): n is number => typeof n === 'number'
  );
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

function getGateScore(gate: Gate, mode: TravelMode): number {
  if (mode === 'wheelchair') return gate.score_wheelchair;
  if (mode === 'blind') return gate.score_blind;
  if (mode === 'walker') return gate.score_walker;
  return Math.round((gate.score_wheelchair + gate.score_blind + gate.score_walker) / 3);
}

export function TravellerApp({
  tab,
  onTabChange,
  places,
  city,
  mode,
  onModeChange,
  language,
  voiceEnabled,
  visualOnly = false,
  isOffline,
  onToggleOffline,
  onOpenPreferences,
  emergencyContact,
  passiveMapping,
  onSaveContact,
  onVerifyGate,
  onFocusPlaceCity,
  onAuditComplete,
}: TravellerAppProps) {
  const t = STRINGS[language];
  const S = SAFE[language];
  const isBlindSafeMode = mode === 'blind';
  const allowVoice = !visualOnly && (voiceEnabled || isBlindSafeMode);

  const cityPlaces = useMemo(() => places.filter((p) => p.city === city), [places, city]);
  const [search, setSearch] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    cityPlaces[0]?.id || places[0].id
  );

  // Clean optional sub-sheets (Gates / Buses / Simple Map)
  const [detailSheet, setDetailSheet] = useState<'gates' | 'buses' | null>(null);
  const [showOptionalMap, setShowOptionalMap] = useState(false);
  // Destination handed to the Safe Path map ("Route here").
  const [routeTo, setRouteTo] = useState<string | null>(null);
  const [routeFrom, setRouteFrom] = useState<string | null>(null);
  const routeFromHere = (placeId: string) => {
    stopSpeaking();
    setRouteFrom(placeId);
    onTabChange('route');
  };
  const routeHere = (placeId: string) => {
    stopSpeaking();
    setRouteTo(placeId);
    onTabChange('route');
  };

  // Step-by-step focus mode
  const [stepFocusActive, setStepFocusActive] = useState(false);
  const [stepFocusIndex, setStepFocusIndex] = useState(0);

  // Voice & Mic
  const [micOpen, setMicOpen] = useState(false);
  const [voiceReply, setVoiceReply] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Gate verification & images
  const [votedGates, setVotedGates] = useState<Record<string, boolean>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const blindWelcomedRef = useRef<string | null>(null);

  useEffect(() => {
    const currentInCity = places.find((p) => p.id === selectedPlaceId && p.city === city);
    if (!currentInCity) {
      const firstInCity = places.find((p) => p.city === city);
      if (firstInCity) setSelectedPlaceId(firstInCity.id);
      setStepFocusActive(false);
      setStepFocusIndex(0);
      setShowOptionalMap(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const speakText = (text: string) => {
    if (!allowVoice || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = getSpeechLocale(language);
    u.rate = 0.92;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Never let this screen's voice continue after the screen is replaced.
  useEffect(() => stopSpeaking, []);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || cityPlaces[0] || places[0];
  const sortedGates = useMemo(
    () => [...selectedPlace.gates].sort((a, b) => getGateScore(b, mode) - getGateScore(a, mode)),
    [selectedPlace, mode]
  );
  const bestGate = sortedGates[0];
  const bestGateVoted = bestGate ? votedGates[bestGate.id] : false;

  // ------------------------------------------------------------------
  // Real campus route (from the Safe Path map) -> navigation route
  // ------------------------------------------------------------------
  const campus = useCampusData();
  const snappedBarriers = useMemo(() => snapBarriers(campus.network, campus.barriers), [campus.network, campus.barriers]);
  const propsByExt = useMemo(() => {
    const m = new Map<string, PathProps>();
    for (const f of campus.network?.features ?? []) m.set(f.properties.external_id, f.properties);
    return m;
  }, [campus.network]);
  const [liveRoute, setLiveRoute] = useState<CampusRoute | null>(null);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const factsFor = (place: Place) => placeFacts(campus.network, campus.barriers, place.lng, place.lat);
  const selectedFacts = useMemo(
    () => placeFacts(campus.network, campus.barriers, selectedPlace.lng, selectedPlace.lat),
    [campus.network, campus.barriers, selectedPlace]
  );
  const placeTypeLabel = (place: Place) => {
    const row = campus.places?.find((r) => r.external_id === place.id);
    return CAMPUS_STRINGS[language].types[row?.place_type ?? 'other'] ?? '';
  };
  const factChips = (f: PlaceFacts): string[] => {
    const c = CAMPUS_STRINGS[language];
    const surface =
      f.smoothPct === null ? c.noData : f.smoothPct >= 70 ? c.mostlySmooth : f.smoothPct >= 40 ? c.mixed : c.mostlyRough;
    return [
      `${c.surface}: ${surface}`,
      f.barriers ? `${f.barriers} ${c.barriersNearby}` : `${c.barrier}: ${c.noneNearby}`,
      f.steps ? c.stepsNearby : `${t.steps}: ${c.noneNearby}`,
    ];
  };
  const destRow = useMemo(
    () => (liveRoute ? campus.places?.find((p) => p.external_id === liveRoute.to) ?? null : null),
    [liveRoute, campus.places]
  );
  const fromRow = useMemo(
    () => (liveRoute ? campus.places?.find((p) => p.external_id === liveRoute.from) ?? null : null),
    [liveRoute, campus.places]
  );
  const built = useMemo(() => {
    if (!liveRoute || !destRow) return null;
    const accessible = buildRouteOption(liveRoute.legs, propsByExt, snappedBarriers, mode, 'accessible', destRow, language);
    const standard = liveRoute.standardLegs.length
      ? buildRouteOption(liveRoute.standardLegs, propsByExt, snappedBarriers, 'standard', 'standard', destRow, language)
      : accessible;
    return { accessible, standard };
  }, [liveRoute, destRow, propsByExt, snappedBarriers, mode, language]);
  const routeCompare = useMemo(
    () => ({
      standard: built ? { ...built.standard.option, kind: 'standard' as const } : EMPTY_ROUTE,
      accessible: built?.accessible.option ?? EMPTY_ROUTE,
    }),
    [built]
  );
  const hasRoute = !!built && routeCompare.accessible.steps.length > 0;
  const routeId = liveRoute ? `${liveRoute.from}>${liveRoute.to}:${mode}` : 'none';
  const routeTitle = fromRow && destRow ? `${fromRow.name} → ${destRow.name}` : '';
  const localizedSteps = routeCompare.accessible.steps;

  // ------------------------------------------------------------------
  // Safety layer: hazards, effort, walk session (one Start for every mode)
  // ------------------------------------------------------------------
  const routePlace = (destRow && places.find((p) => p.id === destRow.external_id)) || selectedPlace;
  const [hazardTick, setHazardTick] = useState(0);
  useEffect(() => {
    const bump = () => setHazardTick((n) => n + 1);
    window.addEventListener(HAZARDS_CHANGED_EVENT, bump);
    const id = window.setInterval(bump, 60_000); // transient cautions expire on their own
    return () => {
      window.removeEventListener(HAZARDS_CHANGED_EVENT, bump);
      window.clearInterval(id);
    };
  }, []);
  const hazards = useMemo(
    () => getActiveHazards(routePlace.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routePlace.id, hazardTick]
  );
  const stdGate = routeCompare.standard.gate_chosen;
  const accGate = routeCompare.accessible.gate_chosen;
  const routeHazards = useMemo(
    () => hazards.filter((h) => h.gateName === accGate || h.gateName === stdGate),
    [hazards, accGate, stdGate]
  );

  const stdSlope = useMeasuredSlope(routeId, 'std', routeCompare.standard, routePlace);
  const accSlope = useMeasuredSlope(routeId, 'acc', routeCompare.accessible, routePlace);
  const effortStd = useMemo(
    () =>
      computeEffort(routeCompare.standard, {
        mode,
        hazards,
        smoothPct: built?.standard.smoothPct ?? 100,
        measuredSlopeDeg: stdSlope,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routeCompare, mode, hazards, stdSlope, hazardTick]
  );
  const effortAcc = useMemo(
    () =>
      computeEffort(routeCompare.accessible, {
        mode,
        hazards,
        smoothPct: built?.accessible.smoothPct ?? 100,
        measuredSlopeDeg: accSlope,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routeCompare, mode, hazards, accSlope, hazardTick]
  );
  // Barriers weigh like stairs: impassable for wheelchairs, hard for walkers / blind users.
  const barrierWeight = mode === 'wheelchair' ? 1000 : mode === 'walker' ? 150 : mode === 'blind' ? 100 : 0;
  const stdBarriers = built?.standard.wheelchairBarriers ?? 0;
  const accBarriers = built?.accessible.wheelchairBarriers ?? 0;
  const easiestIsAccessible =
    effortAcc.score + accBarriers * barrierWeight <= effortStd.score + stdBarriers * barrierWeight;

  const walkRoute: WalkRoute = useMemo(
    () => ({
      routeId,
      placeId: routePlace.id,
      placeName: getPlaceName(routePlace, language),
      gateName: accGate,
      title: routeTitle,
      steps: localizedSteps.map((st) => ({ id: st.id, instruction: st.instruction, distance_m: st.distance_m })),
      points: routeCompare.accessible.points,
      cautions: [
        ...routeHazards.filter((h) => h.gateName === accGate).map((h) => cautionText(h, language)),
        ...routeCompare.accessible.warnings,
      ],
    }),
    [routeId, routePlace, language, accGate, routeTitle, localizedSteps, routeCompare, routeHazards]
  );

  const session = useWalkSession({
    language,
    contact: emergencyContact,
    passiveMapping,
    visualOnly,
    route: walkRoute,
    stepIndex: stepFocusIndex,
    onStepChange: setStepFocusIndex,
    geoDriven: true,
  });
  const walking = session.phase !== 'idle';
  const [navMuted, setNavMuted] = useState(false);

  // Live GPS dot on the map while navigating.
  const [livePos, setLivePos] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!walking) {
      setLivePos(null);
      return;
    }
    const id = window.setInterval(() => {
      const f = session.position();
      setLivePos(f ? { lat: f.lat, lng: f.lng } : null);
    }, 2000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walking]);

  // A new route resets the step card (unless a walk is in progress).
  useEffect(() => {
    if (walking) return;
    setStepFocusActive(false);
    setStepFocusIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const beginWalk = async () => {
    if (!hasRoute) {
      onTabChange('route');
      return;
    }
    setStepFocusActive(true);
    await session.start({ warmUp: isBlindSafeMode });
  };
  const endWalk = () => {
    session.stop();
    setStepFocusActive(false);
  };

  const gateName = routeCompare.accessible.gate_chosen;
  const handleArrivalAnswer = (stepFree: boolean) => {
    const gate = routePlace.gates.find((g) => g.name === gateName) || bestGate;
    if (gate) onVerifyGate(routePlace.id, gate.id, stepFree ? 'confirm' : 'dispute');
    const at = Date.now();
    void backend.submitArrivalCheck({ placeId: routePlace.id, gateName, stepFree, at });
    if (!stepFree) {
      // One "No" is a live caution (lift gate: 14-day maintenance, otherwise 3-hour transient). Never a permanent mark.
      const kind = gate?.lift_present === 'yes' ? 'broken_lift' : 'blocked_path';
      reportHazardLocal({ placeId: routePlace.id, gateName, kind, source: 'arrival-check', at });
      void backend.reportHazard({ placeId: routePlace.id, gateName, kind, source: 'arrival-check', at });
    }
  };
  const handleArrivalDone = () => {
    session.stop(false);
    setStepFocusActive(false);
    onTabChange('home');
  };

  // Non-blind users hear each step as it comes up (by tap on Next or by walking distance).
  useEffect(() => {
    if (isBlindSafeMode || !stepFocusActive || session.phase !== 'walking' || navMuted) return;
    speakText(localizedSteps[stepFocusIndex]?.instruction || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepFocusIndex, stepFocusActive, session.phase]);

  // Offline Corridor Survival: offer to pick an interrupted walk back up.
  const [resumable, setResumable] = useState<ActiveTrip | null>(null);
  const [pendingResume, setPendingResume] = useState<ActiveTrip | null>(null);
  useEffect(() => {
    // Only offer to resume trips to campus places (ignore stale demo trips).
    void loadActiveTrip().then((trip) => trip && places.some((p) => p.id === trip.placeId) && setResumable(trip));
  }, []);
  const doResume = async (trip: ActiveTrip) => {
    onTabChange('route');
    setStepFocusActive(true);
    await session.start({ resume: trip, warmUp: isBlindSafeMode });
  };
  const resumeWalk = () => {
    const trip = resumable;
    if (!trip) return;
    setResumable(null);
    if (trip.placeId === routePlace.id) {
      void doResume(trip);
    } else {
      onFocusPlaceCity(trip.placeId);
      setSelectedPlaceId(trip.placeId);
      setPendingResume(trip);
    }
  };
  useEffect(() => {
    if (pendingResume && routePlace.id === pendingResume.placeId) {
      const trip = pendingResume;
      setPendingResume(null);
      void doResume(trip);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingResume, routePlace.id]);

  const resumeBanner =
    resumable && !walking ? (
      <div role="status" className="p-4 rounded-2xl bg-[var(--tactile-yellow-soft)] border border-[var(--ink-primary)] space-y-3">
        <p className="text-sm font-bold text-[var(--ink-primary)]">{S.resumeTitle(resumable.placeName)}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={resumeWalk} className="py-3 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold min-h-[48px]">
            {S.resumeBtn}
          </button>
          <button type="button" onClick={() => setResumable(null)} className="py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-sm font-bold text-[var(--ink-primary)] min-h-[48px]">
            {S.resumeDismiss}
          </button>
        </div>
      </div>
    ) : null;

  // Automatic voice intro ONLY when Blind Safe Mode is active
  useEffect(() => {
    const key = `${mode}-${city}-${language}`;
    if (isBlindSafeMode && blindWelcomedRef.current !== key) {
      blindWelcomedRef.current = key;
      const gateText = bestGate ? localizeGateName(bestGate.name, language) : '';
      const placeText = getPlaceName(selectedPlace, language);
      const intro = `${t.blindAutoWelcome} ${placeText}. ${t.bestGateHeading}: ${gateText}.`;
      setVoiceReply(intro);
      speakText(intro);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, city, language]);

  const buildPlaceSummarySpeech = (place: Place) => {
    const best = [...place.gates].sort((a, b) => getGateScore(b, mode) - getGateScore(a, mode))[0];
    const pName = getPlaceName(place, language);
    if (!best) {
      const score = getPlaceScore(place, mode);
      return [pName, score !== null ? `${t.modes[mode]}: ${score}` : '', ...factChips(factsFor(place))].filter(Boolean).join('. ');
    }
    const gName = localizeGateName(best.name, language);
    const rampTxt = best.ramp_present === 'yes' ? `${t.ramp}: ${t.yes}` : `${t.ramp}: ${t.no}`;
    const liftTxt =
      best.lift_present === 'yes'
        ? `${t.lift}: ${best.lift_working === 'yes' ? t.working : t.broken}`
        : '';
    return `${pName}. ${t.bestGateHeading}: ${gName}. ${rampTxt}. ${liftTxt}`;
  };

  const handleSelectStation = (place: Place) => {
    stopSpeaking();
    setSelectedPlaceId(place.id);
    setStepFocusActive(false);
    setStepFocusIndex(0);
    if (isBlindSafeMode) {
      const msg = buildPlaceSummarySpeech(place);
      setVoiceReply(msg);
      speakText(msg);
    }
  };

  const handleVoiceCommand = (spokenQuery: string) => {
    stopSpeaking();
    setMicOpen(false);
    const q = spokenQuery.toLowerCase();

    const targetPlace =
      places.find((p) => q.includes(p.name.toLowerCase())) ||
      places.find((p) => p.name.toLowerCase().split(/[\s,-]+/).some((w) => w.length > 3 && q.includes(w))) ||
      selectedPlace;

    setSelectedPlaceId(targetPlace.id);
    onTabChange('home');

    const reply = buildPlaceSummarySpeech(targetPlace);
    setVoiceReply(reply);
    speakText(reply);
  };

  const startMic = () => {
    if (micOpen) {
      setMicOpen(false);
      return;
    }
    setMicOpen(true);

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec() as {
          lang: string;
          interimResults: boolean;
          onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
          onerror: () => void;
          start: () => void;
        };
        rec.lang = getSpeechLocale(language);
        rec.interimResults = false;
        rec.onresult = (event) => {
          const text = event.results[0]?.[0]?.transcript || '';
          if (text) handleVoiceCommand(text);
        };
        rec.onerror = () => {
          // Keep clickable sample prompts open
        };
        rec.start();
      } catch {
        // Keep clickable sample prompts open
      }
    }
  };

  const quickPlaces = search.trim()
    ? places.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.name_hi.toLowerCase().includes(q) ||
          p.name_pa.toLowerCase().includes(q) ||
          p.city_name.toLowerCase().includes(q)
        );
      })
    : cityPlaces;

  const handleViewOnMapFromAudit = (placeId: string) => {
    stopSpeaking();
    setSelectedPlaceId(placeId);
    onFocusPlaceCity(placeId);
    setRouteTo(placeId);
    onTabChange('route');
    if (isBlindSafeMode) {
      const target = places.find((p) => p.id === placeId);
      if (target) {
        const msg = buildPlaceSummarySpeech(target);
        setVoiceReply(msg);
        speakText(msg);
      }
    }
  };

  // Safe Path: live Thapar campus network + routing from Supabase (route_between_places).
  if (tab === 'route') {
    return (
      <>
        {isBlindSafeMode && walking && (
          <BlindWalkingMode
            session={session}
            route={walkRoute}
            stepIndex={stepFocusIndex}
            language={language}
            contact={emergencyContact}
            gateLabel={gateName}
            onExit={() => {
              endWalk();
              speakText(getPlaceName(routePlace, language));
            }}
            onArrivalAnswer={handleArrivalAnswer}
            onArrivalDone={handleArrivalDone}
          />
        )}
        {!isBlindSafeMode && <SosOverlay session={session} contact={emergencyContact} language={language} />}
        {!isBlindSafeMode && session.phase === 'arrived' && (
          <ArrivalCheck
            gateName={gateName}
            language={language}
            mappedM={session.mappedM}
            speakIt={allowVoice}
            onAnswer={handleArrivalAnswer}
            onDone={handleArrivalDone}
          />
        )}
        {!isBlindSafeMode && walking && liveRoute && session.phase === 'walking' && (
          <Suspense fallback={null}>
          <LiveNavigation
            language={language}
            mode={mode}
            legs={liveRoute.legs}
            steps={localizedSteps}
            stepIndex={stepFocusIndex}
            session={session}
            destName={getPlaceName(routePlace, language)}
            barriers={campus.barriers}
            contact={emergencyContact}
            voiceAllowed={allowVoice}
            muted={navMuted}
            onToggleMute={() => {
              if (!navMuted) stopSpeaking();
              setNavMuted((v) => !v);
            }}
            speak={speakText}
            onStop={endWalk}
          />
          </Suspense>
        )}
        {resumeBanner && <div className="max-w-xl mx-auto px-4 pt-4">{resumeBanner}</div>}
        <CampusMap
          mode={mode}
          language={language}
          initialTo={routeTo}
          initialFrom={routeFrom}
          onRouteChange={setLiveRoute}
          livePosition={livePos}
          className="md:h-[calc(100dvh-3.5rem-2.5rem)]"
          panel={
            <RouteNavPanel
              language={language}
              blind={isBlindSafeMode}
              visualOnly={visualOnly}
              hasRoute={hasRoute}
              routeCompare={routeCompare}
              effortStd={effortStd}
              effortAcc={effortAcc}
              easiestIsAccessible={easiestIsAccessible}
              barriers={{ standard: stdBarriers, accessible: accBarriers }}
              hazards={routeHazards}
              stepFocusActive={stepFocusActive}
              stepFocusIndex={stepFocusIndex}
              setStepFocusIndex={setStepFocusIndex}
              session={session}
              placeName={getPlaceName(routePlace, language)}
              emergencyContact={emergencyContact}
              onSaveContact={onSaveContact}
              onOpenPreferences={onOpenPreferences}
              isSpeaking={isSpeaking}
              speakText={speakText}
              stopSpeaking={stopSpeaking}
              beginWalk={() => void beginWalk()}
              endWalk={endWalk}
            />
          }
        />
      </>
    );
  }

  if (tab === 'community') {
    return (
      <Suspense fallback={screenFallback}>
      <CommunitySection
        language={language}
        isOffline={isOffline}
        onRouteHere={routeHere}
        aiCheck={
          <PhotoAuditWizard
            places={places}
            city={city}
            selectedPlaceId={selectedPlace.id}
            mode={mode}
            language={language}
            voiceEnabled={voiceEnabled}
            visualOnly={visualOnly}
            isOffline={isOffline}
            onToggleOffline={onToggleOffline}
            onAuditComplete={onAuditComplete}
            onViewOnMap={handleViewOnMapFromAudit}
          />
        }
      />
      </Suspense>
    );
  }

  // =========================================================================
  // SPECIAL SAFE VOICE-FIRST LAYOUT FOR BLIND / LOW-VISION USERS
  // (No accidental small taps, huge stacked full-width controls, auto-TTS)
  // =========================================================================
  if (isBlindSafeMode) {
    const activeSteps = localizedSteps;
    const currentStep = activeSteps[stepFocusIndex] || activeSteps[0];

    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {walking && (
          <BlindWalkingMode
            session={session}
            route={walkRoute}
            stepIndex={stepFocusIndex}
            language={language}
            contact={emergencyContact}
            gateLabel={localizeGateName(gateName, language)}
            onExit={() => {
              endWalk();
              speakText(getPlaceName(selectedPlace, language));
            }}
            onArrivalAnswer={handleArrivalAnswer}
            onArrivalDone={handleArrivalDone}
          />
        )}
        {resumeBanner}
        {/* Guardrail Note + Voice Controls */}
        <div className="p-4 rounded-3xl bg-[var(--tactile-yellow-soft)] border-2 border-[var(--ink-primary)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-primary)]">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.blindGuardrailNote}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() =>
                isSpeaking
                  ? stopSpeaking()
                  : speakText(voiceReply || buildPlaceSummarySpeech(selectedPlace))
              }
              className="w-full py-4 px-4 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[60px]"
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              )}
              <span>{isSpeaking ? t.stopSpeaking : t.repeatVoiceBtn}</span>
            </button>

            <button
              type="button"
              onClick={startMic}
              className={`w-full py-4 px-4 rounded-2xl border-2 text-base font-bold flex items-center justify-center gap-2 min-h-[60px] ${
                micOpen
                  ? 'bg-[var(--status-red)] border-[var(--status-red)] text-white'
                  : 'bg-[var(--bg-surface)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
              }`}
            >
              {micOpen ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
              <span>{micOpen ? t.close : t.speakChoiceBtn}</span>
            </button>
          </div>
        </div>

        {micOpen && (
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--ink-primary)] space-y-2.5">
            <div className="text-sm font-bold text-[var(--ink-primary)]">{t.micListening}</div>
            <div className="space-y-2">
              {t.micSamples.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => handleVoiceCommand(phrase)}
                  className="w-full text-left px-4 py-3.5 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-base font-bold text-[var(--ink-primary)] min-h-[56px]"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Screen 1: Big Safe Station Buttons & Spoken Gate Answer */}
        {tab === 'home' && (
          <div className="space-y-5">
            <div className="space-y-2.5">
              <div className="text-sm font-bold text-[var(--ink-secondary)]">
                {t.pickStationLabel} {t.cities[city]}
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="w-full rounded-2xl border-2 border-[var(--ink-primary)] bg-[var(--bg-surface)] px-4 py-3 text-lg text-[var(--ink-primary)] min-h-[56px]"
              />
              <div className="space-y-2.5">
                {(search.trim() || showAllPlaces ? quickPlaces : quickPlaces.slice(0, 5)).map((place) => {
                  const active = place.id === selectedPlace.id;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectStation(place)}
                      aria-pressed={active}
                      className={`w-full text-left px-5 py-4 rounded-2xl border-2 flex items-center justify-between gap-3 min-h-[64px] ${
                        active
                          ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)] font-bold'
                          : 'bg-[var(--bg-surface)] border-[var(--border-line)] text-[var(--ink-primary)] font-semibold'
                      }`}
                    >
                      <span className="text-lg">{getPlaceName(place, language)}</span>
                      <span className="font-mono-tabular text-base font-bold shrink-0">
                        {getPlaceScore(place, mode) ?? '--'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!search.trim() && quickPlaces.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllPlaces((v) => !v)}
                  className="w-full py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-base font-bold text-[var(--ink-primary)] min-h-[52px]"
                >
                  {showAllPlaces ? CAMPUS_STRINGS[language].showLess : `${CAMPUS_STRINGS[language].showAll} (${quickPlaces.length})`}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => routeHere(selectedPlace.id)}
              className="w-full py-4 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-lg font-bold flex items-center justify-center gap-2 min-h-[64px]"
            >
              <RouteIcon className="w-5 h-5" aria-hidden="true" />
              <span>
                {CAMPUS_STRINGS[language].routeHere}: {getPlaceName(selectedPlace, language)}
              </span>
            </button>

            <p className="text-base font-semibold text-[var(--ink-primary)]">{factChips(selectedFacts).join(' · ')}</p>

            <button
              type="button"
              onClick={() => routeFromHere(selectedPlace.id)}
              className="w-full py-4 px-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--ink-primary)] text-[var(--ink-primary)] text-lg font-bold min-h-[60px]"
            >
              {CAMPUS_STRINGS[language].startFromHere}
            </button>

            {!bestGate && (
              <EmergencyContactCard language={language} contact={emergencyContact} onChange={onSaveContact} large />
            )}

            {bestGate && (
              <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--ink-primary)] space-y-4">
                <div className="text-xs font-bold text-[var(--ink-secondary)]">{t.bestGateHeading}</div>
                <div className="text-xl font-bold text-[var(--ink-primary)]">
                  {localizeGateName(bestGate.name, language)}
                </div>
                <div className="text-base font-semibold text-[var(--ink-primary)]">
                  {t.tactileTiles}:{' '}
                  {bestGate.tactile_paving === 'yes'
                    ? t.yes
                    : bestGate.tactile_paving === 'partial'
                      ? t.partial
                      : t.no}{' '}
                  · {t.steps}: {bestGate.steps_count ?? 0}
                </div>

                <EmergencyContactCard
                  language={language}
                  contact={emergencyContact}
                  onChange={onSaveContact}
                  large
                />

                <button
                  type="button"
                  onClick={() => {
                    onTabChange('route');
                    void beginWalk();
                  }}
                  className="w-full py-4 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-lg font-bold flex items-center justify-center gap-2 min-h-[64px]"
                >
                  <RouteIcon className="w-5 h-5" aria-hidden="true" />
                  <span>{t.startNavigationBtn}</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // CALM VISUAL-CLUE + PLAIN TEXT LAYOUT (Wheelchair, Elder/Walker, Deaf)
  // Zero clutter, balanced proportions, plenty of negative space
  // =========================================================================
  return (
    <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
      {tab === 'home' && resumeBanner}
      <SosOverlay session={session} contact={emergencyContact} language={language} />
      {session.phase === 'arrived' && (
        <ArrivalCheck
          gateName={localizeGateName(gateName, language)}
          language={language}
          mappedM={session.mappedM}
          speakIt={allowVoice}
          onAnswer={handleArrivalAnswer}
          onDone={handleArrivalDone}
        />
      )}
      {/* HOME SCREEN: PICK A STATION -> SEE VISUAL CLUES + 1 BIG ACTION */}
      {tab === 'home' && (
        <div className="space-y-5">
          {/* Calm Context Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--ink-secondary)]">
              <span className="font-bold text-[var(--ink-primary)]">{t.cities[city]}</span>
              <span aria-hidden="true">·</span>
              <span>{t.modes[mode]}</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onOpenPreferences}
                className="font-bold text-[var(--ink-primary)] underline underline-offset-4 min-h-[36px]"
              >
                {t.changeLabel}
              </button>
            </div>

            {!visualOnly && (
              <button
                type="button"
                onClick={startMic}
                aria-expanded={micOpen}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold min-h-[42px] ${
                  micOpen
                    ? 'bg-[var(--status-red)] text-white'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-line)] text-[var(--ink-primary)]'
                }`}
              >
                {micOpen ? <MicOff className="w-4 h-4" aria-hidden="true" /> : <Mic className="w-4 h-4" aria-hidden="true" />}
                <span>{micOpen ? t.close : t.micTapToSpeak}</span>
              </button>
            )}
          </div>

          {/* Expandable Mic Strip */}
          {micOpen && !visualOnly && (
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] space-y-2.5">
              <div className="text-xs font-bold text-[var(--ink-secondary)]">{t.micListening}</div>
              <div className="flex flex-wrap gap-2">
                {t.micSamples.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => handleVoiceCommand(phrase)}
                    className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs font-bold text-[var(--ink-primary)] min-h-[40px]"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {voiceReply && !visualOnly && (
            <div
              role="status"
              className="p-3.5 rounded-2xl bg-[var(--tactile-yellow-soft)] border border-[var(--border-line)] flex items-center justify-between gap-3"
            >
              <p className="text-sm font-semibold text-[var(--ink-primary)]">{voiceReply}</p>
              <button
                type="button"
                onClick={() => setVoiceReply(null)}
                aria-label={t.close}
                className="w-9 h-9 rounded-full bg-[var(--bg-surface)] flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* 1. Station Selector Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-4 space-y-3">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[var(--ink-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="w-full rounded-xl border border-[var(--border-line)] bg-[var(--bg-paper)] pl-10 pr-3 py-2.5 text-sm text-[var(--ink-primary)] min-h-[44px]"
              />
            </div>

            <ul className="space-y-1.5 max-h-[320px] overflow-y-auto" aria-label={CAMPUS_STRINGS[language].placesCount(quickPlaces.length)}>
              {(search.trim() || showAllPlaces ? quickPlaces : quickPlaces.slice(0, 5)).map((place) => {
                const active = place.id === selectedPlace.id;
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectStation(place)}
                      aria-pressed={active}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 min-h-[48px] transition-colors ${
                        active
                          ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)] font-bold'
                          : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)] font-semibold hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{getPlaceName(place, language)}</span>
                        <span className="block text-[11px] font-semibold opacity-70">{placeTypeLabel(place)}</span>
                      </span>
                      <span className="font-mono-tabular text-sm font-bold shrink-0">{getPlaceScore(place, mode) ?? '--'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!search.trim() && quickPlaces.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllPlaces((v) => !v)}
                className="text-xs font-bold underline underline-offset-4 text-[var(--ink-primary)] min-h-[36px]"
              >
                {showAllPlaces ? CAMPUS_STRINGS[language].showLess : `${CAMPUS_STRINGS[language].showAll} (${quickPlaces.length})`}
              </button>
            )}
          </div>

          {/* 2. Calm Focal Answer Card with Visual Clues */}
          <section
            aria-label={getPlaceName(selectedPlace, language)}
            className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)] mb-1">
                  <span>{t.cities[selectedPlace.city]}</span>
                  <span aria-hidden="true">·</span>
                  <TrustLabelText label={selectedPlace.label} language={language} showInfo />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] text-balance">
                  {getPlaceName(selectedPlace, language)}
                </h1>
              </div>
              <ScoreBadge score={getPlaceScore(selectedPlace, mode)} language={language} size="lg" />
            </div>

            {/* Best Gate Box + 3 Instant Visual Clues */}
            {bestGate && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--status-good)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{t.bestGateHeading}</span>
                  </span>
                  <ScoreBadge score={getGateScore(bestGate, mode)} language={language} size="sm" />
                </div>

                <div className="text-lg font-bold text-[var(--ink-primary)]">
                  {localizeGateName(bestGate.name, language)}
                </div>

                {/* 3 Dead-Simple Visual Clue Tiles */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Clue 1: Ramp */}
                  <div
                    className={`p-3 rounded-2xl border text-center space-y-1 ${
                      bestGate.ramp_present === 'yes'
                        ? 'bg-[var(--status-good-soft)] border-[var(--status-good)]/30'
                        : 'bg-[var(--status-red-soft)] border-[var(--status-red)]/30'
                    }`}
                  >
                    <Accessibility
                      className={`w-5 h-5 mx-auto ${
                        bestGate.ramp_present === 'yes' ? 'text-[var(--status-good)]' : 'text-[var(--status-red)]'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="text-[11px] font-semibold text-[var(--ink-secondary)]">{t.ramp}</div>
                    <div className="text-sm font-bold text-[var(--ink-primary)]">
                      {bestGate.ramp_present === 'yes' ? t.yes : t.no}
                    </div>
                  </div>

                  {/* Clue 2: Lift */}
                  <div
                    className={`p-3 rounded-2xl border text-center space-y-1 ${
                      bestGate.lift_working === 'yes'
                        ? 'bg-[var(--status-good-soft)] border-[var(--status-good)]/30'
                        : bestGate.lift_present === 'yes'
                          ? 'bg-[var(--status-red-soft)] border-[var(--status-red)]/30'
                          : 'bg-[var(--bg-surface)] border-[var(--border-line)]'
                    }`}
                  >
                    <ArrowUpDown
                      className={`w-5 h-5 mx-auto ${
                        bestGate.lift_working === 'yes'
                          ? 'text-[var(--status-good)]'
                          : bestGate.lift_present === 'yes'
                            ? 'text-[var(--status-red)]'
                            : 'text-[var(--ink-secondary)]'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="text-[11px] font-semibold text-[var(--ink-secondary)]">{t.lift}</div>
                    <div className="text-sm font-bold text-[var(--ink-primary)]">
                      {bestGate.lift_present === 'yes'
                        ? bestGate.lift_working === 'yes'
                          ? t.working
                          : t.broken
                        : t.none}
                    </div>
                  </div>

                  {/* Clue 3: Stairs */}
                  <div
                    className={`p-3 rounded-2xl border text-center space-y-1 ${
                      (bestGate.steps_count ?? 0) === 0
                        ? 'bg-[var(--status-good-soft)] border-[var(--status-good)]/30'
                        : 'bg-[var(--status-amber-soft)] border-[var(--status-amber)]/30'
                    }`}
                  >
                    <Footprints
                      className={`w-5 h-5 mx-auto ${
                        (bestGate.steps_count ?? 0) === 0 ? 'text-[var(--status-good)]' : 'text-[var(--status-amber)]'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="text-[11px] font-semibold text-[var(--ink-secondary)]">{t.steps}</div>
                    <div className="text-sm font-bold font-mono-tabular text-[var(--ink-primary)]">
                      {bestGate.steps_count ?? 0}
                    </div>
                  </div>
                </div>

                {/* Primary Big Button */}
                <button
                  type="button"
                  onClick={() => {
                    onTabChange('route');
                    setStepFocusActive(false);
                  }}
                  className="w-full py-4 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[56px]"
                >
                  <RouteIcon className="w-5 h-5" aria-hidden="true" />
                  <span>{t.getStepFreeRouteBtn}</span>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}

            {!bestGate && (
              <>
                <ul className="flex flex-wrap gap-2">
                  {factChips(selectedFacts).map((chip, i) => (
                    <li
                      key={chip}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        (i === 1 && selectedFacts.barriers) || (i === 2 && selectedFacts.steps)
                          ? 'bg-[var(--status-amber-soft)] border-[var(--status-amber)]/40 text-[var(--ink-primary)]'
                          : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
                      }`}
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2">
                  <button
                    type="button"
                    onClick={() => routeHere(selectedPlace.id)}
                    className="py-4 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[56px]"
                  >
                    <RouteIcon className="w-5 h-5" aria-hidden="true" />
                    <span>{CAMPUS_STRINGS[language].routeHere}</span>
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => routeFromHere(selectedPlace.id)}
                    className="py-4 px-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-[var(--ink-primary)] text-sm font-bold flex items-center justify-center gap-2 min-h-[56px]"
                  >
                    {CAMPUS_STRINGS[language].startFromHere}
                  </button>
                </div>
              </>
            )}

            {/* Quiet Secondary Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {selectedPlace.gates.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setDetailSheet('gates');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
                >
                  <ListChecks className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {t.otherGatesBtn} ({selectedPlace.gates.length})
                  </span>
                </button>
                )}

                {selectedPlace.nearby_buses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setDetailSheet('buses');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
                  >
                    <Bus className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {t.nearbyBusesBtn} ({selectedPlace.nearby_buses.length})
                    </span>
                  </button>
                )}

                {!visualOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      isSpeaking ? stopSpeaking() : speakText(buildPlaceSummarySpeech(selectedPlace))
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-line)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
                    <span>{isSpeaking ? t.stopSpeaking : t.readAloud}</span>
                  </button>
                )}
              </div>

              {bestGate && (
                <div className="flex items-center gap-1.5">
                  {bestGateVoted ? (
                    <span className="text-xs font-bold text-[var(--status-good)]">{t.thanksVote}</span>
                  ) : (
                    <>
                      <span className="text-xs text-[var(--ink-secondary)]">{t.didThisHelp}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVotedGates((p) => ({ ...p, [bestGate.id]: true }));
                          onVerifyGate(selectedPlace.id, bestGate.id, 'confirm');
                        }}
                        aria-label={t.yes}
                        className="w-9 h-9 rounded-lg border border-[var(--border-line)] flex items-center justify-center"
                      >
                        <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVotedGates((p) => ({ ...p, [bestGate.id]: true }));
                          onVerifyGate(selectedPlace.id, bestGate.id, 'dispute');
                        }}
                        aria-label={t.no}
                        className="w-9 h-9 rounded-lg border border-[var(--border-line)] flex items-center justify-center"
                      >
                        <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* GATES / BUSES CLEAN MODAL */}
      {detailSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-sheet-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-lg bg-[var(--bg-surface)] border-t sm:border border-[var(--border-line)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h2 id="detail-sheet-title" className="text-lg font-bold text-[var(--ink-primary)]">
                {detailSheet === 'gates' ? t.allGatesHeading : t.busesHeading}
              </h2>
              <button
                type="button"
                onClick={() => setDetailSheet(null)}
                aria-label={t.close}
                className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {detailSheet === 'gates' && (
              <ul className="divide-y divide-[var(--border-line)]">
                {sortedGates.map((gate) => {
                  const gScore = getGateScore(gate, mode);
                  return (
                    <li key={gate.id} className="py-4 space-y-2.5 first:pt-1 last:pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-[var(--ink-primary)]">
                            {localizeGateName(gate.name, language)}
                          </div>
                          <TrustLabelText label={gate.label} language={language} />
                        </div>
                        <ScoreBadge score={gScore} language={language} size="sm" />
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-[var(--ink-secondary)]">
                        <span>
                          {t.stepFree}:{' '}
                          <strong className="text-[var(--ink-primary)]">
                            {gate.step_free === 'yes' ? t.yes : gate.step_free === 'partial' ? t.partial : t.no}
                          </strong>
                        </span>
                        <span>
                          {t.lift}:{' '}
                          <strong className="text-[var(--ink-primary)]">
                            {gate.lift_present === 'yes'
                              ? gate.lift_working === 'yes'
                                ? t.working
                                : t.broken
                              : t.none}
                          </strong>
                        </span>
                        <span>
                          {t.steps}:{' '}
                          <strong className="font-mono-tabular text-[var(--ink-primary)]">
                            {gate.steps_count ?? t.unknown}
                          </strong>
                        </span>
                      </div>
                      {gate.proof_photo && !brokenImages[gate.id] && (
                        <img
                          src={gate.proof_photo}
                          alt={gate.proof_alt || gate.name}
                          referrerPolicy="no-referrer"
                          onError={() => setBrokenImages((p) => ({ ...p, [gate.id]: true }))}
                          className="w-full h-36 object-cover rounded-xl border border-[var(--border-line)]"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {detailSheet === 'buses' && (
              <ul className="divide-y divide-[var(--border-line)]">
                {selectedPlace.nearby_buses.map((bus) => (
                  <li key={bus.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono-tabular font-bold text-base text-[var(--ink-primary)]">
                        {bus.route_no}
                      </div>
                      <div className="text-xs text-[var(--ink-secondary)]">{bus.stop_name}</div>
                    </div>
                    <span
                      className={`text-xs font-bold text-right ${
                        bus.wheelchair_accessible === 'yes'
                          ? 'text-[var(--status-good)]'
                          : bus.wheelchair_accessible === 'some'
                            ? 'text-[var(--status-amber)]'
                            : bus.wheelchair_accessible === 'no'
                              ? 'text-[var(--status-red)]'
                              : 'text-[var(--ink-secondary)]'
                      }`}
                    >
                      {bus.wheelchair_accessible === 'yes'
                        ? t.lowFloorYes
                        : bus.wheelchair_accessible === 'some'
                          ? t.lowFloorSome
                          : bus.wheelchair_accessible === 'no'
                            ? t.lowFloorNo
                            : t.lowFloorUnknown}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
