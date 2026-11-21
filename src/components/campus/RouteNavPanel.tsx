import { AlertTriangle, CheckCircle2, Navigation, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import type { WalkSession } from '../../hooks/useWalkSession';
import { effortLine, SAFE } from '../../lib/i18nSafety';
import { STRINGS } from '../../lib/i18n';
import type { EffortBreakdown } from '../../lib/safety/effort';
import type { ActiveHazard, EmergencyContact } from '../../types/safety';
import type { LanguageCode, RouteOption } from '../../types/sugampath';
import { CautionList } from '../safety/CautionList';
import { EmergencyContactCard } from '../safety/EmergencyContactCard';
import { HoldButton } from '../safety/HoldButton';
import { ShareTrip } from '../safety/ShareTrip';
import { CAMPUS_STRINGS } from './strings';

interface Props {
  language: LanguageCode;
  blind: boolean;
  visualOnly: boolean;
  hasRoute: boolean;
  routeCompare: { standard: RouteOption; accessible: RouteOption };
  effortStd: EffortBreakdown;
  effortAcc: EffortBreakdown;
  easiestIsAccessible: boolean;
  /** Wheelchair-blocking barriers on each route. */
  barriers: { standard: number; accessible: number };
  hazards: ActiveHazard[];
  stepFocusActive: boolean;
  stepFocusIndex: number;
  setStepFocusIndex: (i: number) => void;
  session: WalkSession;
  placeName: string;
  emergencyContact: EmergencyContact | null;
  onSaveContact: (c: EmergencyContact) => void;
  onOpenPreferences: () => void;
  isSpeaking: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  beginWalk: () => void;
  endWalk: () => void;
}

/**
 * Safe Path navigation under the campus map: shortest-vs-easiest comparison, cautions, steps with
 * read-aloud, Start navigation, then the live step card with Walk-With-Me sharing and SOS.
 */
export function RouteNavPanel(p: Props) {
  const t = STRINGS[p.language];
  const S = SAFE[p.language];
  const c = CAMPUS_STRINGS[p.language];
  const steps = p.routeCompare.accessible.steps;
  const { standard, accessible } = p.routeCompare;

  if (!p.hasRoute) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[var(--ink-secondary)]">{c.pickRouteFirst}</p>
        {p.blind && (
          <EmergencyContactCard language={p.language} contact={p.emergencyContact} onChange={p.onSaveContact} large />
        )}
      </div>
    );
  }

  const comparison = (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-2xl bg-[var(--status-red-soft)] border border-[var(--status-red)]/30 space-y-1">
        <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--status-red)]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t.shortestWay}</span>
        </div>
        <div className="text-base font-bold font-mono-tabular text-[var(--ink-primary)]">
          {standard.stairs_count === 0 ? t.noStairs : `${standard.stairs_count} ${t.stairsCount}`}
        </div>
        {p.barriers.standard > 0 && (
          <div className="text-xs font-bold text-[var(--status-red)]">
            {p.barriers.standard} × {c.barrier} ({c.blocksWheelchair})
          </div>
        )}
        <div className="text-[11px] text-[var(--ink-secondary)] font-mono-tabular leading-snug">
          {effortLine(p.effortStd, p.language)}
        </div>
        {!p.easiestIsAccessible && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--ink-primary)] text-[var(--bg-surface)] text-[10px] font-bold">
            {S.easiest}
          </span>
        )}
      </div>
      <div className="p-3 rounded-2xl bg-[var(--status-good-soft)] border border-[var(--status-good)]/40 space-y-1">
        <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--status-good)]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t.safestWay}</span>
        </div>
        <div className="text-base font-bold font-mono-tabular text-[var(--ink-primary)]">
          {accessible.stairs_count === 0 ? t.noStairs : `${accessible.stairs_count} ${t.stairsCount}`}
        </div>
        {p.barriers.accessible > 0 && (
          <div className="text-xs font-bold text-[var(--status-red)]">
            {p.barriers.accessible} × {c.barrier}
          </div>
        )}
        <div className="text-[11px] text-[var(--ink-secondary)] font-mono-tabular leading-snug">
          {accessible.duration_min} min · {effortLine(p.effortAcc, p.language)}
        </div>
        {p.easiestIsAccessible && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--ink-primary)] text-[var(--bg-surface)] text-[10px] font-bold">
            {S.easiest}
          </span>
        )}
      </div>
    </div>
  );

  const warnings = accessible.warnings.length > 0 && (
    <ul className="flex flex-wrap gap-1.5" aria-label={S.heading}>
      {accessible.warnings.map((w) => (
        <li key={w} className="px-2.5 py-1 rounded-full bg-[var(--status-amber-soft)] text-[11px] font-bold text-[var(--ink-primary)]">
          {w}
        </li>
      ))}
    </ul>
  );

  const safetyRow = (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--status-good)]">
        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
        {S.safetyOn}
      </span>
      <HoldButton
        holdMs={2000}
        onActivate={() => p.session.triggerSos('manual')}
        className="px-3.5 py-2 rounded-xl border-2 border-[var(--status-red)] text-[var(--status-red)] text-xs font-bold min-h-[44px]"
      >
        {S.sosHold}
      </HoldButton>
    </div>
  );

  // -------- Live step card (while navigating) --------
  if (p.stepFocusActive) {
    const step = steps[p.stepFocusIndex];
    const last = p.stepFocusIndex >= steps.length - 1;
    return (
      <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--ink-primary)] space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--status-good)]">
          <span className="font-mono-tabular">
            {p.stepFocusIndex + 1} / {steps.length}
          </span>
          <span>{t.stepFreeTag}</span>
        </div>
        <div className={`${p.blind ? 'text-2xl' : 'text-xl'} font-bold text-[var(--ink-primary)] leading-snug`}>
          {step?.instruction}
        </div>
        {step?.warning && <div className="text-xs font-bold text-[var(--status-amber)]">{step.warning}</div>}
        <div className="text-sm font-mono-tabular text-[var(--ink-secondary)]">
          {step?.distance_m} {t.distance}
        </div>

        {p.session.trackUrl && (
          <ShareTrip url={p.session.trackUrl} language={p.language} contact={p.emergencyContact} placeName={p.placeName} />
        )}
        {safetyRow}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={p.stepFocusIndex === 0}
            onClick={() => {
              const prev = Math.max(0, p.stepFocusIndex - 1);
              p.setStepFocusIndex(prev);
              p.speakText(steps[prev]?.instruction || '');
            }}
            className="py-3.5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-sm font-bold text-[var(--ink-primary)] disabled:opacity-40 min-h-[52px]"
          >
            {t.prevStepBtn}
          </button>
          <button
            type="button"
            onClick={p.endWalk}
            className="py-3.5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] text-sm font-bold text-[var(--ink-primary)] min-h-[52px]"
          >
            {t.stopNavigationBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              if (last) p.speakText(t.arrivedLabel);
              p.session.advance(); // last step -> arrival check
            }}
            className="py-3.5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold min-h-[52px]"
          >
            {last ? t.done : t.nextStepBtn}
          </button>
        </div>
      </div>
    );
  }

  // -------- Overview: compare, cautions, steps, Start --------
  return (
    <div className="space-y-3">
      {comparison}
      <CautionList hazards={p.hazards} language={p.language} />
      {warnings}

      {p.blind && (
        <EmergencyContactCard language={p.language} contact={p.emergencyContact} onChange={p.onSaveContact} large />
      )}

      <button
        type="button"
        onClick={p.beginWalk}
        className={`w-full rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold flex items-center justify-center gap-2 ${
          p.blind ? 'py-5 text-lg min-h-[64px]' : 'py-4 text-base min-h-[54px]'
        }`}
      >
        <Navigation className="w-5 h-5" aria-hidden="true" />
        <span>{t.startNavigationBtn}</span>
      </button>

      <div className="bg-[var(--bg-paper)] border border-[var(--border-line)] rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--ink-primary)]">{accessible.gate_chosen}</h2>
          {!p.visualOnly && (
            <button
              type="button"
              onClick={() =>
                p.isSpeaking
                  ? p.stopSpeaking()
                  : p.speakText(steps.map((s, i) => `${i + 1}. ${s.instruction}`).join(' '))
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-xs font-bold min-h-[40px] shrink-0"
            >
              {p.isSpeaking ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
              <span>{p.isSpeaking ? t.stopSpeaking : t.readAloud}</span>
            </button>
          )}
        </div>

        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li
              key={step.id}
              className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-full bg-[var(--tactile-yellow-soft)] border border-[var(--ink-primary)] font-mono-tabular font-bold text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--ink-primary)]">{step.instruction}</div>
                  <div className="text-xs text-[var(--ink-secondary)] font-mono-tabular">
                    {step.distance_m} {t.distance}
                    {step.warning && <span className="text-[var(--status-amber)] font-bold"> · {step.warning}</span>}
                  </div>
                </div>
              </div>
              {!p.visualOnly && (
                <button
                  type="button"
                  onClick={() => p.speakText(step.instruction)}
                  aria-label={t.speakStep}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-line)] flex items-center justify-center shrink-0"
                >
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ol>

        {!p.blind &&
          (p.emergencyContact ? (
            <p className="text-xs font-semibold text-[var(--ink-secondary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--status-good)]" aria-hidden="true" />
              {S.safetyOn} · {S.contactSaved(p.emergencyContact.name)}
            </p>
          ) : (
            <button
              type="button"
              onClick={p.onOpenPreferences}
              className="text-xs font-bold underline underline-offset-4 text-[var(--ink-primary)] min-h-[40px]"
            >
              {S.contactNone}. {S.contactTitle}
            </button>
          ))}
      </div>
    </div>
  );
}
