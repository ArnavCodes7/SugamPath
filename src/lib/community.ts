import { supabase } from './supabase';

// ------------------------------------------------------------------ types
export type Verdict = 'friendly' | 'partial' | 'not_friendly';
export type CommunityMode = 'wheelchair' | 'blind' | 'walker';
export type PhotoStatus = 'pending' | 'processing' | 'processed' | 'rejected';

export const FEATURES = [
  'step_free_entrance',
  'ramp',
  'lift',
  'wide_door',
  'accessible_toilet',
  'tactile_paving',
  'smooth_path',
  'handrail',
  'audible_signal',
  'seating',
  'parking',
  'low_counter',
] as const;
export type Feature = (typeof FEATURES)[number];

export const PHOTO_TAGS = ['footpath', 'crossing', 'ramp', 'steps', 'obstruction', 'damage', 'kerb', 'lighting'] as const;
export type PhotoTag = (typeof PHOTO_TAGS)[number];

export interface PlaceMark {
  id: string;
  user_id: string;
  author_name: string;
  place_ext_id: string | null;
  name: string;
  lat: number;
  lon: number;
  verdict: Verdict;
  features: string[];
  modes: string[];
  note: string | null;
  created_at: string;
  confirms: number;
  disputes: number;
  /** true while only stored on this device (outbox). */
  pending?: boolean;
}

export interface RoadPhoto {
  id: string;
  user_id: string;
  author_name: string;
  storage_path: string;
  lat: number | null;
  lon: number | null;
  accuracy_m: number | null;
  place_ext_id: string | null;
  tags: string[];
  note: string | null;
  status: PhotoStatus;
  created_at: string;
  url: string;
  pending?: boolean;
  /** Local preview for outbox items. */
  localUrl?: string;
}

export type NewMark = Pick<PlaceMark, 'name' | 'lat' | 'lon' | 'verdict' | 'features' | 'modes' | 'note' | 'place_ext_id'>;
export interface NewPhoto {
  blob: Blob;
  width: number;
  height: number;
  lat: number | null;
  lon: number | null;
  accuracy_m: number | null;
  place_ext_id: string | null;
  tags: string[];
  note: string | null;
}

export const BUCKET = 'road-photos';

export function photoUrl(path: string): string {
  return supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : '';
}

/** PostgREST says the table is not there yet = the SQL in supabase/community.sql was not run. */
export function isMissingTable(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message ?? '');
}

// ------------------------------------------------------------------ image compression
/** Resize to max 1600 px and re-encode as JPEG. Re-encoding through a canvas also strips EXIF/GPS metadata. */
export async function compressImage(file: Blob, maxSide = 1600, quality = 0.82): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bmp) throw new Error('unreadable-image');
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const width = Math.max(1, Math.round(bmp.width * scale));
  const height = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-canvas');
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
  if (!blob) throw new Error('encode-failed');
  return { blob, width, height };
}

// ------------------------------------------------------------------ outbox (IndexedDB)
interface OutboxItem {
  id: string;
  kind: 'photo' | 'mark';
  createdAt: number;
  mark?: NewMark;
  photo?: Omit<NewPhoto, 'blob'>;
  blob?: Blob;
}

const DB_NAME = 'sugampath_outbox';
const STORE = 'items';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}

export const outbox = {
  async add(item: OutboxItem) {
    await tx('readwrite', (s) => s.put(item));
  },
  async remove(id: string) {
    await tx('readwrite', (s) => s.delete(id));
  },
  async all(): Promise<OutboxItem[]> {
    try {
      const rows = await tx<OutboxItem[]>('readonly', (s) => s.getAll() as IDBRequest<OutboxItem[]>);
      return rows.sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      return [];
    }
  },
};

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ------------------------------------------------------------------ remote calls
export async function fetchMarks(): Promise<PlaceMark[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('community_marks_v').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) throw error;
  return (data ?? []) as PlaceMark[];
}

export async function fetchPhotos(): Promise<RoadPhoto[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('road_photos')
    .select('id,user_id,author_name,storage_path,lat,lon,accuracy_m,place_ext_id,tags,note,status,created_at')
    .order('created_at', { ascending: false })
    .limit(120);
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...(r as Omit<RoadPhoto, 'url'>), url: photoUrl((r as { storage_path: string }).storage_path) }));
}

export async function fetchMyVotes(userId: string): Promise<Record<string, 'confirm' | 'dispute'>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('community_mark_votes').select('mark_id,vote').eq('user_id', userId);
  if (error) return {};
  return Object.fromEntries((data ?? []).map((v) => [v.mark_id as string, v.vote as 'confirm' | 'dispute']));
}

export async function insertMark(m: NewMark, authorName: string): Promise<void> {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from('community_marks').insert({ ...m, author_name: authorName });
  if (error) throw error;
}

export async function castVote(markId: string, userId: string, vote: 'confirm' | 'dispute' | null): Promise<void> {
  if (!supabase) throw new Error('offline');
  if (vote === null) {
    const { error } = await supabase.from('community_mark_votes').delete().eq('mark_id', markId).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('community_mark_votes')
    .upsert({ mark_id: markId, user_id: userId, vote }, { onConflict: 'mark_id,user_id' });
  if (error) throw error;
}

export async function uploadPhoto(p: NewPhoto, userId: string, authorName: string): Promise<void> {
  if (!supabase) throw new Error('offline');
  const path = `${userId}/${uid()}.jpg`;
  const up = await supabase.storage.from(BUCKET).upload(path, p.blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
  if (up.error) throw up.error;
  const { error } = await supabase.from('road_photos').insert({
    storage_path: path,
    lat: p.lat,
    lon: p.lon,
    accuracy_m: p.accuracy_m,
    place_ext_id: p.place_ext_id,
    tags: p.tags,
    note: p.note,
    width: p.width,
    height: p.height,
    bytes: p.blob.size,
    author_name: authorName,
    status: 'pending',
  });
  if (error) {
    // Don't leave an orphaned file behind if the row failed.
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

export async function deleteMark(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('community_marks').delete().eq('id', id);
  if (error) throw error;
}

export async function deletePhoto(p: RoadPhoto): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('road_photos').delete().eq('id', p.id);
  if (error) throw error;
  await supabase.storage.from(BUCKET).remove([p.storage_path]);
}

// ------------------------------------------------------------------ small helpers
export function timeAgo(iso: string, lang: 'en' | 'hi' | 'pa' = 'en'): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const u = (n: number, en: string, hi: string, pa: string) => (lang === 'hi' ? `${n} ${hi}` : lang === 'pa' ? `${n} ${pa}` : `${n}${en}`);
  if (s < 60) return lang === 'hi' ? 'अभी' : lang === 'pa' ? 'ਹੁਣੇ' : 'just now';
  if (s < 3600) return u(Math.round(s / 60), 'm ago', 'मिनट पहले', 'ਮਿੰਟ ਪਹਿਲਾਂ');
  if (s < 86400) return u(Math.round(s / 3600), 'h ago', 'घंटे पहले', 'ਘੰਟੇ ਪਹਿਲਾਂ');
  return u(Math.round(s / 86400), 'd ago', 'दिन पहले', 'ਦਿਨ ਪਹਿਲਾਂ');
}

/** Metres between two lon/lat points. */
export function distM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const kx = 111_320 * Math.cos((aLat * Math.PI) / 180);
  return Math.hypot((aLon - bLon) * kx, (aLat - bLat) * 110_540);
}
