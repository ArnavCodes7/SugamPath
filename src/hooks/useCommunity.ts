import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  castVote,
  deleteMark,
  deletePhoto,
  fetchMarks,
  fetchMyVotes,
  fetchPhotos,
  insertMark,
  isMissingTable,
  outbox,
  uid,
  uploadPhoto,
  type NewMark,
  type NewPhoto,
  type PlaceMark,
  type RoadPhoto,
} from '../lib/community';

export type CommunityStatus = 'loading' | 'ready' | 'missing' | 'error' | 'off';
export type SaveResult = 'saved' | 'queued' | 'needs-auth' | 'error';

interface Queued {
  id: string;
  kind: 'photo' | 'mark';
  mark?: PlaceMark;
  photo?: RoadPhoto;
}

/** Community data (marks + road photos) with optimistic writes, an offline outbox and live updates. */
export function useCommunity() {
  const { user, displayName } = useAuth();
  const [marks, setMarks] = useState<PlaceMark[]>([]);
  const [photos, setPhotos] = useState<RoadPhoto[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, 'confirm' | 'dispute'>>({});
  const [status, setStatus] = useState<CommunityStatus>(supabase ? 'loading' : 'off');
  const [queued, setQueued] = useState<Queued[]>([]);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const flushing = useRef(false);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      const [m, p] = await Promise.all([fetchMarks(), fetchPhotos()]);
      setMarks(m);
      setPhotos(p);
      setStatus('ready');
    } catch (e) {
      setStatus(isMissingTable(e as { code?: string; message?: string }) ? 'missing' : 'error');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Live updates: someone else marks a place or uploads a photo -> it shows up here.
  useEffect(() => {
    if (!supabase || status === 'missing') return;
    let timer: number | undefined;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refresh(), 600);
    };
    const ch = supabase
      .channel('community-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_marks' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_mark_votes' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'road_photos' }, bump)
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase!.removeChannel(ch);
    };
  }, [refresh, status]);

  useEffect(() => {
    if (!user) return setMyVotes({});
    void fetchMyVotes(user.id).then(setMyVotes);
  }, [user, marks.length]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // ---- outbox: load saved-on-device items, and send them once we're online + signed in
  const loadOutbox = useCallback(async () => {
    const items = await outbox.all();
    setQueued(
      items.map((it): Queued => {
        if (it.kind === 'mark' && it.mark) {
          return {
            id: it.id,
            kind: 'mark',
            mark: {
              ...it.mark,
              id: it.id,
              user_id: '',
              author_name: displayName,
              created_at: new Date(it.createdAt).toISOString(),
              confirms: 0,
              disputes: 0,
              pending: true,
            },
          };
        }
        return {
          id: it.id,
          kind: 'photo',
          photo: {
            id: it.id,
            user_id: '',
            author_name: displayName,
            storage_path: '',
            lat: it.photo?.lat ?? null,
            lon: it.photo?.lon ?? null,
            accuracy_m: it.photo?.accuracy_m ?? null,
            place_ext_id: it.photo?.place_ext_id ?? null,
            tags: it.photo?.tags ?? [],
            note: it.photo?.note ?? null,
            status: 'pending',
            created_at: new Date(it.createdAt).toISOString(),
            url: '',
            pending: true,
            localUrl: it.blob ? URL.createObjectURL(it.blob) : undefined,
          },
        };
      })
    );
  }, [displayName]);

  useEffect(() => {
    void loadOutbox();
  }, [loadOutbox]);

  const flush = useCallback(async () => {
    if (!user || !supabase || !online || flushing.current || status === 'missing') return;
    flushing.current = true;
    try {
      for (const it of await outbox.all()) {
        try {
          if (it.kind === 'mark' && it.mark) await insertMark(it.mark, displayName);
          else if (it.kind === 'photo' && it.photo && it.blob) await uploadPhoto({ ...it.photo, blob: it.blob }, user.id, displayName);
          await outbox.remove(it.id);
        } catch {
          break; // still offline / backend issue: keep the rest for next time
        }
      }
    } finally {
      flushing.current = false;
      await loadOutbox();
      void refresh();
    }
  }, [user, online, status, displayName, loadOutbox, refresh]);

  useEffect(() => {
    if (queued.length) void flush();
  }, [queued.length, flush]);

  // ---- writes
  const addMark = useCallback(
    async (m: NewMark): Promise<SaveResult> => {
      if (!user) return 'needs-auth';
      try {
        await insertMark(m, displayName);
        void refresh();
        return 'saved';
      } catch (e) {
        if (isMissingTable(e as { code?: string; message?: string })) return 'error';
        if (online && (e as { code?: string }).code) return 'error'; // server rejected it: don't retry blindly
        await outbox.add({ id: uid(), kind: 'mark', createdAt: Date.now(), mark: m });
        await loadOutbox();
        return 'queued';
      }
    },
    [user, displayName, online, refresh, loadOutbox]
  );

  const addPhoto = useCallback(
    async (p: NewPhoto): Promise<SaveResult> => {
      if (!user) return 'needs-auth';
      try {
        await uploadPhoto(p, user.id, displayName);
        void refresh();
        return 'saved';
      } catch (e) {
        if (isMissingTable(e as { code?: string; message?: string })) return 'error';
        if (online && (e as { statusCode?: string; code?: string }).statusCode) return 'error';
        const { blob, ...meta } = p;
        await outbox.add({ id: uid(), kind: 'photo', createdAt: Date.now(), photo: meta, blob });
        await loadOutbox();
        return 'queued';
      }
    },
    [user, displayName, online, loadOutbox]
  );

  const vote = useCallback(
    async (markId: string, v: 'confirm' | 'dispute') => {
      if (!user) return false;
      const prev = myVotes[markId] ?? null;
      const next = prev === v ? null : v;
      // optimistic
      setMyVotes((s) => {
        const c = { ...s };
        if (next) c[markId] = next;
        else delete c[markId];
        return c;
      });
      setMarks((list) =>
        list.map((m) => {
          if (m.id !== markId) return m;
          let { confirms, disputes } = m;
          if (prev === 'confirm') confirms--;
          if (prev === 'dispute') disputes--;
          if (next === 'confirm') confirms++;
          if (next === 'dispute') disputes++;
          return { ...m, confirms, disputes };
        })
      );
      try {
        await castVote(markId, user.id, next);
        return true;
      } catch {
        void refresh();
        return false;
      }
    },
    [user, myVotes, refresh]
  );

  const removeMark = useCallback(async (id: string) => {
    setMarks((l) => l.filter((m) => m.id !== id));
    await deleteMark(id).catch(() => void refresh());
  }, [refresh]);

  const removePhoto = useCallback(async (p: RoadPhoto) => {
    setPhotos((l) => l.filter((x) => x.id !== p.id));
    await deletePhoto(p).catch(() => void refresh());
  }, [refresh]);

  const allMarks = useMemo(() => [...queued.flatMap((q) => (q.mark ? [q.mark] : [])), ...marks], [queued, marks]);
  const allPhotos = useMemo(() => [...queued.flatMap((q) => (q.photo ? [q.photo] : [])), ...photos], [queued, photos]);
  const mine = useMemo(
    () => ({
      marks: user ? marks.filter((m) => m.user_id === user.id).length + queued.filter((q) => q.mark).length : 0,
      photos: user ? photos.filter((p) => p.user_id === user.id).length + queued.filter((q) => q.photo).length : 0,
    }),
    [user, marks, photos, queued]
  );
  const contributors = useMemo(() => new Set([...marks.map((m) => m.user_id), ...photos.map((p) => p.user_id)]).size, [marks, photos]);

  return {
    status,
    marks: allMarks,
    photos: allPhotos,
    myVotes,
    mine,
    contributors,
    queuedCount: queued.length,
    online,
    refresh,
    flush,
    addMark,
    addPhoto,
    vote,
    removeMark,
    removePhoto,
    userId: user?.id ?? null,
  };
}

export type CommunityApi = ReturnType<typeof useCommunity>;
