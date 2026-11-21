import type { SugamBackend } from './types';
import type { SosEvent, SurroundingsResult, TripState } from '../../types/safety';

/**
 * Default backend: works with no server.
 * - Trips live in localStorage and sync between browser tabs via BroadcastChannel,
 *   so opening /track/<token> in a second tab shows a genuine live view for demos.
 * - "What's ahead?" calls VITE_API_BASE/api/whats-ahead if set, otherwise returns a labelled sample reply.
 */

const TRIPS_KEY = 'sugampath_trips_v1';
const CHANNEL = 'sugampath-trips';

function readAll(): Record<string, TripState> {
  try {
    return JSON.parse(window.localStorage.getItem(TRIPS_KEY) || '{}') as Record<string, TripState>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, TripState>) {
  // Keep only the 20 most recent trips.
  const keep = Object.values(all)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 20);
  const next: Record<string, TripState> = {};
  for (const t of keep) next[t.token] = t;
  try {
    window.localStorage.setItem(TRIPS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function createLocalBackend(): SugamBackend {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  const listeners = new Map<string, Set<(t: TripState) => void>>();

  const emit = (trip: TripState) => {
    listeners.get(trip.token)?.forEach((fn) => fn(trip));
  };
  channel?.addEventListener('message', (e: MessageEvent<TripState>) => emit(e.data));

  const save = (trip: TripState) => {
    const all = readAll();
    all[trip.token] = trip;
    writeAll(all);
    emit(trip);
    channel?.postMessage(trip);
  };

  const patchTrip = (token: string, fn: (t: TripState) => TripState) => {
    const cur = readAll()[token];
    if (cur) save(fn(cur));
  };

  return {
    name: 'local',

    async createTrip(trip) {
      save(trip);
    },
    async updateTrip(token, patch) {
      patchTrip(token, (t) => ({ ...t, ...patch, updatedAt: Date.now() }));
    },
    async raiseSos(token, sos: SosEvent) {
      patchTrip(token, (t) => ({ ...t, status: 'sos', sos, updatedAt: Date.now() }));
    },
    async resolveSos(token) {
      patchTrip(token, (t) => ({
        ...t,
        status: t.status === 'sos' ? 'walking' : t.status,
        sos: t.sos ? { ...t.sos, resolvedAt: Date.now() } : t.sos,
        updatedAt: Date.now(),
      }));
    },
    async getTrip(token) {
      return readAll()[token] ?? null;
    },
    subscribeTrip(token, onChange) {
      let set = listeners.get(token);
      if (!set) listeners.set(token, (set = new Set()));
      set.add(onChange);
      const current = readAll()[token];
      if (current) onChange(current);
      return () => set!.delete(onChange);
    },

    async submitSurfaceSamples() {
      // Local only: the device already tallies walks in surfaceStore.
    },
    async reportHazard() {
      // Local only: hazardStore already holds it.
    },
    async fetchHazards() {
      return [];
    },
    async submitArrivalCheck() {},
    async recordLegalReport() {},

    async analyzeSurroundings(req): Promise<SurroundingsResult> {
      const base = import.meta.env.VITE_API_BASE as string | undefined;
      if (base) {
        const res = await fetch(`${base.replace(/\/$/, '')}/api/whats-ahead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: req.imageDataUrl, language: req.language, placeId: req.placeId }),
        });
        if (!res.ok) throw new Error(`whats-ahead ${res.status}`);
        return (await res.json()) as SurroundingsResult;
      }
      // Sample reply so the flow is demonstrable without an AI key.
      await new Promise((r) => setTimeout(r, 900));
      return {
        guidance: SAMPLE_GUIDANCE[req.language],
        hazard: { kind: 'parked_vehicle', side: 'left' },
      };
    },
  };
}

const SAMPLE_GUIDANCE = {
  en: 'Sample reply. A parked scooter may be blocking the tactile tiles on your left. Step slightly right and continue slowly.',
  hi: 'नमूना उत्तर। आपकी बाईं ओर एक खड़ा स्कूटर टैक्टाइल टाइल्स रोक रहा हो सकता है। थोड़ा दाएं हटकर धीरे चलें।',
  pa: 'ਨਮੂਨਾ ਜਵਾਬ। ਤੁਹਾਡੇ ਖੱਬੇ ਪਾਸੇ ਖੜ੍ਹਾ ਸਕੂਟਰ ਟੈਕਟਾਈਲ ਟਾਈਲਾਂ ਰੋਕ ਸਕਦਾ ਹੈ। ਥੋੜ੍ਹਾ ਸੱਜੇ ਹੋ ਕੇ ਹੌਲੀ ਚੱਲੋ।',
} as const;
