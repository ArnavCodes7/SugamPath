import { useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Armchair,
  ArrowUpFromLine,
  Accessibility,
  Bath,
  CheckCircle2,
  CircleAlert,
  CircleSlash,
  DoorOpen,
  Ear,
  Footprints,
  Lightbulb,
  MoveVertical,
  ParkingCircle,
  Ruler,
  Spline,
  Square,
  TrafficCone,
  TrendingUp,
  Construction,
  Hand,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Verdict } from '../../lib/community';
import { CM } from '../../lib/i18nCommunity';
import type { LanguageCode } from '../../types/sugampath';

export const VERDICT_META: Record<
  Verdict,
  { color: string; soft: string; Icon: LucideIcon; key: 'vFriendly' | 'vPartial' | 'vNot' }
> = {
  friendly: { color: '#1f9d55', soft: 'var(--status-good-soft)', Icon: CheckCircle2, key: 'vFriendly' },
  partial: { color: '#d99100', soft: 'var(--status-amber-soft)', Icon: CircleAlert, key: 'vPartial' },
  not_friendly: { color: '#d62828', soft: 'var(--status-red-soft)', Icon: CircleSlash, key: 'vNot' },
};

export const FEATURE_ICON: Record<string, LucideIcon> = {
  step_free_entrance: Footprints,
  ramp: TrendingUp,
  lift: MoveVertical,
  wide_door: DoorOpen,
  accessible_toilet: Bath,
  tactile_paving: Spline,
  smooth_path: Ruler,
  handrail: Hand,
  audible_signal: Ear,
  seating: Armchair,
  parking: ParkingCircle,
  low_counter: Square,
};

export const TAG_ICON: Record<string, LucideIcon> = {
  footpath: Footprints,
  crossing: TrafficCone,
  ramp: TrendingUp,
  steps: ArrowUpFromLine,
  obstruction: Construction,
  damage: CircleAlert,
  kerb: Ruler,
  lighting: Lightbulb,
};

export const MODE_ICON = { wheelchair: Accessibility, blind: Ear, walker: Footprints } as const;

export function VerdictBadge({ verdict, language, small }: { verdict: Verdict; language: LanguageCode; small?: boolean }) {
  const m = VERDICT_META[verdict];
  const c = CM[language];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-extrabold ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ background: m.soft, color: m.color }}
    >
      <m.Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      {c[m.key]}
    </span>
  );
}

/** Full-height bottom sheet used by the contribute flows. */
export function Sheet({
  title,
  onClose,
  children,
  footer,
  closeLabel,
  accent,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
  accent?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label={closeLabel} onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="relative w-full sm:max-w-xl max-h-[94dvh] sm:max-h-[90dvh] flex flex-col bg-[var(--bg-paper)] rounded-t-[28px] sm:rounded-[28px] border border-[var(--border-line)] shadow-2xl overflow-hidden"
      >
        <header className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-surface)] border-b border-[var(--border-line)]">
          {accent}
          <h2 className="flex-1 min-w-0 text-lg font-extrabold truncate">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="w-10 h-10 rounded-full grid place-items-center hover:bg-[var(--bg-subtle)]">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && <footer className="px-5 py-3 bg-[var(--bg-surface)] border-t border-[var(--border-line)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</footer>}
      </motion.div>
    </motion.div>
  );
}

export function StepDots({ total, index }: { total: number; index: number }) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-[var(--ink-primary)]' : i < index ? 'w-3 bg-[var(--ink-primary)]/60' : 'w-3 bg-[var(--border-line)]'}`}
        />
      ))}
    </div>
  );
}
