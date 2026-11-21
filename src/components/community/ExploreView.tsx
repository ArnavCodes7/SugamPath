import { useMemo, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, Check, Clock, ImageOff, List, Loader2, Map as MapIcon, MapPin, Navigation, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
import { CAMPUS_CENTER } from '../../lib/accessibility-types';
import { timeAgo, type PlaceMark, type RoadPhoto, type Verdict } from '../../lib/community';
import { CM, featureLabel, tagLabel } from '../../lib/i18nCommunity';
import { STREET_STYLE } from '../../lib/mapStyles';
import type { CommunityApi } from '../../hooks/useCommunity';
import type { LanguageCode } from '../../types/sugampath';
import { useAuth } from '../../lib/auth';
import { VERDICT_META, VerdictBadge } from './ui';

type View = 'map' | 'feed' | 'photos';
type Filter = 'all' | Verdict;

interface Props {
  language: LanguageCode;
  api: CommunityApi;
  onRouteHere: (placeExtId: string) => void;
  onContribute: () => void;
}

export function ExploreView({ language, api, onRouteHere, onContribute }: Props) {
  const c = CM[language];
  const [view, setView] = useState<View>('map');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<RoadPhoto | null>(null);
  const mapRef = useRef<MapRef>(null);

  const marks = useMemo(() => api.marks.filter((m) => filter === 'all' || m.verdict === filter), [api.marks, filter]);
  const sel = marks.find((m) => m.id === selected) ?? null;

  const views: { id: View; label: string; Icon: typeof List; n: number }[] = [
    { id: 'map', label: c.mapView, Icon: MapIcon, n: marks.length },
    { id: 'feed', label: c.feedView, Icon: List, n: marks.length },
    { id: 'photos', label: c.photosView, Icon: Camera, n: api.photos.length },
  ];
  const filters: { id: Filter; label: string; color?: string }[] = [
    { id: 'all', label: c.filterAll },
    { id: 'friendly', label: c.filterFriendly, color: VERDICT_META.friendly.color },
    { id: 'partial', label: c.filterPartial, color: VERDICT_META.partial.color },
    { id: 'not_friendly', label: c.filterNot, color: VERDICT_META.not_friendly.color },
  ];

  const focusMark = (m: PlaceMark) => {
    setSelected(m.id);
    setView('map');
    window.setTimeout(() => mapRef.current?.flyTo({ center: [m.lon, m.lat], zoom: 17.5, duration: 700 }), 60);
  };

  return (
    <div className="space-y-4">
      {/* View switch + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex p-1 rounded-2xl bg-[var(--bg-subtle)]" role="tablist" aria-label={c.segExplore}>
          {views.map(({ id, label, Icon, n }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`relative inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-sm font-bold transition-colors ${
                view === id ? 'text-[var(--ink-primary)]' : 'text-[var(--ink-secondary)]'
              }`}
            >
              {view === id && (
                <motion.span layoutId="explore-pill" className="absolute inset-0 rounded-xl bg-[var(--bg-surface)] shadow-sm border border-[var(--border-line)]" transition={{ type: 'spring', damping: 26, stiffness: 380 }} />
              )}
              <span className="relative inline-flex items-center gap-1.5">
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
                <span className="text-[10px] font-mono-tabular opacity-60">{n}</span>
              </span>
            </button>
          ))}
        </div>
        {view !== 'photos' && (
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1" role="group" aria-label={c.segExplore}>
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-full border-2 text-xs font-bold transition-colors ${
                  filter === f.id ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)] border-[var(--ink-primary)]' : 'bg-[var(--bg-surface)] border-[var(--border-line)]'
                }`}
              >
                {f.color && <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />}
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {api.status === 'loading' && (
        <div className="grid place-items-center py-16 text-[var(--ink-secondary)]">
          <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
        </div>
      )}

      {api.status !== 'loading' && view === 'map' && (
        <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--border-line)] h-[56dvh] min-h-[360px]">
          <Map
            ref={mapRef}
            initialViewState={{ longitude: CAMPUS_CENTER[0], latitude: CAMPUS_CENTER[1], zoom: 15.7 }}
            mapStyle={STREET_STYLE}
            style={{ position: 'absolute', inset: 0 }}
            attributionControl={{ compact: true }}
            onClick={() => setSelected(null)}
          >
            <NavigationControl position="top-right" showCompass={false} />
            {marks.map((m) => {
              const meta = VERDICT_META[m.verdict];
              const on = m.id === selected;
              return (
                <Marker key={m.id} longitude={m.lon} latitude={m.lat} anchor="bottom">
                  <button
                    type="button"
                    aria-label={`${m.name}: ${c[meta.key]}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(m.id);
                    }}
                    className="flex flex-col items-center focus:outline-none group"
                  >
                    <span
                      className={`grid place-items-center rounded-full border-[3px] border-white shadow-lg text-white transition-transform group-focus-visible:ring-4 group-focus-visible:ring-[var(--tactile-yellow)] ${on ? 'w-11 h-11 scale-110' : 'w-9 h-9'}`}
                      style={{ background: meta.color }}
                    >
                      <meta.Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] -mt-0.5" style={{ borderTopColor: meta.color }} />
                  </button>
                </Marker>
              );
            })}
            {api.photos
              .filter((p) => p.lat != null && p.lon != null)
              .map((p) => (
                <Marker key={p.id} longitude={p.lon!} latitude={p.lat!} anchor="center">
                  <button
                    type="button"
                    aria-label={c.viewPhoto}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox(p);
                    }}
                    className="w-8 h-8 rounded-lg border-2 border-white shadow-lg bg-[var(--ink-primary)] text-white grid place-items-center overflow-hidden"
                  >
                    {p.url || p.localUrl ? <img src={p.localUrl ?? p.url} alt="" className="w-full h-full object-cover" /> : <Camera className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </Marker>
              ))}
          </Map>

          <AnimatePresence>
            {sel && (
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="absolute inset-x-3 bottom-3 z-10"
              >
                <MarkCard m={sel} api={api} language={language} onRouteHere={onRouteHere} compact onClose={() => setSelected(null)} />
              </motion.div>
            )}
          </AnimatePresence>

          {marks.length === 0 && api.status !== 'missing' && (
            <div className="absolute inset-x-4 top-4 z-10">
              <EmptyCard title={c.emptyMarksTitle} body={c.emptyMarksBody} cta={c.addFirst} onCta={onContribute} />
            </div>
          )}
        </div>
      )}

      {api.status !== 'loading' && view === 'feed' && (
        <div className="space-y-3">
          {marks.length === 0 ? (
            <EmptyCard title={c.emptyMarksTitle} body={c.emptyMarksBody} cta={c.addFirst} onCta={onContribute} />
          ) : (
            marks.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                <MarkCard m={m} api={api} language={language} onRouteHere={onRouteHere} onShowOnMap={() => focusMark(m)} />
              </motion.div>
            ))
          )}
        </div>
      )}

      {api.status !== 'loading' && view === 'photos' && (
        <>
          {api.photos.length === 0 ? (
            <EmptyCard title={c.emptyPhotosTitle} body={c.emptyPhotosBody} cta={c.addFirst} onCta={onContribute} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {api.photos.map((p, i) => (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(p)}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i, 10) * 0.025 }}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden border-2 border-[var(--border-line)] bg-[var(--bg-subtle)] text-left"
                >
                  {p.url || p.localUrl ? (
                    <img src={p.localUrl ?? p.url} alt={p.note ?? c.photoOf} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <ImageOff className="absolute inset-0 m-auto w-8 h-8 text-[var(--ink-secondary)]" aria-hidden="true" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 p-2 pt-8 bg-gradient-to-t from-black/75 to-transparent text-white">
                    <PhotoStatusPill photo={p} language={language} />
                    <span className="block text-[11px] font-semibold opacity-90 truncate mt-1">
                      {p.author_name} · {timeAgo(p.created_at, language)}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {lightbox && <PhotoLightbox photo={lightbox} language={language} api={api} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  );
}

function EmptyCard({ title, body, cta, onCta }: { title: string; body: string; cta: string; onCta: () => void }) {
  return (
    <div className="rounded-3xl bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-line)] p-6 text-center space-y-2">
      <div className="mx-auto w-12 h-12 rounded-full bg-[var(--tactile-yellow-soft)] grid place-items-center">
        <MapPin className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="font-extrabold text-base">{title}</h3>
      <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-sm mx-auto">{body}</p>
      <button type="button" onClick={onCta} className="mt-1 h-11 px-5 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold">
        {cta}
      </button>
    </div>
  );
}

export function PhotoStatusPill({ photo, language }: { photo: RoadPhoto; language: LanguageCode }) {
  const c = CM[language];
  if (photo.pending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] px-2 py-0.5 text-[10px] font-extrabold">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {c.savedOnDevice}
      </span>
    );
  }
  const map = {
    pending: { label: c.stPending, bg: 'rgba(255,255,255,0.9)', fg: '#17181b', Icon: Clock },
    processing: { label: c.stProcessing, bg: '#ffc72c', fg: '#17181b', Icon: Loader2 },
    processed: { label: c.stProcessed, bg: '#1f9d55', fg: '#fff', Icon: Check },
    rejected: { label: c.stRejected, bg: '#d62828', fg: '#fff', Icon: X },
  } as const;
  const m = map[photo.status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: m.bg, color: m.fg }}>
      <m.Icon className={`w-3 h-3 ${photo.status === 'processing' ? 'animate-spin' : ''}`} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function MarkCard({
  m,
  api,
  language,
  onRouteHere,
  onShowOnMap,
  onClose,
  compact,
}: {
  m: PlaceMark;
  api: CommunityApi;
  language: LanguageCode;
  onRouteHere: (id: string) => void;
  onShowOnMap?: () => void;
  onClose?: () => void;
  compact?: boolean;
}) {
  const c = CM[language];
  const auth = useAuth();
  const [sure, setSure] = useState(false);
  const mine = !!api.userId && m.user_id === api.userId;
  const vote = api.myVotes[m.id];
  const meta = VERDICT_META[m.verdict];
  const trusted = m.confirms >= 3 && m.confirms > m.disputes * 2;
  const disputed = m.disputes >= 2 && m.disputes >= m.confirms;

  const onVote = (v: 'confirm' | 'dispute') => {
    if (!auth.user) return auth.openSignIn();
    void api.vote(m.id, v);
  };

  return (
    <article className="rounded-3xl bg-[var(--bg-surface)] border-2 overflow-hidden shadow-sm" style={{ borderColor: compact ? 'var(--ink-primary)' : 'var(--border-line)' }}>
      <div className="h-1.5" style={{ background: meta.color }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-extrabold text-base leading-snug">{m.name}</h3>
            <p className="text-xs font-semibold text-[var(--ink-secondary)]">
              {c.by} {m.author_name} · {timeAgo(m.created_at, language)}
              {m.pending && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-[10px] font-extrabold">{c.savedOnDevice}</span>}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <VerdictBadge verdict={m.verdict} language={language} small />
            {onClose && (
              <button type="button" onClick={onClose} aria-label={c.close} className="w-8 h-8 grid place-items-center rounded-full hover:bg-[var(--bg-subtle)]">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {m.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {m.features.slice(0, compact ? 4 : 12).map((f) => (
              <span key={f} className="px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[11px] font-bold">
                {featureLabel(c, f)}
              </span>
            ))}
          </div>
        )}
        {m.note && !compact && <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-snug">{m.note}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {!m.pending && (
            <>
              <button
                type="button"
                onClick={() => onVote('confirm')}
                aria-pressed={vote === 'confirm'}
                disabled={mine}
                className={`inline-flex items-center gap-1.5 px-3 h-10 rounded-xl border-2 text-xs font-bold transition-colors disabled:opacity-40 ${
                  vote === 'confirm' ? 'bg-[var(--status-good)] border-[var(--status-good)] text-white' : 'border-[var(--border-line)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                {c.confirm} <span className="font-mono-tabular">{m.confirms}</span>
              </button>
              <button
                type="button"
                onClick={() => onVote('dispute')}
                aria-pressed={vote === 'dispute'}
                disabled={mine}
                className={`inline-flex items-center gap-1.5 px-3 h-10 rounded-xl border-2 text-xs font-bold transition-colors disabled:opacity-40 ${
                  vote === 'dispute' ? 'bg-[var(--status-red)] border-[var(--status-red)] text-white' : 'border-[var(--border-line)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                {c.dispute} <span className="font-mono-tabular">{m.disputes}</span>
              </button>
            </>
          )}
          <span className="flex-1" />
          {trusted && <span className="text-[11px] font-extrabold text-[var(--status-good)]">✓ {c.trusted}</span>}
          {disputed && <span className="text-[11px] font-extrabold text-[var(--status-red)]">! {c.mixed}</span>}
        </div>
        {!auth.user && !m.pending && !compact && (
          <p className="text-[11px] font-semibold text-[var(--ink-secondary)]">{c.signInToVote}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {m.place_ext_id && (
            <button
              type="button"
              onClick={() => onRouteHere(m.place_ext_id!)}
              className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" />
              {c.routeHere}
            </button>
          )}
          {onShowOnMap && (
            <button type="button" onClick={onShowOnMap} className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl border-2 border-[var(--border-line)] text-xs font-bold">
              <MapIcon className="w-4 h-4" aria-hidden="true" />
              {c.mapView}
            </button>
          )}
          {mine && !m.pending && (
            <button
              type="button"
              onClick={() => (sure ? void api.removeMark(m.id) : setSure(true))}
              onBlur={() => setSure(false)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold text-[var(--status-red)] hover:bg-[var(--status-red-soft)]"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              {sure ? c.deleteSure : c.delete}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function PhotoLightbox({ photo, language, api, onClose }: { photo: RoadPhoto; language: LanguageCode; api: CommunityApi; onClose: () => void }) {
  const c = CM[language];
  const mine = !!api.userId && photo.user_id === api.userId;
  const [sure, setSure] = useState(false);
  return (
    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label={c.close} onClick={onClose} className="absolute inset-0 bg-black/85" />
      <motion.figure initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }} className="relative max-w-2xl w-full bg-[var(--bg-surface)] rounded-3xl overflow-hidden">
        <img src={photo.localUrl ?? photo.url} alt={photo.note ?? c.photoOf} className="w-full max-h-[62dvh] object-contain bg-black" />
        <figcaption className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm font-bold">
              {photo.author_name} · <span className="text-[var(--ink-secondary)]">{timeAgo(photo.created_at, language)}</span>
            </div>
            <div className="[&_span]:!text-[11px]">
              <PhotoStatusPill photo={photo} language={language} />
            </div>
          </div>
          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {photo.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[11px] font-bold">
                  {tagLabel(c, t)}
                </span>
              ))}
            </div>
          )}
          {photo.note && <p className="text-sm font-semibold text-[var(--ink-secondary)]">{photo.note}</p>}
          {mine && !photo.pending && (
            <button
              type="button"
              onClick={() => {
                if (!sure) return setSure(true);
                void api.removePhoto(photo);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold text-[var(--status-red)] hover:bg-[var(--status-red-soft)]"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              {sure ? c.deleteSure : c.delete}
            </button>
          )}
        </figcaption>
        <button type="button" onClick={onClose} aria-label={c.close} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white grid place-items-center">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </motion.figure>
    </motion.div>
  );
}
