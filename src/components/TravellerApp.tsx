import { useEffect, useMemo, useRef, useState } from 'react';
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
import { DEMO_ROUTES } from '../data/mockSugamData';
import {
  getSpeechLocale,
  localizeGateName,
  ROUTE_TRANSLATIONS,
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
import { InteractiveMap } from './InteractiveMap';
import { PhotoAuditWizard } from './PhotoAuditWizard';
import { ScoreBadge, TrustLabelText } from './ScoreBadge';

export type TravellerTab = 'home' | 'route' | 'photo';

interface TravellerAppProps {
  tab: TravellerTab;
  onTabChange: (tab: TravellerTab) => void;
  places: Place[];
  city: CitySlug;
  mode: TravelMode;
  language: LanguageCode;
  voiceEnabled: boolean;
  visualOnly?: boolean;
  isOffline: boolean;
  onToggleOffline: () => void;
  onOpenPreferences: () => void;
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
  language,
  voiceEnabled,
  visualOnly = false,
  isOffline,
  onToggleOffline,
  onOpenPreferences,
  onVerifyGate,
  onFocusPlaceCity,
  onAuditComplete,
}: TravellerAppProps) {
  const t = STRINGS[language];
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

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || cityPlaces[0] || places[0];
  const sortedGates = useMemo(
    () => [...selectedPlace.gates].sort((a, b) => getGateScore(b, mode) - getGateScore(a, mode)),
    [selectedPlace, mode]
  );
  const bestGate = sortedGates[0];
  const bestGateVoted = bestGate ? votedGates[bestGate.id] : false;

  const activeRoutePair = useMemo(
    () =>
      DEMO_ROUTES.find((r) => r.place_id === selectedPlace.id) ||
      DEMO_ROUTES.find((r) => r.city === city) ||
      DEMO_ROUTES[0],
    [selectedPlace.id, city]
  );
  const routeCompare = activeRoutePair.routes[mode];
  const routeLocale = language === 'en' ? null : ROUTE_TRANSLATIONS[activeRoutePair.id]?.[language];
  const localizedSteps = useMemo(
    () =>
      routeCompare.accessible.steps.map((s) => ({
        ...s,
        instruction: routeLocale?.steps[s.id] || s.instruction,
      })),
    [routeCompare.accessible.steps, routeLocale]
  );

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
    if (!best) return pName;
    const gName = localizeGateName(best.name, language);
    const rampTxt = best.ramp_present === 'yes' ? `${t.ramp}: ${t.yes}` : `${t.ramp}: ${t.no}`;
    const liftTxt =
      best.lift_present === 'yes'
        ? `${t.lift}: ${best.lift_working === 'yes' ? t.working : t.broken}`
        : '';
    return `${pName}. ${t.bestGateHeading}: ${gName}. ${rampTxt}. ${liftTxt}`;
  };

  const handleSelectStation = (place: Place) => {
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
    setMicOpen(false);
    const q = spokenQuery.toLowerCase();

    let targetPlace = selectedPlace;
    if (q.includes('chandigarh') || q.includes('चंडीगढ़') || q.includes('ਚੰਡੀਗੜ੍ਹ')) {
      targetPlace = places.find((p) => p.id === 'plc-chd-railway') || targetPlace;
    } else if (q.includes('patiala') || q.includes('पटियाला') || q.includes('ਪਟਿਆਲਾ')) {
      targetPlace = places.find((p) => p.id === 'plc-pta-railway') || targetPlace;
    } else if (q.includes('rajiv') || q.includes('राजीव') || q.includes('ਰਾਜੀਵ')) {
      targetPlace = places.find((p) => p.id === 'plc-ndls-rajiv-chowk') || targetPlace;
    }

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
    setSelectedPlaceId(placeId);
    onFocusPlaceCity(placeId);
    setShowOptionalMap(true);
    onTabChange('home');
    if (isBlindSafeMode) {
      const target = places.find((p) => p.id === placeId);
      if (target) {
        const msg = buildPlaceSummarySpeech(target);
        setVoiceReply(msg);
        speakText(msg);
      }
    }
  };

  if (tab === 'photo') {
    return (
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
              <div className="space-y-2.5">
                {cityPlaces.map((place) => {
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
            </div>

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

                <button
                  type="button"
                  onClick={() => {
                    onTabChange('route');
                    setStepFocusIndex(0);
                    speakText(`${t.safestWay}. ${activeSteps[0]?.instruction || ''}`);
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

        {/* Screen 2: One Step At A Time Spoken Navigation */}
        {tab === 'route' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                onTabChange('home');
                speakText(getPlaceName(selectedPlace, language));
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-base font-bold text-[var(--ink-primary)] flex items-center justify-center gap-2 min-h-[56px]"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span>{t.onboardBack}</span>
            </button>

            <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--ink-primary)] space-y-5">
              <div className="flex items-center justify-between text-sm font-bold text-[var(--status-good)]">
                <span className="font-mono-tabular">
                  {stepFocusIndex + 1} / {activeSteps.length}
                </span>
                <span>{t.stepFreeTag}</span>
              </div>

              <div className="text-2xl font-bold text-[var(--ink-primary)] leading-snug">
                {currentStep?.instruction}
              </div>

              <div className="text-sm font-mono-tabular text-[var(--ink-secondary)]">
                {currentStep?.distance_m} {t.distance}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={stepFocusIndex === 0}
                  onClick={() => {
                    const prev = Math.max(0, stepFocusIndex - 1);
                    setStepFocusIndex(prev);
                    speakText(activeSteps[prev]?.instruction || '');
                  }}
                  className="py-4 px-4 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-base font-bold text-[var(--ink-primary)] disabled:opacity-40 min-h-[60px]"
                >
                  {t.prevStepBtn}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (stepFocusIndex < activeSteps.length - 1) {
                      const next = stepFocusIndex + 1;
                      setStepFocusIndex(next);
                      speakText(activeSteps[next]?.instruction || '');
                    } else {
                      speakText(t.arrivedLabel);
                      setVoiceReply(t.arrivedLabel);
                    }
                  }}
                  className="py-4 px-4 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold min-h-[60px]"
                >
                  {stepFocusIndex < activeSteps.length - 1 ? t.nextStepBtn : t.done}
                </button>
              </div>
            </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickPlaces.slice(0, 3).map((place) => {
                const active = place.id === selectedPlace.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectStation(place)}
                    className={`px-3.5 py-3 rounded-2xl border text-left flex items-center justify-between gap-2 min-h-[52px] transition-colors ${
                      active
                        ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)] font-bold'
                        : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)] font-semibold hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <span className="truncate text-sm">{getPlaceName(place, language)}</span>
                    <span className="font-mono-tabular text-xs shrink-0">
                      {getPlaceScore(place, mode) ?? '--'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Simple Map (opened on demand or via View on map from Photo Check) */}
          {showOptionalMap && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink-secondary)]">
                  {t.cities[city]} · {getPlaceName(selectedPlace, language)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowOptionalMap(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-xs font-bold text-[var(--ink-primary)] min-h-[36px]"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.hideSimpleMapBtn}</span>
                </button>
              </div>
              <div className="h-[240px] rounded-3xl overflow-hidden border border-[var(--border-line)]">
                <InteractiveMap
                  city={city}
                  language={language}
                  mode={mode}
                  mapMode="place"
                  places={cityPlaces}
                  selectedPlace={selectedPlace}
                  onSelectPlace={(id) => {
                    const found = places.find((p) => p.id === id);
                    if (found) handleSelectStation(found);
                  }}
                  controlsBottomOffsetClass="bottom-3"
                />
              </div>
            </div>
          )}

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

            {/* Quiet Secondary Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailSheet('gates')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
                >
                  <ListChecks className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {t.otherGatesBtn} ({selectedPlace.gates.length})
                  </span>
                </button>

                {selectedPlace.nearby_buses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDetailSheet('buses')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
                  >
                    <Bus className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {t.nearbyBusesBtn} ({selectedPlace.nearby_buses.length})
                    </span>
                  </button>
                )}

                {!visualOnly && bestGate && (
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

      {/* SAFE WAY SCREEN: VISUAL COMPARISON + SIMPLE STEPS + OPTIONAL MAP */}
      {tab === 'route' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onTabChange('home')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>{t.onboardBack}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOptionalMap((v) => !v)}
              aria-expanded={showOptionalMap}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
            >
              <MapIcon className="w-4 h-4" aria-hidden="true" />
              <span>{showOptionalMap ? t.hideSimpleMapBtn : t.showSimpleMapBtn}</span>
            </button>
          </div>

          {/* Optional Bounded Map (Only shown when user asks for it) */}
          {showOptionalMap && (
            <div className="h-[260px] rounded-3xl overflow-hidden border border-[var(--border-line)]">
              <InteractiveMap
                city={city}
                language={language}
                mode={mode}
                mapMode="route"
                places={cityPlaces}
                selectedPlace={selectedPlace}
                standardRoute={routeCompare.standard}
                accessibleRoute={routeCompare.accessible}
                controlsBottomOffsetClass="bottom-3"
              />
            </div>
          )}

          {/* Visual 2-Card Clue: Red Avoid vs Green Safe */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--status-red-soft)] border border-[var(--status-red)]/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--status-red)]">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.shortestWay}</span>
              </div>
              <div className="text-lg font-bold font-mono-tabular text-[var(--ink-primary)]">
                {routeCompare.standard.stairs_count} {t.stairsCount}
              </div>
              <div className="text-xs text-[var(--ink-secondary)] font-mono-tabular">
                {routeCompare.standard.distance_m} {t.distance}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--status-good-soft)] border border-[var(--status-good)]/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--status-good)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.safestWay}</span>
              </div>
              <div className="text-lg font-bold font-mono-tabular text-[var(--ink-primary)]">
                {t.noStairs}
              </div>
              <div className="text-xs text-[var(--ink-secondary)] font-mono-tabular">
                {routeCompare.accessible.duration_min} min · {routeCompare.accessible.distance_m} {t.distance}
              </div>
            </div>
          </div>

          {/* Step-by-step Card OR Full Step List */}
          {stepFocusActive ? (
            <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--ink-primary)] space-y-5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--status-good)]">
                <span className="font-mono-tabular">
                  {stepFocusIndex + 1} / {localizedSteps.length}
                </span>
                <span>{t.stepFreeTag}</span>
              </div>

              <div className="text-xl font-bold text-[var(--ink-primary)] leading-snug">
                {localizedSteps[stepFocusIndex]?.instruction}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStepFocusActive(false)}
                  className="py-3.5 px-4 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-sm font-bold text-[var(--ink-primary)] min-h-[50px]"
                >
                  {t.stopNavigationBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (stepFocusIndex < localizedSteps.length - 1) {
                      const next = stepFocusIndex + 1;
                      setStepFocusIndex(next);
                      speakText(localizedSteps[next].instruction);
                    } else {
                      setStepFocusActive(false);
                      speakText(t.arrivedLabel);
                    }
                  }}
                  className="py-3.5 px-4 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold min-h-[50px]"
                >
                  {stepFocusIndex < localizedSteps.length - 1 ? t.nextStepBtn : t.done}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ink-primary)]">
                  {localizeGateName(routeCompare.accessible.gate_chosen, language)}
                </h2>
                {!visualOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      isSpeaking
                        ? stopSpeaking()
                        : speakText(localizedSteps.map((s, i) => `${i + 1}. ${s.instruction}`).join(' '))
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-xs font-bold min-h-[40px] shrink-0"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
                    <span>{isSpeaking ? t.stopSpeaking : t.readAloud}</span>
                  </button>
                )}
              </div>

              <ol className="space-y-2.5">
                {localizedSteps.map((step, i) => (
                  <li
                    key={step.id}
                    className="p-3.5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-[var(--tactile-yellow-soft)] border border-[var(--ink-primary)] font-mono-tabular font-bold text-sm flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[var(--ink-primary)]">{step.instruction}</div>
                        <div className="text-xs text-[var(--ink-secondary)] font-mono-tabular">
                          {step.distance_m} {t.distance}
                        </div>
                      </div>
                    </div>

                    {!visualOnly && (
                      <button
                        type="button"
                        onClick={() => speakText(step.instruction)}
                        aria-label={t.speakStep}
                        className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] flex items-center justify-center shrink-0"
                      >
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={() => {
                  setStepFocusActive(true);
                  setStepFocusIndex(0);
                  speakText(localizedSteps[0]?.instruction || '');
                }}
                className="w-full py-4 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[54px]"
              >
                <Navigation className="w-4 h-4" aria-hidden="true" />
                <span>{t.startNavigationBtn}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
