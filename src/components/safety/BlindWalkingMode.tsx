import { useCallback, useEffect, useRef, useState } from 'react';
import { backend } from '../../services/backend';
import { SAFE } from '../../lib/i18nSafety';
import { vibrate } from '../../lib/safety/audioGuide';
import { captureFrame, listenOnce, speak, speechRecognitionAvailable, stopSpeaking } from '../../lib/safety/device';
import type { WalkRoute, WalkSession } from '../../hooks/useWalkSession';
import type { EmergencyContact, HazardKind } from '../../types/safety';
import type { LanguageCode } from '../../types/sugampath';
import { ArrivalCheck } from './ArrivalCheck';
import { HoldButton } from './HoldButton';
import { SosOverlay } from './SosOverlay';

const HOLD_LISTEN_MS = 1500;
const HOLD_SOS_MS = 4000;
const TAP_WINDOW_MS = 1000;
const TAP_SETTLE_MS = 450;

const WORDS = {
  report: ['report', 'रिपोर्ट', 'दर्ज', 'ਰਿਪੋਰਟ', 'ਦਰਜ'],
  stairs: ['stair', 'step', 'सीढ़ी', 'सीढ़ि', 'ਪੌੜੀ'],
  rough: ['rough', 'broken', 'bumpy', 'ऊबड़', 'टूटा', 'ਉੱਬੜ', 'ਟੁੱਟ'],
  lift: ['lift', 'लिफ्ट', 'लिफ़्ट', 'ਲਿਫ਼ਟ', 'ਲਿਫਟ'],
  blocked: ['block', 'vendor', 'scooter', 'parked', 'बंद', 'रुकावट', 'ठेला', 'ਬੰਦ', 'ਰੁਕਾਵਟ'],
  gate: ['gate', 'गेट', 'ਗੇਟ'],
  ahead: ['ahead', 'stuck', 'front', 'help', 'what', 'आगे', 'क्या', 'अटक', 'ਅੱਗੇ', 'ਕੀ', 'ਫਸ'],
  next: ['next', 'skip', 'अगला', 'ਅਗਲਾ'],
  repeat: ['repeat', 'again', 'दोहरा', 'ਦੁਹਰਾ'],
};
const has = (text: string, list: string[]) => list.some((w) => text.includes(w));

interface Props {
  session: WalkSession;
  route: WalkRoute;
  stepIndex: number;
  language: LanguageCode;
  contact: EmergencyContact | null;
  gateLabel: string;
  onExit: () => void;
  onArrivalAnswer: (stepFree: boolean) => void;
  onArrivalDone: () => void;
}

/**
 * One full-screen, zero-button surface.
 *  tap anywhere        -> speak the instruction, distance, and ping toward the path
 *  hold 1.5 s          -> listen (voice command, or "what's ahead?")
 *  triple tap / hold 4 -> emergency countdown (8 s to cancel)
 */
export function BlindWalkingMode({
  session,
  route,
  stepIndex,
  language,
  contact,
  gateLabel,
  onExit,
  onArrivalAnswer,
  onArrivalDone,
}: Props) {
  const s = SAFE[language];
  const [busy, setBusy] = useState<null | 'listening' | 'looking'>(null);
  const step = route.steps[stepIndex] ?? route.steps[0];

  const busyRef = useRef(false);
  const gesture = useRef<{ armed: boolean; sosFired: boolean; t1: number; t2: number } | null>(null);
  const taps = useRef<number[]>([]);
  const tapTimer = useRef<number | null>(null);
  const lastPointerAt = useRef(0);
  const firstStepRef = useRef(stepIndex);
  const sosActive = session.sos.state !== 'idle';

  // ---------------------------------------------------------------- speaking
  const say = useCallback((text: string) => speak(text, language), [language]);

  const sayGuidance = useCallback(() => {
    if (!step) return;
    say(s.guidance(step.instruction, session.distanceLeftM()));
    session.audio.ping(session.bearing());
    vibrate(30);
  }, [say, s, step, session]);

  // ---------------------------------------------------------------- intro + auto-advance announcements
  useEffect(() => {
    const intro = [s.briefing, contact ? '' : s.noContactWarn].filter(Boolean).join(' ');
    say(`${intro} ${s.guidance(step?.instruction ?? '', step?.distance_m ?? 0)}`);
    return () => stopSpeaking();
    // Once, when the surface opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stepIndex === firstStepRef.current || session.phase !== 'walking') return;
    vibrate([60, 40, 60]);
    session.audio.chime('ok');
    window.setTimeout(() => {
      say(`${s.nextStepSpoken} ${s.guidance(step?.instruction ?? '', step?.distance_m ?? 0)}`);
      session.audio.ping(session.bearing());
    }, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // ---------------------------------------------------------------- voice + camera actions
  const whatsAhead = useCallback(async () => {
    setBusy('looking');
    say(s.lookingAhead);
    const frame = await captureFrame();
    if (!frame) {
      say(s.aheadFail);
      setBusy(null);
      busyRef.current = false;
      return;
    }
    try {
      const res = await backend.analyzeSurroundings({ imageDataUrl: frame, language, placeId: route.placeId });
      say(res.guidance);
      if (res.hazard) session.reportHazard(res.hazard.kind, 'whats-ahead'); // lands as a 3-hour transient caution
    } catch {
      say(s.aheadFail);
    }
    setBusy(null);
    busyRef.current = false;
  }, [language, route.placeId, s, say, session]);

  const handleCommand = useCallback(
    (raw: string) => {
      const text = raw.toLowerCase();
      const wantsReport = has(text, WORDS.report);
      const kind: HazardKind | null = has(text, WORDS.stairs)
        ? 'stairs'
        : has(text, WORDS.lift)
          ? 'broken_lift'
          : has(text, WORDS.rough)
            ? 'rough_surface'
            : has(text, WORDS.blocked)
              ? 'blocked_path'
              : null;

      if (wantsReport && kind) {
        session.reportHazard(kind, 'voice');
        session.audio.chime('ok');
        say(s.reported(s.hazardKind[kind]));
      } else if (has(text, WORDS.gate)) {
        const side = session.audio.sideWord(session.gateBearing());
        say(side ? s.gateWhere(gateLabel, s.side[side]) : s.gateNoCompass(gateLabel));
        session.audio.ping(session.gateBearing());
      } else if (has(text, WORDS.next)) {
        session.advance();
      } else if (has(text, WORDS.repeat)) {
        sayGuidance();
      } else if (has(text, WORDS.ahead)) {
        void whatsAhead();
        return; // whatsAhead clears busy itself
      } else {
        say(s.didntCatch);
      }
      busyRef.current = false;
    },
    [gateLabel, s, say, sayGuidance, session, whatsAhead]
  );

  const startListening = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    stopSpeaking();
    session.audio.chime('listen');
    vibrate([40, 40, 40]);
    // No speech recognition on this browser: the hold itself is the "I'm stuck" request.
    if (!speechRecognitionAvailable()) {
      void whatsAhead();
      return;
    }
    setBusy('listening');
    const heard = await listenOnce(language, 2000);
    setBusy(null);
    if (!heard) {
      session.audio.chime('cancel'); // silence: cancel softly
      busyRef.current = false;
      return;
    }
    handleCommand(heard);
  }, [handleCommand, language, session, whatsAhead]);

  // ---------------------------------------------------------------- gestures
  const registerTap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < TAP_WINDOW_MS), now];
    if (tapTimer.current !== null) window.clearTimeout(tapTimer.current);
    if (taps.current.length >= 3) {
      taps.current = [];
      session.triggerSos('manual');
      return;
    }
    // Wait briefly so a triple tap never also speaks guidance. A lone tap is harmless: it just repeats.
    tapTimer.current = window.setTimeout(() => {
      taps.current = [];
      sayGuidance();
    }, TAP_SETTLE_MS);
  }, [sayGuidance, session]);

  const onPointerDown = (e: React.PointerEvent) => {
    lastPointerAt.current = Date.now();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const g = { armed: false, sosFired: false, t1: 0, t2: 0 };
    g.t1 = window.setTimeout(() => {
      g.armed = true;
      session.audio.chime('armed');
      vibrate(80);
    }, HOLD_LISTEN_MS);
    g.t2 = window.setTimeout(() => {
      g.sosFired = true;
      g.armed = false;
      session.triggerSos('manual');
    }, HOLD_SOS_MS);
    gesture.current = g;
  };

  const endGesture = (cancelled: boolean) => {
    const g = gesture.current;
    if (!g) return;
    window.clearTimeout(g.t1);
    window.clearTimeout(g.t2);
    gesture.current = null;
    if (cancelled || g.sosFired) return;
    if (g.armed) void startListening();
    else registerTap();
  };

  // Laptop / switch-access fallback so the surface can be demoed without walking.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sosActive) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        registerTap();
      } else if (e.key === 'ArrowRight' || e.key === 'n') {
        session.advance();
      } else if (e.key === 'l') {
        void startListening();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [registerTap, session, sosActive, startListening]);

  useEffect(
    () => () => {
      if (tapTimer.current !== null) window.clearTimeout(tapTimer.current);
    },
    []
  );

  // ---------------------------------------------------------------- arrival
  if (session.phase === 'arrived') {
    return (
      <ArrivalCheck
        fullScreen
        speakIt
        gateName={gateLabel}
        language={language}
        mappedM={session.mappedM}
        onAnswer={onArrivalAnswer}
        onDone={onArrivalDone}
      />
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={s.briefing}
        onPointerDown={onPointerDown}
        onPointerUp={() => endGesture(false)}
        onPointerCancel={() => endGesture(true)}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          // Screen-reader activation fires click without pointer events.
          if (Date.now() - lastPointerAt.current > 700) registerTap();
        }}
        className="fixed inset-0 z-[70] flex flex-col bg-black text-[var(--tactile-yellow)] select-none touch-none overflow-hidden"
      >
        <div className="flex items-center justify-between p-4">
          <HoldButton
            holdMs={2000}
            onActivate={onExit}
            className="rounded-2xl border-2 border-[var(--tactile-yellow)] px-4 py-3 text-sm font-bold min-h-[56px]"
          >
            {s.holdToExit}
          </HoldButton>
          <span className="font-mono-tabular text-lg font-bold">{s.stepOf(stepIndex + 1, route.steps.length)}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 text-center" aria-live="polite">
          {busy ? (
            <div className="flex flex-col items-center gap-6">
              <span
                className="w-40 h-40 rounded-full border-8 border-[var(--tactile-yellow)] animate-pulse"
                aria-hidden="true"
              />
              <span className="text-4xl font-bold">{busy === 'listening' ? s.listening : s.lookingAhead}</span>
            </div>
          ) : (
            <>
              <p className="text-4xl sm:text-5xl font-bold leading-tight text-balance">{step?.instruction}</p>
              <p className="font-mono-tabular text-6xl font-bold">{step?.distance_m} m</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 p-4 text-center text-sm font-bold opacity-80">
          <span>{s.hintTap}</span>
          <span>{s.hintHold}</span>
          <span>{s.hintSos}</span>
        </div>
      </div>
      <SosOverlay session={session} contact={contact} language={language} />
    </>
  );
}
