import type { ActiveTrip } from '../../types/safety';

/**
 * Offline Corridor Survival.
 * The moment navigation starts, everything needed to keep guiding is saved on the device:
 * route steps, bearings, cautions, and the emergency contact. IndexedDB first, localStorage as backup.
 */

const DB = 'sugampath';
const STORE = 'active-trip';
const KEY = 'active';
const LS_KEY = 'sugampath_active_trip_v1';
const MAX_AGE_MS = 6 * 3600_000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(trip: ActiveTrip | null) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    if (trip) tx.objectStore(STORE).put(trip, KEY);
    else tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(): Promise<ActiveTrip | null> {
  const db = await openDb();
  const v = await new Promise<ActiveTrip | null>((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as ActiveTrip) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return v;
}

export async function saveActiveTrip(trip: ActiveTrip): Promise<void> {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(trip));
  } catch {
    // ignore
  }
  try {
    await idbPut(trip);
  } catch {
    // localStorage copy still exists
  }
}

export async function loadActiveTrip(): Promise<ActiveTrip | null> {
  let trip: ActiveTrip | null = null;
  try {
    trip = await idbGet();
  } catch {
    trip = null;
  }
  if (!trip) {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      trip = raw ? (JSON.parse(raw) as ActiveTrip) : null;
    } catch {
      trip = null;
    }
  }
  if (trip && Date.now() - trip.startedAt > MAX_AGE_MS) {
    await clearActiveTrip();
    return null;
  }
  return trip;
}

export async function clearActiveTrip(): Promise<void> {
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
  try {
    await idbPut(null);
  } catch {
    // ignore
  }
}

/** Cheap progress save (localStorage only, no await) so a reload mid-walk resumes at the right step. */
export function saveProgress(stepIndex: number) {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const t = JSON.parse(raw) as ActiveTrip;
    t.stepIndex = stepIndex;
    window.localStorage.setItem(LS_KEY, JSON.stringify(t));
  } catch {
    // ignore
  }
}
