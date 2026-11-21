import { aiAudit, type AiAuditOut } from '../lib/aiClient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Bus,
  Camera,
  CheckCircle2,
  DoorOpen,
  Eye,
  Footprints,
  HelpCircle,
  ImagePlus,
  Loader2,
  Map as MapIcon,
  MapPin,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { getSpeechLocale, localizePlaceName, STRINGS } from '../lib/i18n';
import {
  buildMockFindingsFromUpload,
  loadOfflineAuditQueue,
  MOCK_AUDIT_SAMPLES,
  saveOfflineAuditQueue,
  type OfflinePendingAudit,
  type PhotoAuditSubject,
  type SamplePhotoKey,
} from '../lib/mockPhotoAudit';
import { computeDeterministicScores, getScoreTier, type ScoringResult } from '../lib/scoring';
import type {
  AuditFindings,
  CitySlug,
  LanguageCode,
  Place,
  TravelMode,
} from '../types/sugampath';
import { TrustLabelText } from './ScoreBadge';

interface PhotoAuditWizardProps {
  places: Place[];
  city: CitySlug;
  selectedPlaceId: string;
  mode: TravelMode;
  language: LanguageCode;
  voiceEnabled: boolean;
  visualOnly?: boolean;
  isOffline: boolean;
  onToggleOffline: () => void;
  onAuditComplete: (payload: {
    placeId: string;
    result: ScoringResult;
    findings: AuditFindings;
    photoUrl: string;
    sceneText: string;
    sampleKey?: SamplePhotoKey;
  }) => void;
  onViewOnMap: (placeId: string) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface FindingChipItem {
  id: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  text: string;
  kind: 'stepFree' | 'ramp' | 'lift' | 'tactile' | 'obstruction' | 'signal' | 'blur';
}

export function PhotoAuditWizard({
  places,
  city,
  selectedPlaceId,
  mode,
  language,
  voiceEnabled,
  visualOnly = false,
  isOffline,
  onToggleOffline,
  onAuditComplete,
  onViewOnMap,
}: PhotoAuditWizardProps) {
  const t = STRINGS[language];
  const autoVoicePreferred = mode === 'blind' || (voiceEnabled && !visualOnly);

  const [step, setStep] = useState<WizardStep>(1);
  const [demoSamplesOpen, setDemoSamplesOpen] = useState(false);
  const [showHowToTest, setShowHowToTest] = useState(false);
  const [localMuted, setLocalMuted] = useState<boolean>(() => Boolean(visualOnly));

  // Step 1 state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadedObjectUrl, setUploadedObjectUrl] = useState<string | null>(null);
  const [selectedSampleKey, setSelectedSampleKey] = useState<SamplePhotoKey | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Step 2 state
  const [subject, setSubject] = useState<PhotoAuditSubject>('gate');
  const [targetPlaceId, setTargetPlaceId] = useState<string>(selectedPlaceId);
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [micListening, setMicListening] = useState(false);
  const [micMockIdx, setMicMockIdx] = useState(0);

  // Step 3 & Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<OfflinePendingAudit[]>(loadOfflineAuditQueue);
  const [savedQueueId, setSavedQueueId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [isLiveResult, setIsLiveResult] = useState(false);

  // Step 4 state
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [findings, setFindings] = useState<AuditFindings | null>(null);
  const [hasReportedForRun, setHasReportedForRun] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const analyzeTimerRef = useRef<number | null>(null);
  const micTimerRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setTargetPlaceId(selectedPlaceId);
  }, [selectedPlaceId]);

  useEffect(() => {
    if (visualOnly) setLocalMuted(true);
  }, [visualOnly]);

  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) window.clearTimeout(analyzeTimerRef.current);
      if (micTimerRef.current) window.clearTimeout(micTimerRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const orderedPlaces = useMemo(() => {
    const inCity = places.filter((p) => p.city === city);
    const others = places.filter((p) => p.city !== city);
    return [...inCity, ...others];
  }, [places, city]);

  const targetPlace =
    places.find((p) => p.id === targetPlaceId) || orderedPlaces[0] || places[0];

  const targetPlaceName = localizePlaceName(targetPlace.name, language);

  const selectedSample = useMemo(
    () => MOCK_AUDIT_SAMPLES.find((s) => s.key === selectedSampleKey) || null,
    [selectedSampleKey]
  );

  const speak = (text: string, force = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!force && (localMuted || !autoVoicePreferred)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = getSpeechLocale(language);
    u.rate = 0.92;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const triggerGentleVibrate = () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(35);
      } catch {
        // Ignore unsupported vibration
      }
    }
  };

  const handleToggleMute = () => {
    if (isSpeaking) {
      stopSpeech();
      setLocalMuted(true);
      return;
    }
    if (!localMuted) {
      stopSpeech();
      setLocalMuted(true);
    } else {
      setLocalMuted(false);
      if (step === 1) speak(t.photoStep1Speech, true);
      else if (step === 2) speak(t.photoStep2Speech, true);
      else if (step === 3) speak(isOffline ? t.photoOfflineSpeech : t.photoStep3Speech, true);
      else if (step === 4 && result && findings) {
        speak(buildResultSpeech(result, findings), true);
      }
    }
  };

  // Auto-speak step prompt on step transitions when blind mode or voice enabled
  useEffect(() => {
    if (localMuted || !autoVoicePreferred) return;
    if (step === 1) {
      speak(t.photoStep1Speech);
    } else if (step === 2) {
      speak(t.photoStep2Speech);
    } else if (step === 3) {
      speak(isOffline ? t.photoOfflineSpeech : t.photoStep3Speech);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const clearUploadedObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setUploadedObjectUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError(t.photoErrorBadType);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(t.photoErrorTooBig);
      return;
    }

    clearUploadedObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setUploadedObjectUrl(url);
    setPhotoUrl(url);
    setSelectedSampleKey(null);
    setResult(null);
    setFindings(null);
    setHasReportedForRun(false);
    triggerGentleVibrate();
  };

  const handleSelectSample = (sampleKey: SamplePhotoKey) => {
    const sample = MOCK_AUDIT_SAMPLES.find((s) => s.key === sampleKey);
    if (!sample) return;
    clearUploadedObjectUrl();
    setFileError(null);
    setSelectedSampleKey(sample.key);
    setPhotoUrl(sample.photo);
    setSubject(sample.subject);
    if (places.some((p) => p.id === sample.defaultPlaceId)) {
      setTargetPlaceId(sample.defaultPlaceId);
    }
    setNote('');
    setResult(null);
    setFindings(null);
    setHasReportedForRun(false);
    triggerGentleVibrate();
    setStep(2);
  };

  const handleMockSpeakNote = () => {
    if (micListening) {
      if (micTimerRef.current) window.clearTimeout(micTimerRef.current);
      setMicListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-IN';
      rec.interimResults = false;
      rec.onresult = (e: any) => setNote((n) => (n ? n + ' ' : '') + e.results[0][0].transcript);
      rec.onend = () => setMicListening(false);
      rec.onerror = () => setMicListening(false);
      setMicListening(true);
      try {
        rec.start();
        return;
      } catch {
        setMicListening(false);
      }
    }
    setMicListening(true);
    micTimerRef.current = window.setTimeout(() => {
      const sampleText = t.photoMockMicNotes[micMockIdx % t.photoMockMicNotes.length];
      setNote(sampleText);
      setMicMockIdx((i) => i + 1);
      setMicListening(false);
      triggerGentleVibrate();
    }, 1800);
  };

  const finalizeAnalysis = (
    usedPhotoUrl: string,
    usedPlaceId: string,
    usedPlaceName: string,
    usedSubject: PhotoAuditSubject,
    usedNote: string,
    usedSampleKey: SamplePhotoKey | null,
    queueIdToRemove?: string | null,
    ai?: AiAuditOut | null
  ) => {
    const sampleMatch = usedSampleKey
      ? MOCK_AUDIT_SAMPLES.find((s) => s.key === usedSampleKey)
      : null;

    const computedFindings: AuditFindings = sampleMatch
      ? sampleMatch.findings
      : ai
      ? ai.findings
      : buildMockFindingsFromUpload(usedSubject, usedNote, usedPlaceName);

    const computedScores = computeDeterministicScores(computedFindings);

    setFindings(computedFindings);
    setResult(computedScores);
    setIsLiveResult(!sampleMatch && !!ai);
    setAiFailed(false);
    setIsAnalyzing(false);

    if (queueIdToRemove) {
      const remaining = offlineQueue.filter((item) => item.id !== queueIdToRemove);
      setOfflineQueue(remaining);
      saveOfflineAuditQueue(remaining);
      setSavedQueueId(null);
    }

    if (!hasReportedForRun) {
      const sceneText = sampleMatch
        ? t.photoSamples[sampleMatch.key].scene
        : computedFindings.scene;

      onAuditComplete({
        placeId: usedPlaceId,
        result: computedScores,
        findings: computedFindings,
        photoUrl: usedPhotoUrl,
        sceneText,
        sampleKey: sampleMatch?.key,
      });
      setHasReportedForRun(true);
    }

    triggerGentleVibrate();
    setStep(4);
    if (!localMuted && autoVoicePreferred) {
      speak(buildResultSpeech(computedScores, computedFindings));
    }
  };

  const startOnlineAnalysis = (queueItem?: OfflinePendingAudit) => {
    if (analyzeTimerRef.current) window.clearTimeout(analyzeTimerRef.current);
    setIsAnalyzing(true);
    setAiFailed(false);

    const usedPhoto = queueItem?.photoUrl || photoUrl || MOCK_AUDIT_SAMPLES[0].photo;
    const usedPlaceId = queueItem?.placeId || targetPlace.id;
    const usedPlaceObj = places.find((p) => p.id === usedPlaceId) || targetPlace;
    const usedPlaceName = localizePlaceName(usedPlaceObj.name, language);
    const usedSubject = queueItem?.subject || subject;
    const usedNote = queueItem?.note ?? note;
    const usedSampleKey = queueItem ? queueItem.sampleKey || null : selectedSampleKey;

    const done = (ai: AiAuditOut | null) =>
      finalizeAnalysis(
        usedPhoto,
        usedPlaceId,
        usedPlaceName,
        usedSubject,
        usedNote,
        usedSampleKey,
        queueItem?.id || savedQueueId,
        ai
      );
    if (usedSampleKey) {
      analyzeTimerRef.current = window.setTimeout(() => done(null), 1500);
    } else {
      void aiAudit({
        photoUrl: usedPhoto,
        subject: usedSubject,
        note: usedNote,
        placeName: usedPlaceName,
        language,
      }).then((ai) => {
        if (ai) {
          done(ai);
        } else {
          // Real photo: never show invented results when the AI call fails.
          setIsAnalyzing(false);
          setAiFailed(true);
        }
      });
    }
  };

  const handleBeginCheck = () => {
    setStep(3);
    setHasReportedForRun(false);
    triggerGentleVibrate();

    const currentlyOffline =
      isOffline || (typeof navigator !== 'undefined' && navigator.onLine === false);

    if (currentlyOffline) {
      setIsAnalyzing(false);
      const pending: OfflinePendingAudit = {
        id: `offline-${Date.now()}`,
        placeId: targetPlace.id,
        placeName: targetPlaceName,
        subject,
        note,
        photoUrl: photoUrl || MOCK_AUDIT_SAMPLES[0].photo,
        sampleKey: selectedSampleKey || undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [pending, ...offlineQueue].slice(0, 12);
      setOfflineQueue(updated);
      saveOfflineAuditQueue(updated);
      setSavedQueueId(pending.id);
      return;
    }

    startOnlineAnalysis();
  };

  const handleGoOnlineAndCheck = () => {
    if (isOffline) {
      onToggleOffline();
    }
    const itemToRun = savedQueueId
      ? offlineQueue.find((q) => q.id === savedQueueId)
      : undefined;
    startOnlineAnalysis(itemToRun);
  };

  const handleCancelCheck = () => {
    if (analyzeTimerRef.current) {
      window.clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = null;
    }
    setIsAnalyzing(false);
    setAiFailed(false);
    setStep(2);
  };

  const handleResetWizard = () => {
    if (analyzeTimerRef.current) window.clearTimeout(analyzeTimerRef.current);
    if (micTimerRef.current) window.clearTimeout(micTimerRef.current);
    stopSpeech();
    clearUploadedObjectUrl();
    setPhotoUrl(null);
    setSelectedSampleKey(null);
    setFileError(null);
    setNote('');
    setMicListening(false);
    setPlacePickerOpen(false);
    setResult(null);
    setFindings(null);
    setIsAnalyzing(false);
    setAiFailed(false);
    setSavedQueueId(null);
    setHasReportedForRun(false);
    setStep(1);
  };

  const buildFindingChips = (f: AuditFindings): FindingChipItem[] => {
    const items: FindingChipItem[] = [];

    if (f.image_quality !== 'good') {
      items.push({
        id: 'blur',
        tone: 'warn',
        kind: 'blur',
        text: t.photoFindingLabels.photoTooDarkBlurry,
      });
    }

    items.push({
      id: 'step-free',
      tone:
        f.step_free_access === 'yes'
          ? 'good'
          : f.step_free_access === 'partial'
            ? 'warn'
            : f.step_free_access === 'no'
              ? 'bad'
              : 'neutral',
      kind: 'stepFree',
      text:
        f.step_free_access === 'yes'
          ? t.photoFindingLabels.stepFreeYes
          : f.step_free_access === 'partial'
            ? t.photoFindingLabels.stepFreePartial
            : f.step_free_access === 'no'
              ? t.photoFindingLabels.stepFreeNo
              : t.photoFindingLabels.stepFreeUnknown,
    });

    items.push({
      id: 'ramp',
      tone:
        f.ramp.present === 'yes'
          ? f.ramp.slope === 'steep'
            ? 'warn'
            : 'good'
          : f.ramp.present === 'no'
            ? 'bad'
            : 'neutral',
      kind: 'ramp',
      text:
        f.ramp.present === 'yes'
          ? f.ramp.slope === 'steep'
            ? t.photoFindingLabels.rampSteep
            : f.ramp.slope === 'moderate'
              ? t.photoFindingLabels.rampModerate
              : t.photoFindingLabels.rampGentle
          : f.ramp.present === 'no'
            ? t.photoFindingLabels.rampNone
            : t.photoFindingLabels.rampUnknown,
    });

    items.push({
      id: 'lift',
      tone:
        f.lift.present === 'yes'
          ? f.lift.working === 'yes'
            ? 'good'
            : f.lift.working === 'no'
              ? 'bad'
              : 'neutral'
          : 'neutral',
      kind: 'lift',
      text:
        f.lift.present === 'yes'
          ? f.lift.working === 'yes'
            ? t.photoFindingLabels.liftWorking
            : f.lift.working === 'no'
              ? t.photoFindingLabels.liftBroken
              : t.photoFindingLabels.liftUnknown
          : f.lift.present === 'no'
            ? t.photoFindingLabels.liftNone
            : t.photoFindingLabels.liftUnknown,
    });

    items.push({
      id: 'tactile',
      tone:
        f.tactile_paving.present === 'no'
          ? 'warn'
          : f.tactile_paving.condition === 'blocked' || f.tactile_paving.condition === 'broken'
            ? 'bad'
            : f.tactile_paving.condition === 'intact'
              ? 'good'
              : 'neutral',
      kind: 'tactile',
      text:
        f.tactile_paving.present === 'no'
          ? t.photoFindingLabels.tactileNone
          : f.tactile_paving.condition === 'blocked'
            ? t.photoFindingLabels.tactileBlocked
            : f.tactile_paving.condition === 'broken'
              ? t.photoFindingLabels.tactileBroken
              : f.tactile_paving.condition === 'intact'
                ? t.photoFindingLabels.tactileGood
                : t.photoFindingLabels.tactileUnknown,
    });

    if (f.open_drain_adjacent) {
      items.push({
        id: 'drain',
        tone: 'bad',
        kind: 'obstruction',
        text: t.photoFindingLabels.obstructionDrain,
      });
    } else if (f.obstructions.some((o) => o.type === 'parked_vehicle')) {
      items.push({
        id: 'bikes',
        tone: 'bad',
        kind: 'obstruction',
        text: t.photoFindingLabels.obstructionBikes,
      });
    } else if (f.obstructions.length > 0) {
      items.push({
        id: 'obs',
        tone: 'bad',
        kind: 'obstruction',
        text: t.photoFindingLabels.obstructionGeneral,
      });
    }

    if (
      (f.subject === 'crossing' || f.subject === 'bus_stop') &&
      f.crossing_signal !== 'audible_signal' &&
      f.crossing_signal !== 'unknown'
    ) {
      items.push({
        id: 'signal',
        tone: 'warn',
        kind: 'signal',
        text: t.photoFindingLabels.noAudibleSignal,
      });
    }

    return items;
  };

  const buildResultSpeech = (res: ScoringResult, f: AuditFindings) => {
    const labelTxt = t.labels[res.label];
    const confPct = Math.round(res.final_confidence * 100);
    if (res.label === 'not_verified') {
      return `${labelTxt}. ${t.photoUnclearNotice} ${t.photoSureLabel} ${confPct}%.`;
    }
    const modeScore =
      mode === 'blind'
        ? res.score_blind
        : mode === 'walker'
          ? res.score_walker
          : res.score_wheelchair;
    const chips = buildFindingChips(f)
      .slice(0, 3)
      .map((c) => c.text)
      .join('. ');
    return `${f.scene ? f.scene + ' ' : ''}${labelTxt}. ${t.modes[mode]}: ${modeScore} ${t.outOf100}. ${chips}.`;
  };

  const modeFindingKinds: Record<'wheelchair' | 'blind' | 'walker', FindingChipItem['kind'][]> = {
    wheelchair: ['blur', 'stepFree', 'ramp', 'lift', 'obstruction'],
    walker: ['blur', 'stepFree', 'ramp', 'lift', 'obstruction'],
    blind: ['blur', 'tactile', 'obstruction', 'signal'],
  };

  const modeCardsOrder = useMemo(() => {
    const all: Array<{ key: 'wheelchair' | 'blind' | 'walker'; label: string; score: number }> =
      result
        ? [
            { key: 'wheelchair', label: t.modes.wheelchair, score: result.score_wheelchair },
            { key: 'blind', label: t.modes.blind, score: result.score_blind },
            { key: 'walker', label: t.modes.walker, score: result.score_walker },
          ]
        : [];
    if (mode === 'blind') {
      return [all[1], all[0], all[2]].filter(Boolean);
    }
    if (mode === 'walker') {
      return [all[2], all[0], all[1]].filter(Boolean);
    }
    return all;
  }, [result, mode, t.modes]);

  const maxTriggeredSeverity = useMemo(() => {
    if (!result || result.triggered_issue_severities.length === 0) return 0;
    return Math.max(...result.triggered_issue_severities.map((x) => x.severity));
  }, [result]);

  const stepLabel =
    step === 4 ? t.photoResultStep : t.photoStepOf.replace('{step}', String(step));

  const subjectOptions: Array<{
    id: PhotoAuditSubject;
    label: string;
    icon: typeof DoorOpen;
  }> = [
    { id: 'gate', label: t.photoSubjects.gate, icon: DoorOpen },
    { id: 'footpath', label: t.photoSubjects.footpath, icon: Footprints },
    { id: 'crossing', label: t.photoSubjects.crossing, icon: ArrowLeftRight },
    { id: 'bus_stop', label: t.photoSubjects.bus_stop, icon: Bus },
  ];

  const samplesVisible = step === 1 && demoSamplesOpen;

  return (
    <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
      {/* Compact Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[var(--tactile-yellow)] border border-[var(--ink-primary)] text-xs font-bold text-[var(--tactile-yellow-ink)]">
              {stepLabel}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
              {t.tabCheckPhoto}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const next = !demoSamplesOpen;
                setDemoSamplesOpen(next);
                if (step !== 1 && next) {
                  setStep(1);
                }
              }}
              aria-pressed={demoSamplesOpen}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold min-h-[40px] ${
                demoSamplesOpen
                  ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{t.photoDemoSamplesBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHowToTest((v) => !v)}
              aria-expanded={showHowToTest}
              aria-label={t.photoHowToTestBtn}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold min-h-[40px] ${
                showHowToTest
                  ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--bg-surface)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{t.photoHowToTestBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              aria-pressed={!localMuted}
              aria-label={localMuted || !isSpeaking ? t.readAloud : t.photoMuteBtn}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold min-h-[40px] ${
                !localMuted
                  ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--bg-surface)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              {localMuted ? (
                <VolumeX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{localMuted ? t.readAloud : t.photoMuteBtn}</span>
            </button>
          </div>
        </div>

        {/* 3-line Judge / Auditor Guide */}
        {showHowToTest && (
          <div
            role="region"
            aria-label={t.photoHowToTestBtn}
            className="p-3.5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-xs sm:text-sm text-[var(--ink-primary)] space-y-1"
          >
            <p className="font-medium">{t.photoHowToGuide1}</p>
            <p className="font-medium">{t.photoHowToGuide2}</p>
            <p className="font-medium">{t.photoHowToGuide3}</p>
          </div>
        )}
      </div>

      {/* =====================================================================
          STEP 1: PICK OR TAKE A PHOTO
         ===================================================================== */}
      {step === 1 && (
        <section
          aria-label={t.photoCheckTitle}
          className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-5 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">{t.photoCheckTitle}</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--status-good)] shrink-0" aria-hidden="true" />
              <span>{t.photoPrivacyNote}</span>
            </p>
          </div>

          {fileError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-[var(--status-red-soft)] border border-[var(--status-red)]/40 text-sm font-bold text-[var(--status-red)] flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Primary Photo Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl bg-[var(--tactile-yellow)] border-2 border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)] text-base font-bold cursor-pointer min-h-[56px]">
              <Camera className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{t.photoTakeBtn}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleFileChange}
                className="sr-only"
                aria-label={t.photoTakeBtn}
              />
            </label>

            <label className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl bg-[var(--bg-paper)] border-2 border-[var(--ink-primary)] text-[var(--ink-primary)] text-base font-bold cursor-pointer min-h-[56px]">
              <ImagePlus className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{t.photoChooseBtn}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
                aria-label={t.photoChooseBtn}
              />
            </label>
          </div>

          {/* Preview & Reassurance for Real Upload */}
          {uploadedObjectUrl && (
            <div className="p-4 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] space-y-3">
              <img
                src={uploadedObjectUrl}
                alt={t.uploadedPhotoScene}
                className="w-full h-48 object-cover rounded-xl border border-[var(--border-line)]"
              />
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--status-good)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.photoMetaRemovedNote}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold min-h-[52px]"
              >
                {t.photoContinueBtn}
              </button>
            </div>
          )}

          {/* Toggle Sample Photos Grid */}
          <div className="pt-1 border-t border-[var(--border-line)] space-y-3">
            <button
              type="button"
              onClick={() => setDemoSamplesOpen((v) => !v)}
              aria-expanded={samplesVisible}
              className="w-full py-3 px-4 rounded-2xl bg-[var(--bg-subtle)] text-sm font-bold text-[var(--ink-primary)] flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.photoUseSampleBtn} (6)</span>
            </button>

            {samplesVisible && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_AUDIT_SAMPLES.map((sample) => {
                  const copy = t.photoSamples[sample.key];
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample.key)}
                      aria-label={`${copy.title} - ${copy.desc}`}
                      className="text-left rounded-2xl border border-[var(--border-line)] bg-[var(--bg-paper)] hover:border-[var(--ink-primary)] overflow-hidden flex flex-col transition-colors min-h-[140px]"
                    >
                      <div className="relative w-full h-28 bg-[var(--bg-subtle)]">
                        <img
                          src={sample.photo}
                          alt={copy.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover block"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[var(--bg-surface)]/95 border border-[var(--border-line)] text-[10px] font-bold text-[var(--ink-primary)]">
                          {t.photoSampleDataTag}
                        </span>
                      </div>
                      <div className="p-3 space-y-0.5">
                        <div className="text-sm font-bold text-[var(--ink-primary)]">{copy.title}</div>
                        <div className="text-xs text-[var(--ink-secondary)]">{copy.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          STEP 2: WHAT IS THIS & WHERE IS IT?
         ===================================================================== */}
      {step === 2 && (
        <section
          aria-label={t.photoStep2Title}
          className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-5 space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">{t.photoStep2Title}</h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-3 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-paper)] text-xs font-bold text-[var(--ink-primary)] min-h-[40px] shrink-0"
            >
              {t.photoChangePhotoBtn}
            </button>
          </div>

          {/* Small Preview */}
          {photoUrl && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)]">
              <img
                src={photoUrl}
                alt={selectedSample ? t.photoSamples[selectedSample.key].title : t.uploadedPhotoScene}
                className="w-16 h-16 rounded-xl object-cover border border-[var(--border-line)] shrink-0"
              />
              <div className="min-w-0">
                {selectedSample ? (
                  <>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--tactile-yellow-soft)] border border-[var(--border-line)] text-[10px] font-bold text-[var(--ink-primary)] mb-1">
                      {t.photoSampleDataTag}
                    </span>
                    <div className="text-sm font-bold text-[var(--ink-primary)] truncate">
                      {t.photoSamples[selectedSample.key].title}
                    </div>
                  </>
                ) : (
                  <div className="text-xs sm:text-sm font-bold text-[var(--status-good)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{t.photoMetaRemovedNote}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2x2 Subject Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {subjectOptions.map((opt) => {
              const Icon = opt.icon;
              const active = subject === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubject(opt.id)}
                  aria-pressed={active}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-2.5 text-left min-h-[56px] transition-colors ${
                    active
                      ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)] font-bold'
                      : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)] font-semibold'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Nearby Place Picker */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[var(--ink-primary)] shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-[var(--ink-secondary)] shrink-0">
                  {t.photoNearLabel}
                </span>
                <span className="text-sm font-bold text-[var(--ink-primary)] truncate">
                  {targetPlaceName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPlacePickerOpen((v) => !v)}
                aria-expanded={placePickerOpen}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-xs font-bold text-[var(--ink-primary)] min-h-[36px] shrink-0"
              >
                {t.photoChangePlaceBtn}
              </button>
            </div>

            {placePickerOpen && (
              <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-[var(--border-line)] max-h-48 overflow-y-auto">
                {orderedPlaces.map((pl) => {
                  const active = pl.id === targetPlace.id;
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        setTargetPlaceId(pl.id);
                        setPlacePickerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 min-h-[42px] ${
                        active
                          ? 'bg-[var(--tactile-yellow-soft)] border border-[var(--ink-primary)] font-bold text-[var(--ink-primary)]'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-line)] text-[var(--ink-primary)]'
                      }`}
                    >
                      <span className="truncate">{localizePlaceName(pl.name, language)}</span>
                      <span className="text-[11px] text-[var(--ink-secondary)] shrink-0">
                        {t.cities[pl.city]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1-Line Optional Note + Mock Speak Mic */}
          <div className="space-y-2">
            <label htmlFor="audit-short-note" className="block text-xs font-bold text-[var(--ink-secondary)]">
              {t.photoNoteLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="audit-short-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.photoNotePlaceholder}
                className="flex-1 rounded-xl border border-[var(--border-line)] bg-[var(--bg-paper)] px-3.5 py-3 text-sm text-[var(--ink-primary)] min-h-[48px]"
              />
              <button
                type="button"
                onClick={handleMockSpeakNote}
                aria-pressed={micListening}
                aria-label={micListening ? t.photoListeningBtn : t.photoSpeakNoteBtn}
                className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-sm font-bold min-h-[48px] shrink-0 ${
                  micListening
                    ? 'bg-[var(--status-red)] border-[var(--status-red)] text-white animate-pulse'
                    : 'bg-[var(--bg-paper)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                }`}
              >
                <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{micListening ? t.photoListeningBtn : t.photoSpeakNoteBtn}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBeginCheck}
            className="w-full py-4 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[56px]"
          >
            <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t.photoCheckBtn}</span>
          </button>
        </section>
      )}

      {/* =====================================================================
          STEP 3: CHECKING YOUR PHOTO & OFFLINE QUEUE
         ===================================================================== */}
      {step === 3 && (
        <section
          aria-label={t.photoCheckingMsg}
          className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-5 space-y-5"
        >
          {photoUrl && (
            <img
              src={photoUrl}
              alt={selectedSample ? t.photoSamples[selectedSample.key].title : t.uploadedPhotoScene}
              className="w-full h-44 object-cover rounded-2xl border border-[var(--border-line)]"
            />
          )}

          {aiFailed ? (
            <div role="alert" className="p-4 rounded-2xl bg-[var(--status-red-soft)] border border-[var(--status-red)]/30 space-y-3">
              <p className="text-sm font-bold text-[var(--ink-primary)]">{t.photoAiFailed}</p>
              <button
                type="button"
                onClick={() => startOnlineAnalysis()}
                className="w-full py-3.5 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[50px]"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.photoRetryBtn}</span>
              </button>
            </div>
          ) : isOffline && !isAnalyzing ? (
            <div className="p-4 rounded-2xl bg-[var(--tactile-yellow-soft)] border-2 border-[var(--ink-primary)] space-y-4">
              <div className="flex items-start gap-3">
                <WifiOff className="w-6 h-6 text-[var(--ink-primary)] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-bold text-[var(--ink-primary)]">
                    {t.photoOfflineSavedMsg}
                  </p>
                  {offlineQueue.length > 0 && (
                    <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                      {t.photoQueuedCountLabel}{' '}
                      <span className="font-mono-tabular font-bold text-[var(--ink-primary)]">
                        {offlineQueue.length}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoOnlineAndCheck}
                className="w-full py-4 px-5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[54px]"
              >
                <Wifi className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{t.photoGoOnlineBtn}</span>
              </button>
            </div>
          ) : (
            <div className="py-4 text-center space-y-3">
              <Loader2
                className="w-9 h-9 mx-auto text-[var(--ink-primary)] animate-spin"
                aria-hidden="true"
              />
              <p className="text-base font-bold text-[var(--ink-primary)]">{t.photoCheckingMsg}</p>
            </div>
          )}

          {/* Subtle Offline Simulator Toggle + Cancel */}
          <div className="pt-3 border-t border-[var(--border-line)] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onToggleOffline();
              }}
              aria-pressed={isOffline}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-paper)] text-xs font-bold text-[var(--ink-primary)] min-h-[40px]"
            >
              {isOffline ? (
                <WifiOff className="w-4 h-4 text-[var(--status-amber)]" aria-hidden="true" />
              ) : (
                <Wifi className="w-4 h-4 text-[var(--ink-secondary)]" aria-hidden="true" />
              )}
              <span>
                {t.simulateOffline}: {isOffline ? t.on : t.off}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCancelCheck}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] text-sm font-bold text-[var(--ink-primary)] min-h-[42px]"
            >
              <X className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.photoCancelBtn}</span>
            </button>
          </div>
        </section>
      )}

      {/* =====================================================================
          STEP 4: RESULT SCREEN
         ===================================================================== */}
      {step === 4 && result && findings && (
        <section
          aria-label={t.photoResultStep}
          className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-5 space-y-5"
        >
          {/* Top Photo + 1-line Description + Trust Chip */}
          <div className="flex items-start gap-3.5">
            {photoUrl && (
              <img
                src={photoUrl}
                alt={selectedSample ? t.photoSamples[selectedSample.key].title : t.uploadedPhotoScene}
                className="w-20 h-20 rounded-2xl object-cover border border-[var(--border-line)] shrink-0"
              />
            )}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <TrustLabelText label={result.label} language={language} showInfo />
                {selectedSample && (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[10px] font-bold text-[var(--ink-secondary)]">
                    {t.photoSampleDataTag}
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-[var(--ink-secondary)]">{t.photoAiSawTitle}</h3>
              <p className="text-sm font-bold text-[var(--ink-primary)] leading-snug">
                {selectedSample ? t.photoSamples[selectedSample.key].scene : findings.scene}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-secondary)]">
                <span>{isLiveResult ? t.photoCheckedByAiLive : t.photoCheckedByAiDemo}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular font-bold text-[var(--ink-primary)]">
                  {t.photoSureLabel} {Math.round(result.final_confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Unclear Photo Banner (< 0.50 confidence) */}
          {result.label === 'not_verified' && (
            <div
              role="status"
              className="p-4 rounded-2xl bg-[var(--status-amber-soft)] border border-[var(--status-amber)]/40 flex items-center gap-2.5 text-sm font-bold text-[var(--ink-primary)]"
            >
              <AlertTriangle className="w-5 h-5 text-[var(--status-amber)] shrink-0" aria-hidden="true" />
              <span>{t.photoUnclearNotice}</span>
            </div>
          )}

          {/* Per-mode score merged with what the photo shows for that mode */}
          <div className="space-y-2.5">
            {modeCardsOrder.map((card) => {
              const isPrimary = card.key === mode;
              const shownScore = result.label === 'not_verified' ? null : card.score;
              const tier = getScoreTier(shownScore);
              const notes = buildFindingChips(findings).filter((c) =>
                modeFindingKinds[card.key].includes(c.kind)
              );
              return (
                <div
                  key={card.key}
                  className={`p-4 rounded-2xl space-y-3 ${
                    isPrimary
                      ? 'bg-[var(--tactile-yellow-soft)] border-2 border-[var(--ink-primary)]'
                      : 'bg-[var(--bg-paper)] border border-[var(--border-line)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-[var(--ink-primary)]">
                      {t.photoMeaningFor.replace('{mode}', card.label)}
                    </div>
                    <div
                      className="font-mono-tabular font-bold text-lg whitespace-nowrap"
                      style={{ color: tier.colorVar }}
                      aria-label={`${shownScore ?? 0} ${t.outOf100}`}
                    >
                      {shownScore ?? '--'}
                      <span className="text-xs font-semibold text-[var(--ink-secondary)]"> / 100</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${shownScore ?? 0}%`, backgroundColor: tier.colorVar }}
                    />
                  </div>
                  <ul className="space-y-1.5">
                    {notes.map((item) => {
                      const Icon =
                        item.tone === 'good' ? CheckCircle2 : item.tone === 'neutral' ? Eye : AlertTriangle;
                      const color =
                        item.tone === 'good'
                          ? 'var(--status-good)'
                          : item.tone === 'bad'
                            ? 'var(--status-red)'
                            : item.tone === 'warn'
                              ? 'var(--status-amber)'
                              : 'var(--ink-secondary)';
                      return (
                        <li key={item.id} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--ink-primary)]">
                          <Icon className="w-4 h-4 shrink-0" style={{ color }} aria-hidden="true" />
                          <span>{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Live Place Update & City Issue Confirmation */}
          {result.label === 'ai_estimate' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-[var(--status-good-soft)] border border-[var(--status-good)]/30 text-xs sm:text-sm font-bold text-[var(--status-good)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {targetPlaceName}: {t.photoPlaceUpdatedNote}
                </span>
              </div>
              {maxTriggeredSeverity >= 3 && (
                <div className="p-3 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[var(--status-amber)] shrink-0" aria-hidden="true" />
                  <span>{t.photoCityIssueAdded}</span>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {!visualOnly && (
              <button
                type="button"
                onClick={() =>
                  isSpeaking
                    ? stopSpeech()
                    : speak(buildResultSpeech(result, findings), true)
                }
                className="py-3.5 px-4 rounded-2xl border border-[var(--border-line)] bg-[var(--bg-paper)] text-sm font-bold text-[var(--ink-primary)] flex items-center justify-center gap-2 min-h-[50px]"
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{isSpeaking ? t.stopSpeaking : t.readAloud}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewOnMap(targetPlace.id)}
              className="py-3.5 px-4 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold flex items-center justify-center gap-2 min-h-[50px]"
            >
              <MapIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.photoViewOnMapBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleResetWizard}
              className="py-3.5 px-4 rounded-2xl border-2 border-[var(--ink-primary)] bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-sm font-bold flex items-center justify-center gap-2 min-h-[50px]"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.photoCheckAnotherBtn}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
