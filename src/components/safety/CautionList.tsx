import { AlertTriangle, Clock } from 'lucide-react';
import { cautionText, SAFE } from '../../lib/i18nSafety';
import type { ActiveHazard } from '../../types/safety';
import type { LanguageCode } from '../../types/sugampath';

interface Props {
  hazards: ActiveHazard[];
  language: LanguageCode;
  /** Routes the user is not taking are still shown, but only the ones on the chosen gate matter most. */
  max?: number;
}

/** Calm amber list of live cautions and peak-hour warnings. Renders nothing when there are none. */
export function CautionList({ hazards, language, max = 3 }: Props) {
  if (!hazards.length) return null;
  const s = SAFE[language];
  const shown = hazards.slice(0, max);
  return (
    <section aria-label={s.heading} className="rounded-2xl bg-[var(--status-amber-soft)] border border-[var(--status-amber)]/30 p-4 space-y-2">
      <h2 className="text-xs font-bold text-[var(--status-amber)] flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        {s.heading}
      </h2>
      <ul className="space-y-1.5">
        {shown.map((h) => (
          <li key={h.id} className="flex items-start gap-2 text-sm font-semibold text-[var(--ink-primary)]">
            {h.status === 'peak' || h.peakHour ? (
              <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[var(--status-amber)]" aria-hidden="true" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-amber)] mt-2 shrink-0" aria-hidden="true" />
            )}
            <span>
              {cautionText(h, language)}
              {h.peakHour && h.status !== 'peak' && (
                <span className="block text-xs font-medium text-[var(--ink-secondary)]">{s.cautionPeak(s.hazardKind[h.kind])}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
