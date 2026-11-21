import { useEffect, useRef, useState } from 'react';
import { bearingDeg, type LonLat, type RouteLine, pointAt, routeBearingAt } from '../lib/liveNav';

export interface LiveFix {
  lat: number;
  lon: number;
  /** metres, 68% radius */
  accuracy: number;
  /** compass degrees of travel (null = unknown) */
  heading: number | null;
  /** m/s */
  speed: number | null;
  ts: number;
  /** true when the position comes from the demo walker, not the device */
  simulated: boolean;
}

export type GpsStatus = 'searching' | 'ok' | 'denied' | 'unavailable';

/** Continuous device GPS while `enabled`. Derives heading from movement when the device gives none. */
export function useLiveGps(enabled: boolean) {
  const [fix, setFix] = useState<LiveFix | null>(null);
  const [status, setStatus] = useState<GpsStatus>('searching');
  const last = useRef<LiveFix | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFix(null);
      last.current = null;
      return;
    }
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('searching');
    const id = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const prev = last.current;
        let heading = coords.heading != null && !Number.isNaN(coords.heading) ? coords.heading : null;
        if (heading === null && prev) {
          const kx = Math.cos((coords.latitude * Math.PI) / 180) * 111_320;
          const moved = Math.hypot((coords.longitude - prev.lon) * kx, (coords.latitude - prev.lat) * 110_540);
          if (moved > 3) heading = bearingDeg([prev.lon, prev.lat], [coords.longitude, coords.latitude]);
          else heading = prev.heading;
        }
        const next: LiveFix = {
          lat: coords.latitude,
          lon: coords.longitude,
          accuracy: Math.round(coords.accuracy),
          heading,
          speed: coords.speed != null && !Number.isNaN(coords.speed) ? coords.speed : null,
          ts: timestamp,
          simulated: false,
        };
        last.current = next;
        setFix(next);
        setStatus('ok');
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'searching'),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { fix, status };
}

/** Walks a virtual user along the route (for demos / testing away from campus). Returns null when off. */
export function useDemoWalker(line: RouteLine | null, enabled: boolean, speedMs = 7): LiveFix | null {
  const [fix, setFix] = useState<LiveFix | null>(null);
  const along = useRef(0);

  useEffect(() => {
    if (!enabled || !line) {
      setFix(null);
      along.current = 0;
      return;
    }
    let raf = 0;
    let prevT = performance.now();
    let lastEmit = 0;
    const tick = (now: number) => {
      const dt = (now - prevT) / 1000;
      prevT = now;
      along.current = Math.min(line.total, along.current + speedMs * dt);
      if (now - lastEmit > 120) {
        lastEmit = now;
        const p: LonLat = pointAt(line, along.current);
        setFix({
          lat: p[1],
          lon: p[0],
          accuracy: 4,
          heading: routeBearingAt(line, along.current),
          speed: speedMs,
          ts: Date.now(),
          simulated: true,
        });
      }
      if (along.current < line.total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, line, speedMs]);

  return fix;
}
