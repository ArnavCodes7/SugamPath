/**
 * Audio feedback for eyes-free use: chimes, beeps, and a 3D "ping" panned left/right
 * so it points toward the path/gate using the phone's compass.
 * One AudioContext, unlocked by the Start tap (browsers block audio before a gesture).
 */

type Chime = 'listen' | 'cancel' | 'ok' | 'beep' | 'armed';

export class AudioGuide {
  private ctx: AudioContext | null = null;
  private heading: number | null = null;
  private onOrient = (e: DeviceOrientationEvent) => {
    const w = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
    if (typeof w.webkitCompassHeading === 'number') {
      this.heading = w.webkitCompassHeading; // iOS: already clockwise from north
    } else if (e.absolute && e.alpha != null) {
      this.heading = (360 - e.alpha) % 360;
    }
  };

  /** Call from a user gesture. */
  async unlock() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  async startCompass() {
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (typeof D.requestPermission === 'function') {
        if ((await D.requestPermission()) !== 'granted') return;
      }
    } catch {
      return;
    }
    window.addEventListener('deviceorientationabsolute', this.onOrient as EventListener);
    window.addEventListener('deviceorientation', this.onOrient);
  }

  stopCompass() {
    window.removeEventListener('deviceorientationabsolute', this.onOrient as EventListener);
    window.removeEventListener('deviceorientation', this.onOrient);
  }

  get compassHeading(): number | null {
    return this.heading;
  }

  /** Bearing relative to where the phone points, -180..180. 0 = straight ahead, + = to the right. */
  relativeBearing(target: number | null): number | null {
    if (target === null || this.heading === null) return null;
    let d = (target - this.heading + 540) % 360 - 180;
    if (d === -180) d = 180;
    return d;
  }

  private tone(freq: number, start: number, dur: number, gain = 0.25, pan = 0, type: OscillatorType = 'sine') {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    let node: AudioNode = osc;
    if (typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      osc.connect(p);
      node = p;
    }
    node.connect(g).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  }

  chime(kind: Chime) {
    switch (kind) {
      case 'listen': // unmistakable ascending three-note
        this.tone(523, 0, 0.14);
        this.tone(659, 0.14, 0.14);
        this.tone(880, 0.28, 0.3, 0.3);
        break;
      case 'cancel': // soft descending
        this.tone(440, 0, 0.18, 0.12);
        this.tone(330, 0.18, 0.25, 0.1);
        break;
      case 'ok':
        this.tone(660, 0, 0.12, 0.15);
        this.tone(880, 0.12, 0.2, 0.15);
        break;
      case 'armed':
        this.tone(740, 0, 0.1, 0.2);
        this.tone(740, 0.16, 0.1, 0.2);
        break;
      case 'beep':
        this.tone(1000, 0, 0.25, 0.4, 0, 'square');
        break;
    }
  }

  /**
   * Directional ping. Sound comes from where the path/gate is:
   * left ear if it's to the left, right ear if to the right, centred when you face it.
   * Without a compass reading it pings centred (still confirms the tap).
   */
  ping(targetBearing: number | null) {
    const rel = this.relativeBearing(targetBearing);
    const pan = rel === null ? 0 : Math.sin((rel * Math.PI) / 180);
    const behind = rel !== null && Math.abs(rel) > 110;
    // Lower, doubled tone when the target is behind you.
    if (behind) {
      this.tone(330, 0, 0.12, 0.3, pan);
      this.tone(330, 0.16, 0.12, 0.3, pan);
    } else {
      this.tone(880, 0, 0.18, 0.35, pan);
    }
  }

  /** "ahead" | "left" | "right" | "behind" for speech. null when no compass. */
  sideWord(target: number | null): 'ahead' | 'left' | 'right' | 'behind' | null {
    const rel = this.relativeBearing(target);
    if (rel === null) return null;
    const a = Math.abs(rel);
    if (a <= 30) return 'ahead';
    if (a >= 140) return 'behind';
    return rel > 0 ? 'right' : 'left';
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // unsupported
  }
}
