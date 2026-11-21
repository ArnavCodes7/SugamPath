import { createLocalBackend } from './localBackend';
import { withOutbox } from './outbox';
import type { SugamBackend } from './types';

export type { SugamBackend, HazardReport, LegalReportRecord } from './types';

let current: SugamBackend = createLocalBackend();

/** Swap in a real backend. Remote backends get the offline outbox automatically. */
export function registerBackend(b: SugamBackend) {
  current = b.name === 'local' ? b : withOutbox(b);
}

/**
 * Stable handle for the whole app. Calls are forwarded to whichever backend is registered,
 * so imports made before registerBackend() still point at the right one.
 */
export const backend: SugamBackend = new Proxy({} as SugamBackend, {
  get: (_t, prop: string) => {
    const v = (current as unknown as Record<string, unknown>)[prop];
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(current) : v;
  },
});

export function newToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16);
}

export function trackUrlFor(token: string): string {
  return `${window.location.origin}/track/${token}`;
}
