import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import { CITY, type NetworkGeoJson, type PlaceRow } from '../lib/accessibility-types';
import { parseWkbPoint } from '../lib/wkb';

/** Row of the `annotations` table (barriers / ramps / steps marked on the campus). */
export interface BarrierRow {
  external_id: string;
  type: string; // 'barrier' | 'ramp' | 'steps' | ...
  blocks: string; // 'wheelchair' | 'none' | ...
  note: string | null;
  edge_external_id: string | null;
  lon: number;
  lat: number;
}

/** place external_id -> routing graph node id (from the `gates` table). */
export type GateNodes = Record<string, number>;

/**
 * Shared, cached store for the campus network + places (read-only, from Supabase RPCs).
 *
 * - Fetched once per session and shared by every screen.
 * - Last good copy is kept in localStorage, so the map paints instantly / works offline.
 * - Stays fresh automatically while the app is open:
 *     • Realtime postgres_changes on path_segments / places / gates (instant when the tables
 *       are in the `supabase_realtime` publication; silently inert otherwise),
 *     • a cheap change check (row count + max id) every 30 s,
 *     • a full refetch every 5 min and whenever the tab becomes visible again.
 *   State only changes when the data actually changed, so the map doesn't flicker.
 */

export type LoadStatus = 'loading' | 'ready' | 'error';

export interface CampusData {
  network: NetworkGeoJson | null;
  places: PlaceRow[] | null;
  barriers: BarrierRow[];
  gateNodes: GateNodes | null;
  networkStatus: LoadStatus;
  placesStatus: LoadStatus;
  networkError: string | null;
  placesError: string | null;
}

const CACHE_KEY = `sugampath_campus_${CITY}_v2`;
const CHECK_MS = 30_000;
const FULL_MS = 5 * 60_000;
const WATCHED_TABLES = ['path_segments', 'places', 'gates', 'annotations'] as const;

let state: CampusData = {
  network: null,
  places: null,
  barriers: [],
  gateNodes: null,
  networkStatus: 'loading',
  placesStatus: 'loading',
  networkError: null,
  placesError: null,
};
let networkJson = '';
let placesJson = '';
let extrasJson = '';
let fingerprint = '';
const listeners = new Set<() => void>();

function set(patch: Partial<CampusData>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const c = JSON.parse(raw) as {
      network?: NetworkGeoJson;
      places?: PlaceRow[];
      barriers?: BarrierRow[];
      gateNodes?: GateNodes;
    };
    if (Array.isArray(c.barriers) && c.gateNodes) {
      extrasJson = JSON.stringify([c.barriers, c.gateNodes]);
      set({ barriers: c.barriers, gateNodes: c.gateNodes });
    }
    if (c.network?.type === 'FeatureCollection') {
      networkJson = JSON.stringify(c.network);
      set({ network: c.network, networkStatus: 'ready' });
    }
    if (Array.isArray(c.places)) {
      placesJson = JSON.stringify(c.places);
      set({ places: c.places, placesStatus: 'ready' });
    }
  } catch {
    // corrupt cache — ignore
  }
}

function writeCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        network: state.network,
        places: state.places,
        barriers: state.barriers,
        gateNodes: state.gateNodes,
      }));
  } catch {
    // quota — the in-memory copy still works
  }
}

const NOT_CONFIGURED = 'Supabase is not configured (missing URL / anon key).';

async function fetchNetwork() {
  if (!supabase) return set({ networkStatus: 'error', networkError: NOT_CONFIGURED });
  const { data, error } = await supabase.rpc('network_geojson', { p_city: CITY });
  if (error) {
    // Keep showing a cached copy if we have one.
    if (!state.network) set({ networkStatus: 'error', networkError: error.message });
    return;
  }
  const fc: NetworkGeoJson =
    data && (data as NetworkGeoJson).type === 'FeatureCollection'
      ? (data as NetworkGeoJson)
      : { type: 'FeatureCollection', features: [] };
  if (!Array.isArray(fc.features)) fc.features = [];
  const json = JSON.stringify(fc);
  if (json !== networkJson || state.networkStatus !== 'ready') {
    networkJson = json;
    set({ network: fc, networkStatus: 'ready', networkError: null });
    writeCache();
  }
}

async function fetchPlaces() {
  if (!supabase) return set({ placesStatus: 'error', placesError: NOT_CONFIGURED });
  const { data, error } = await supabase.rpc('places_list', { p_city: CITY });
  if (error) {
    const missing = /function .*places_list|could not find the function/i.test(error.message);
    if (!state.places)
      set({
        placesStatus: 'error',
        placesError: missing
          ? 'places_list() is not installed in Supabase. Run places.sql once in the SQL editor.'
          : error.message,
      });
    return;
  }
  const rows = ((data ?? []) as PlaceRow[]).filter(
    (p) => Number.isFinite(p.lon) && Number.isFinite(p.lat)
  );
  const json = JSON.stringify(rows);
  if (json !== placesJson || state.placesStatus !== 'ready') {
    placesJson = json;
    set({ places: rows, placesStatus: 'ready', placesError: null });
    writeCache();
  }
}

/** Gates (place -> graph node) and barrier annotations, used for barrier-aware routing. */
async function fetchExtras() {
  if (!supabase) return;
  const [g, a] = await Promise.all([
    supabase.from('gates').select('place_external_id,node_id').eq('city', CITY),
    supabase.from('annotations').select('external_id,type,blocks,note,edge_external_id,geom').eq('city', CITY),
  ]);
  if (g.error || a.error) return; // keep whatever we had
  const gateNodes: GateNodes = {};
  for (const r of (g.data ?? []) as { place_external_id: string; node_id: number | null }[]) {
    if (r.node_id != null && !(r.place_external_id in gateNodes)) gateNodes[r.place_external_id] = Number(r.node_id);
  }
  const barriers: BarrierRow[] = [];
  for (const r of (a.data ?? []) as (Omit<BarrierRow, 'lon' | 'lat'> & { geom: unknown })[]) {
    const pt = parseWkbPoint(r.geom);
    if (!pt) continue;
    barriers.push({
      external_id: r.external_id,
      type: r.type,
      blocks: r.blocks,
      note: r.note,
      edge_external_id: r.edge_external_id,
      lon: pt[0],
      lat: pt[1],
    });
  }
  const json = JSON.stringify([barriers, gateNodes]);
  if (json !== extrasJson) {
    extrasJson = json;
    set({ barriers, gateNodes });
    writeCache();
  }
}

function refreshAll() {
  return Promise.all([fetchNetwork(), fetchPlaces(), fetchExtras()]);
}

/** Tiny request per table: row count + highest id. Changes when the pipeline re-runs. */
async function computeFingerprint(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const parts = await Promise.all(
      WATCHED_TABLES.map(async (t) => {
        const { data, count, error } = await supabase!
          .from(t)
          .select('id', { count: 'exact' })
          .eq('city', CITY)
          .order('id', { ascending: false })
          .limit(1);
        if (error) throw error;
        return `${t}:${count ?? 0}:${(data?.[0] as { id?: number } | undefined)?.id ?? 0}`;
      })
    );
    return parts.join('|');
  } catch {
    return null;
  }
}

async function checkForChanges() {
  const fp = await computeFingerprint();
  if (fp === null) return;
  if (fingerprint && fp !== fingerprint) await refreshAll();
  fingerprint = fp;
}

let started = false;
let users = 0;
let teardown: (() => void) | null = null;

function start() {
  if (started) return;
  started = true;
  readCache();
  void refreshAll().then(checkForChanges);

  const checkTimer = setInterval(() => void checkForChanges(), CHECK_MS);
  const fullTimer = setInterval(() => void refreshAll(), FULL_MS);
  const onVisible = () => {
    if (document.visibilityState === 'visible') void refreshAll();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onVisible);

  let debounce: ReturnType<typeof setTimeout> | undefined;
  const channel = supabase?.channel(`campus-${CITY}`);
  if (channel) {
    for (const table of WATCHED_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => void refreshAll(), 1500);
      });
    }
    channel.subscribe();
  }

  teardown = () => {
    clearInterval(checkTimer);
    clearInterval(fullTimer);
    clearTimeout(debounce);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onVisible);
    if (channel) void supabase?.removeChannel(channel);
    started = false;
  };
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Retry after an error (used by the "Try again" buttons). */
export function retryCampusData() {
  if (state.networkStatus === 'error') set({ networkStatus: 'loading', networkError: null });
  if (state.placesStatus === 'error') set({ placesStatus: 'loading', placesError: null });
  void refreshAll();
}

export function useCampusData(): CampusData {
  useEffect(() => {
    users += 1;
    start();
    return () => {
      users -= 1;
      // Keep polling across tab switches; stop only when nothing uses the data for a while.
      setTimeout(() => {
        if (users === 0) teardown?.();
      }, 60_000);
    };
  }, []);
  return useSyncExternalStore(subscribe, () => state);
}
