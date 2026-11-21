import { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTipProps {
  label: string;
  text: string;
}

export function InfoTip({ label, text }: InfoTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        aria-label={label}
        aria-expanded={open}
        className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-7 z-40 w-56 p-2.5 rounded-lg bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs leading-snug border border-[var(--border-line)]"
        >
          {text}
        </span>
      )}
    </span>
  );
}
