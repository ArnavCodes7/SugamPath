import type { HazardReport, LegalReportRecord, SugamBackend, SurroundingsRequest } from './types';
import { createLocalBackend } from './localBackend';
import type { SosEvent, SurfaceSample, SurroundingsResult, TripState, ArrivalCheckInput } from '../../types/safety';

/**
 * Supabase adapter (not wired by default).
 *
 * To go live:
 *   1. npm i @supabase/supabase-js
 *   2. Run supabase/schema.sql in your project's SQL editor.
 *   3. In src/main.tsx:
 *        import { createClient } from '@supabase/supabase-js';
 *        import { registerBackend } from './services/backend';
 *        import { createSupabaseBackend } from './services/backend/supabaseBackend';
 *        registerBackend(createSupabaseBackend(createClient(URL, ANON_KEY)));
 *
 * The client is typed structurally below so this file compiles without the package installed.
 */

interface SbResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}
interface SbQuery extends PromiseLike<SbResult<any>> {
  select(cols?: string): SbQuery;
  eq(col: string, val: string): SbQuery;
  maybeSingle(): PromiseLike<SbResult<any>>;
}
interface SbChannel {
  on(type: string, filter: Record<string, unknown>, cb: (payload: { payload?: any; new?: any }) => void): SbChannel;
  subscribe(): SbChannel;
  send(msg: { type: string; event: string; payload: unknown }): Promise<unknown>;
}
export interface SupabaseLike {
  from(table: string): {
    insert(row: unknown): PromiseLike<SbResult>;
    upsert(row: unknown): PromiseLike<SbResult>;
    select(cols?: string): SbQuery;
  };
  channel(name: string): SbChannel;
  removeChannel(ch: SbChannel): unknown;
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<SbResult<any>>;
  functions: { invoke(name: string, opts: { body: unknown }): PromiseLike<SbResult<any>> };
}

const must = (r: SbResult) => {
  if (r.error) throw new Error(r.error.message);
};

export function createSupabaseBackend(sb: SupabaseLike): SugamBackend {
  /** Trip rows hold the whole TripState as JSON. Realtime fan-out uses a broadcast channel per token. */
  const persist = async (trip: TripState) => {
    must(await sb.rpc('put_trip', { p_token: trip.token, p_state: trip }));
  };

  const channels = new Map<string, SbChannel>();
  const sender = (token: string): SbChannel => {
    let ch = channels.get(token);
    if (!ch) {
      ch = sb.channel(`trip:${token}`).subscribe();
      channels.set(token, ch);
    }
    return ch;
  };
  const broadcast = async (trip: TripState) => {
    try {
      await sender(trip.token).send({ type: 'broadcast', event: 'trip', payload: trip });
    } catch {
      // best effort; followers also poll
    }
  };

  const get = async (token: string): Promise<TripState | null> => {
    const r = await sb.rpc('get_trip', { p_token: token });
    if (r.error) throw new Error(r.error.message);
    return (r.data as TripState) ?? null;
  };

  // Merge-then-persist keeps the row authoritative even if two writers race.
  const merge = async (token: string, fn: (t: TripState) => TripState) => {
    const cur = await get(token);
    if (!cur) return;
    const next = fn(cur);
    await persist(next);
    await broadcast(next);
  };

  return {
    name: 'supabase',

    async createTrip(trip) {
      await persist(trip);
      await broadcast(trip);
    },
    updateTrip: (token, patch) => merge(token, (t) => ({ ...t, ...patch, updatedAt: Date.now() })),
    raiseSos: (token, sos: SosEvent) =>
      merge(token, (t) => ({ ...t, status: 'sos', sos, updatedAt: Date.now() })),
    resolveSos: (token) =>
      merge(token, (t) => ({
        ...t,
        status: t.status === 'sos' ? 'walking' : t.status,
        sos: t.sos ? { ...t.sos, resolvedAt: Date.now() } : t.sos,
        updatedAt: Date.now(),
      })),
    getTrip: get,

    subscribeTrip(token, onChange) {
      let last = 0;
      const push = (t: TripState | null) => {
        if (t && (t.updatedAt ?? 0) >= last) {
          last = t.updatedAt ?? 0;
          onChange(t);
        }
      };
      const poll = () => void get(token).then(push).catch(() => {});
      poll();
      const timer = setInterval(poll, 3000);
      const ch = sb
        .channel(`trip-follow:${token}`)
        .on('broadcast', { event: 'trip' }, (msg) => msg.payload && push(msg.payload as TripState))
        .subscribe();
      return () => {
        clearInterval(timer);
        sb.removeChannel(ch);
      };
    },
    async submitSurfaceSamples(samples: SurfaceSample[]) {
      must(
        await sb
          .from('surface_samples')
          .insert(samples.map((s) => ({ t: s.t, kind: s.kind, confidence: s.confidence, lat: s.lat, lng: s.lng, place_id: s.placeId ?? null })))
      );
    },
    async reportHazard(r: HazardReport) {
      must(
        await sb
          .from('hazard_reports')
          .insert({ place_id: r.placeId, gate_name: r.gateName, kind: r.kind, source: r.source, at: new Date(r.at).toISOString() })
      );
    },
    async fetchHazards(placeId: string) {
      const r = await sb.from('hazard_reports').select('*').eq('place_id', placeId);
      const rows = (r.data ?? []) as Array<{ place_id: string; gate_name: string; kind: HazardReport['kind']; source: HazardReport['source']; at: string }>;
      return rows.map((x) => ({ placeId: x.place_id, gateName: x.gate_name, kind: x.kind, source: x.source, at: Date.parse(x.at) }));
    },
    async submitArrivalCheck(c: ArrivalCheckInput) {
      must(
        await sb
          .from('arrival_checks')
          .insert({ place_id: c.placeId, gate_name: c.gateName, step_free: c.stepFree, at: new Date(c.at).toISOString() })
      );
    },
    async recordLegalReport(r: LegalReportRecord) {
      must(
        await sb.from('legal_reports').insert({
          audit_id: r.auditId,
          issue_id: r.issueId,
          track: r.track,
          evidence_hash: r.evidenceHash,
          generated_at: r.generatedAt,
        })
      );
    },

    /** Served by the Vercel function /api/whats-ahead (Gemini, Groq fallback). */
    analyzeSurroundings: (req: SurroundingsRequest): Promise<SurroundingsResult> =>
      createLocalBackend().analyzeSurroundings(req),
  };
}
