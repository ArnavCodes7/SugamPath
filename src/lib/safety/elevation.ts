import { useEffect, useState } from 'react';
import { polylineLength } from './effort';
import type { Place, RouteOption } from '../../types/sugampath';

/**
 * Average gradient of a route from Open-Meteo's free elevation API (no key).
 * The 90 m terrain grid cannot see ramps, so this only ever RAISES the slope shown
 * (the audited ramp slope stays the floor). Results are cached so it also works offline.
 */

const CACHE_KEY = 'sugampath_slope_v1';

function readCache(): Record<string, number> {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

export async function fetchAverageSlopeDeg(route: RouteOption, place: Place): Promise<number | null> {
  const pts = route.points;
  const pixelLen = polylineLength(pts);
  if (pts.length < 2 || pixelLen === 0) return null;

  const metresPerUnit = route.distance_m / pixelLen;
  const end = pts[pts.length - 1];
  const lat0 = place.lat;
  const lngs: string[] = [];
  const lats: string[] = [];
  for (const p of [pts[0], end]) {
    const dx = (p.x - end.x) * metresPerUnit;
    const dy = (p.y - end.y) * metresPerUnit; // map y grows southward
    lats.push((lat0 - dy / 111_320).toFixed(6));
    lngs.push((place.lng + dx / (111_320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6));
  }

  const res = await fetch(
    `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lngs.join(',')}`
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { elevation?: number[] };
  const [z0, z1] = json.elevation ?? [];
  if (z0 === undefined || z1 === undefined) return null;
  const deg = (Math.atan(Math.abs(z1 - z0) / route.distance_m) * 180) / Math.PI;
  return Math.round(deg * 10) / 10;
}

/** Returns the measured slope once known. null while loading, offline, or unavailable. */
export function useMeasuredSlope(routeId: string, kind: string, route: RouteOption, place: Place): number | null {
  const key = `${routeId}:${kind}`;
  const [deg, setDeg] = useState<number | null>(() => readCache()[key] ?? null);

  useEffect(() => {
    const cached = readCache()[key];
    if (cached !== undefined) {
      setDeg(cached);
      return;
    }
    setDeg(null);
    if (!navigator.onLine) return;
    let alive = true;
    fetchAverageSlopeDeg(route, place)
      .then((d) => {
        if (!alive || d === null) return;
        setDeg(d);
        try {
          const all = readCache();
          all[key] = d;
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(all));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // offline or blocked: keep audited slope
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return deg;
}
