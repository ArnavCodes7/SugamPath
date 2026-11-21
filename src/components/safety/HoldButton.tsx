import { useEffect, useRef, useState, type ReactNode } from 'react';

interface HoldButtonProps {
  /** Press and hold this long to activate. Prevents accidental taps on important actions. */
  holdMs: number;
  onActivate: () => void;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

/** A button that only fires after a deliberate hold, with a fill bar that shows progress. */
export function HoldButton({ holdMs, onActivate, className = '', children, ariaLabel }: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const startedAt = useRef(0);

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    timer.current = null;
    raf.current = null;
    setProgress(0);
  };

  const begin = () => {
    clear();
    startedAt.current = performance.now();
    const tick = () => {
      setProgress(Math.min(1, (performance.now() - startedAt.current) / holdMs));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    timer.current = window.setTimeout(() => {
      clear();
      onActivate();
    }, holdMs);
  };

  useEffect(() => clear, []);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.stopPropagation();
        begin();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        clear();
      }}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Keyboard users: Enter/Space held also works via a single deliberate press.
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault();
          e.stopPropagation();
          onActivate();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative overflow-hidden select-none touch-none ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-current opacity-20"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}
