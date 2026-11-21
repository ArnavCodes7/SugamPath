import { getSpeechLocale } from '../i18n';
import type { LanguageCode } from '../../types/sugampath';

// ---------------------------------------------------------------------------
// Speech
// ---------------------------------------------------------------------------

export function speak(text: string, lang: LanguageCode, opts: { rate?: number; onEnd?: () => void } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    opts.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = getSpeechLocale(lang);
  u.rate = opts.rate ?? 0.92;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

interface Recognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onspeechstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

export function speechRecognitionAvailable(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/**
 * Listens for one phrase. Resolves null if nobody starts speaking within `silenceMs`
 * (the "2 seconds of silence cancels" rule) or on error.
 */
export function listenOnce(lang: LanguageCode, silenceMs = 2000, maxMs = 8000): Promise<string | null> {
  const w = window as unknown as Record<string, new () => Recognizer>;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return Promise.resolve(null);

  return new Promise((resolve) => {
    let done = false;
    const rec = new Ctor();
    const finish = (v: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(silenceTimer);
      clearTimeout(maxTimer);
      try {
        rec.abort();
      } catch {
        // already stopped
      }
      resolve(v);
    };
    rec.lang = getSpeechLocale(lang);
    rec.interimResults = false;
    rec.continuous = false;
    rec.onspeechstart = () => clearTimeout(silenceTimer);
    rec.onresult = (e) => finish(e.results[0]?.[0]?.transcript?.trim() || null);
    rec.onerror = () => finish(null);
    rec.onend = () => finish(null);
    const silenceTimer = setTimeout(() => finish(null), silenceMs);
    const maxTimer = setTimeout(() => finish(null), maxMs);
    try {
      rec.start();
    } catch {
      finish(null);
    }
  });
}

// ---------------------------------------------------------------------------
// Wake lock, battery, camera
// ---------------------------------------------------------------------------

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

export async function requestWakeLock(): Promise<() => void> {
  const nav = navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<WakeLockSentinelLike> } };
  let lock: WakeLockSentinelLike | null = null;
  let released = false;
  const acquire = async () => {
    try {
      lock = (await nav.wakeLock?.request('screen')) ?? null;
    } catch {
      lock = null;
    }
  };
  await acquire();
  // The lock is dropped when the tab is hidden. Re-take it on return.
  const onVis = () => {
    if (document.visibilityState === 'visible' && !released) void acquire();
  };
  document.addEventListener('visibilitychange', onVis);
  return () => {
    released = true;
    document.removeEventListener('visibilitychange', onVis);
    void lock?.release().catch(() => {});
  };
}

export async function readBattery(): Promise<number | null> {
  const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
  try {
    const b = await nav.getBattery?.();
    return b ? Math.round(b.level * 100) : null;
  } catch {
    return null;
  }
}

/** Grabs one frame from the rear camera without any preview or aiming. Returns a small JPEG data URL. */
export async function captureFrame(maxSide = 640): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    // Let auto-exposure settle for a moment.
    await new Promise((r) => setTimeout(r, 350));
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6);
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

/** Asks for camera + mic once, up front, so no permission prompt interrupts a walk. */
export async function warmUpPermissions() {
  try {
    const s = await navigator.mediaDevices?.getUserMedia({ video: true, audio: true });
    s?.getTracks().forEach((t) => t.stop());
  } catch {
    // Either may be denied. Features degrade individually.
  }
}

// ---------------------------------------------------------------------------
// Contact links
// ---------------------------------------------------------------------------

export function cleanPhone(p: string): string {
  return p.replace(/[^\d+]/g, '');
}

/** wa.me wants digits only, with country code. Bare 10-digit Indian numbers get +91. */
export function whatsappDigits(p: string): string {
  const d = cleanPhone(p).replace(/^\+/, '');
  return d.length === 10 ? `91${d}` : d;
}

export function telLink(p: string) {
  return `tel:${cleanPhone(p)}`;
}
export function smsLink(p: string, body: string) {
  return `sms:${cleanPhone(p)}?body=${encodeURIComponent(body)}`;
}
export function whatsappLink(p: string, body: string) {
  return `https://wa.me/${whatsappDigits(p)}?text=${encodeURIComponent(body)}`;
}

export function isValidPhone(p: string): boolean {
  const d = cleanPhone(p).replace(/^\+/, '');
  return d.length >= 10 && d.length <= 15;
}
