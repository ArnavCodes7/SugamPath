import type { GeoFix, SurfaceKind, SurfaceSample } from '../../types/safety';

/**
 * Pocket-Pulse: zero-photo surface sensing from the phone's motion sensors + GPS speed.
 *
 *   periodic vertical impacts + speed drop  -> stairs
 *   sustained X/Y vibration jitter          -> rough / broken pavement
 *   smooth low-variance motion              -> smooth surface
 *   > 2.5 G spike then 5 s stillness        -> possible fall
 *
 * Thresholds are first-pass heuristics. Log real walks and tune before relying on them in the field.
 */

export const G = 9.81;
export const FALL_SPIKE_G = 2.5;
export const FALL_STILL_MS = 5000;

const STEP_THRESH = 1.5; // m/s^2 vertical linear acceleration to count as a footfall
const STEP_REFRACTORY_MS = 300;
const WINDOW_MS = 2000;
const STAIRS_MIN_PEAK_AMP = 4.0;
const STAIRS_MAX_SPEED = 0.9; // m/s. Climbing is slower than level walking (~1.3 m/s).
const ROUGH_H_RMS = 2.0;
const SMOOTH_H_RMS = 1.2;
const STILL_DYN = 2.0; // |a| - g within this counts as "not moving"
const MOVING_SPEED = 0.4;

export type PulseEvent =
  | { type: 'step'; t: number }
  | { type: 'fall'; t: number; confidence: number }
  | { type: SurfaceKind; t: number; confidence: number };

interface Sample {
  t: number;
  v: number;
  h: number;
}

export class PulseAnalyzer {
  private g = { x: 0, y: 0, z: G };
  private gReady = false;
  private lastT = 0;
  private win: Sample[] = [];
  private peaks: Array<{ t: number; amp: number }> = [];
  private inPeak = false;
  private peakMax = 0;
  private peakT = 0;
  private lastStepT = -Infinity;
  private windowStart = 0;
  private fall: { t: number } | null = null;
  private speed: number | null = null;

  /** GPS speed in m/s, or null when unknown. */
  setSpeed(s: number | null) {
    this.speed = s;
  }

  push(t: number, ax: number, ay: number, az: number): PulseEvent[] {
    const out: PulseEvent[] = [];
    const mag = Math.sqrt(ax * ax + ay * ay + az * az);

    // --- gravity estimate (low-pass) -> vertical / horizontal split
    if (!this.gReady) {
      this.g = { x: ax, y: ay, z: az };
      this.gReady = true;
      this.windowStart = t;
    } else {
      const dt = Math.max(0, (t - this.lastT) / 1000);
      const a = Math.exp(-dt / 0.8);
      this.g.x = a * this.g.x + (1 - a) * ax;
      this.g.y = a * this.g.y + (1 - a) * ay;
      this.g.z = a * this.g.z + (1 - a) * az;
    }
    this.lastT = t;
    const gm = Math.sqrt(this.g.x ** 2 + this.g.y ** 2 + this.g.z ** 2) || G;
    const ux = this.g.x / gm;
    const uy = this.g.y / gm;
    const uz = this.g.z / gm;
    const lx = ax - this.g.x;
    const ly = ay - this.g.y;
    const lz = az - this.g.z;
    const v = lx * ux + ly * uy + lz * uz;
    const h = Math.sqrt(Math.max(0, lx * lx + ly * ly + lz * lz - v * v));

    // --- fall detector
    if (!this.fall && mag > FALL_SPIKE_G * G) {
      this.fall = { t };
    } else if (this.fall) {
      const since = t - this.fall.t;
      if (since > 800 && Math.abs(mag - G) > STILL_DYN) {
        this.fall = null; // they got up / kept moving: not a fall
      } else if (since >= FALL_STILL_MS) {
        out.push({ type: 'fall', t, confidence: 0.85 });
        this.fall = null;
      }
    }

    // --- footfall peaks
    if (!this.inPeak && v > STEP_THRESH) {
      this.inPeak = true;
      this.peakMax = v;
      this.peakT = t;
    } else if (this.inPeak) {
      if (v > this.peakMax) this.peakMax = v;
      if (v < STEP_THRESH * 0.5) {
        this.inPeak = false;
        if (this.peakT - this.lastStepT > STEP_REFRACTORY_MS) {
          this.lastStepT = this.peakT;
          this.peaks.push({ t: this.peakT, amp: this.peakMax });
          out.push({ type: 'step', t: this.peakT });
        }
      }
    }

    // --- 2 s classification window
    this.win.push({ t, v, h });
    if (t - this.windowStart >= WINDOW_MS) {
      const ev = this.classify(t);
      if (ev) out.push(ev);
      this.win = [];
      this.peaks = this.peaks.filter((p) => p.t > t - 500);
      this.windowStart = t;
    }
    return out;
  }

  private classify(t: number): PulseEvent | null {
    const n = this.win.length;
    if (n < 10) return null;
    const rmsH = Math.sqrt(this.win.reduce((s, x) => s + x.h * x.h, 0) / n);
    const peaks = this.peaks.filter((p) => p.t >= this.windowStart);
    const walking = peaks.length >= 2;
    const moving = walking || (this.speed !== null && this.speed > MOVING_SPEED);
    if (!moving) return null;

    if (peaks.length >= 3) {
      const amps = peaks.map((p) => p.amp);
      const meanAmp = amps.reduce((a, b) => a + b, 0) / amps.length;
      const gaps = peaks.slice(1).map((p, i) => p.t - peaks[i].t);
      const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const sd = Math.sqrt(gaps.reduce((s, x) => s + (x - meanGap) ** 2, 0) / gaps.length);
      const regular = meanGap > 0 && sd / meanGap < 0.35;
      const slow = this.speed === null || this.speed < STAIRS_MAX_SPEED;
      if (meanAmp >= STAIRS_MIN_PEAK_AMP && regular && slow) {
        return { type: 'stairs', t, confidence: this.speed === null ? 0.5 : 0.8 };
      }
    }
    if (rmsH > ROUGH_H_RMS) {
      return { type: 'rough', t, confidence: Math.min(0.9, 0.5 + (rmsH - ROUGH_H_RMS) / 3) };
    }
    if (rmsH <= SMOOTH_H_RMS) {
      return { type: 'smooth', t, confidence: 0.7 };
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Browser wrapper
// ---------------------------------------------------------------------------

export interface PulseCallbacks {
  onEvent: (e: PulseEvent) => void;
  onFix: (fix: GeoFix) => void;
}

type MotionCtor = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

export class PocketPulseSensor {
  private analyzer = new PulseAnalyzer();
  private watchId: number | null = null;
  private lastFix: GeoFix | null = null;
  private lastSpeedAt = 0;
  readonly samples: SurfaceSample[] = [];

  constructor(private cb: PulseCallbacks) {}

  /** iOS needs this inside a tap handler. Elsewhere it resolves true. */
  static async requestPermission(): Promise<boolean> {
    if (typeof DeviceMotionEvent === 'undefined') return false;
    const ctor = DeviceMotionEvent as MotionCtor;
    if (typeof ctor.requestPermission === 'function') {
      try {
        return (await ctor.requestPermission()) === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }

  get position(): GeoFix | null {
    return this.lastFix;
  }

  private handleMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    if (Date.now() - this.lastSpeedAt > 5000) this.analyzer.setSpeed(null);
    for (const ev of this.analyzer.push(Date.now(), a.x, a.y, a.z)) {
      if (ev.type !== 'step' && ev.type !== 'fall') {
        this.samples.push({
          t: ev.t,
          kind: ev.type,
          confidence: ev.confidence,
          lat: this.lastFix?.lat ?? null,
          lng: this.lastFix?.lng ?? null,
        });
      }
      this.cb.onEvent(ev);
    }
  };

  start() {
    window.addEventListener('devicemotion', this.handleMotion);
    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const fix: GeoFix = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
            t: Date.now(),
          };
          let speed = pos.coords.speed;
          if ((speed == null || Number.isNaN(speed)) && this.lastFix) {
            const dt = (fix.t - this.lastFix.t) / 1000;
            if (dt > 1) speed = haversineM(this.lastFix, fix) / dt;
          }
          if (speed != null && !Number.isNaN(speed)) {
            this.analyzer.setSpeed(speed);
            this.lastSpeedAt = Date.now();
          }
          this.lastFix = fix;
          this.cb.onFix(fix);
        },
        () => {
          // GPS denied or unavailable: motion-only sensing still works.
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
      );
    }
  }

  stop() {
    window.removeEventListener('devicemotion', this.handleMotion);
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }
}

export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
