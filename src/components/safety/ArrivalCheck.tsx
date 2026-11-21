import { useEffect, useState } from 'react';
import { CheckCircle2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { SAFE } from '../../lib/i18nSafety';
import { speak } from '../../lib/safety/device';
import type { LanguageCode } from '../../types/sugampath';

interface Props {
  gateName: string;
  language: LanguageCode;
  mappedM: number;
  /** Full-screen halves for eyes-free use (top = yes, bottom = no). Otherwise a bottom sheet. */
  fullScreen?: boolean;
  speakIt: boolean;
  onAnswer: (stepFree: boolean) => void;
  onDone: () => void;
}

/** The 1-second check. One question, two giant answers, no photo. */
export function ArrivalCheck({ gateName, language, mappedM, fullScreen = false, speakIt, onAnswer, onDone }: Props) {
  const s = SAFE[language];
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (speakIt && !answered) speak(s.arrivalSpeech(gateName), language);
    // Speak once when it appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!answered) return;
    if (speakIt) speak(s.arrivalThanks, language);
    const t = window.setTimeout(onDone, fullScreen ? 3500 : 2800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered]);

  const answer = (v: boolean) => {
    if (answered) return;
    setAnswered(true);
    onAnswer(v);
  };

  const thanks = (
    <div className="flex flex-col items-center gap-3 text-center p-6" role="status">
      <CheckCircle2 className="w-14 h-14 text-[var(--status-good)]" aria-hidden="true" />
      <p className="text-xl font-bold">{s.arrivalThanks}</p>
      {mappedM >= 20 && <p className="text-sm opacity-80">{s.arrivalMapped(mappedM)}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-black text-[var(--tactile-yellow)]" role="dialog" aria-label={s.arrivalQ(gateName)}>
        {answered ? (
          <div className="flex-1 flex items-center justify-center">{thanks}</div>
        ) : (
          <>
            <div className="px-6 pt-8 pb-4 text-center text-2xl font-bold leading-snug">{s.arrivalQ(gateName)}</div>
            <button
              type="button"
              onClick={() => answer(true)}
              className="flex-1 m-3 mb-1.5 rounded-3xl bg-[var(--tactile-yellow)] text-black text-5xl font-bold"
            >
              {s.arrivalYes}
            </button>
            <button
              type="button"
              onClick={() => answer(false)}
              className="flex-1 m-3 mt-1.5 rounded-3xl border-4 border-[var(--tactile-yellow)] text-5xl font-bold"
            >
              {s.arrivalNo}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={s.arrivalQ(gateName)} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--bg-surface)] rounded-t-3xl sm:rounded-3xl p-6 space-y-5 border border-[var(--border-line)] text-[var(--ink-primary)]">
        {answered ? (
          thanks
        ) : (
          <>
            <p className="text-xl font-bold leading-snug text-center">{s.arrivalQ(gateName)}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => answer(true)}
                className="py-6 rounded-2xl bg-[var(--status-good)] text-white text-xl font-bold flex flex-col items-center gap-1.5 min-h-[96px]"
              >
                <ThumbsUp className="w-7 h-7" aria-hidden="true" />
                {s.arrivalYes}
              </button>
              <button
                type="button"
                onClick={() => answer(false)}
                className="py-6 rounded-2xl bg-[var(--status-red)] text-white text-xl font-bold flex flex-col items-center gap-1.5 min-h-[96px]"
              >
                <ThumbsDown className="w-7 h-7" aria-hidden="true" />
                {s.arrivalNo}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
