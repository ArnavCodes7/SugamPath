import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, CloudOff, Compass, Database, MapPinned, RefreshCw, Sparkles, Users } from 'lucide-react';
import { useCampusData } from '../../hooks/useCampusData';
import { useCommunity } from '../../hooks/useCommunity';
import { useAuth } from '../../lib/auth';
import { CM } from '../../lib/i18nCommunity';
import type { LanguageCode } from '../../types/sugampath';
import { ExploreView } from './ExploreView';
import { MarkPlaceSheet } from './MarkPlaceSheet';
import { PhotoUploadSheet } from './PhotoUploadSheet';

type Segment = 'explore' | 'contribute' | 'ai';

interface Props {
  language: LanguageCode;
  isOffline: boolean;
  onRouteHere: (placeExtId: string) => void;
  /** The existing AI photo audit wizard, shown in the "AI check" segment. */
  aiCheck: ReactNode;
}

const LEVEL_STEPS = [0, 1, 4, 10, 25];

/**
 * The Community tab (formerly "Check Photo"): explore what people marked, contribute places and
 * road photos, and keep the AI photo check one tap away.
 */
export function CommunitySection({ language, onRouteHere, aiCheck }: Props) {
  const c = CM[language];
  const auth = useAuth();
  const api = useCommunity();
  const campus = useCampusData();
  const [segment, setSegment] = useState<Segment>('explore');
  const [sheet, setSheet] = useState<'mark' | 'photo' | null>(null);

  const places = campus.places ?? [];
  const contributions = api.mine.marks + api.mine.photos;
  const level = useMemo(() => LEVEL_STEPS.reduce((l, n, i) => (contributions >= n ? i : l), 0), [contributions]);
  const nextAt = LEVEL_STEPS[level + 1];

  const requireAuth = (which: 'mark' | 'photo') => {
    if (!auth.user) return auth.openSignIn();
    setSheet(which);
  };

  const segments: { id: Segment; label: string; Icon: typeof Users }[] = [
    { id: 'explore', label: c.segExplore, Icon: Compass },
    { id: 'contribute', label: c.segContribute, Icon: Sparkles },
    { id: 'ai', label: c.segAiCheck, Icon: Camera },
  ];

  const stats: [number, string][] = [
    [api.marks.length, c.statPlaces],
    [api.photos.length, c.statPhotos],
    [api.contributors, c.statPeople],
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-[var(--ink-primary)] text-[var(--bg-surface)] p-5 sm:p-7">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-48 h-48 rounded-full border-[22px] border-[var(--tactile-yellow)]/20" />
        <div aria-hidden="true" className="absolute right-16 bottom-3 w-16 h-16 rounded-full border-[8px] border-[var(--tactile-yellow)]/15" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] grid place-items-center shrink-0">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{c.communityTitle}</h1>
            <p className="text-sm font-semibold opacity-75 mt-1 max-w-md">{c.communityTag}</p>
          </div>
        </div>
        <dl className="relative grid grid-cols-3 gap-2 mt-5">
          {stats.map(([n, label]) => (
            <div key={label} className="rounded-2xl bg-white/10 px-3 py-2.5">
              <dd className="text-2xl font-extrabold font-mono-tabular text-[var(--tactile-yellow)]">{n}</dd>
              <dt className="text-[11px] font-bold opacity-75 leading-tight">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Segment control */}
      <div className="flex p-1 rounded-2xl bg-[var(--bg-subtle)] sticky top-0 md:top-14 z-20" role="tablist" aria-label={c.communityTitle}>
        {segments.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={segment === id}
            onClick={() => setSegment(id)}
            className={`relative flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold transition-colors ${
              segment === id ? 'text-[var(--ink-primary)]' : 'text-[var(--ink-secondary)]'
            }`}
          >
            {segment === id && (
              <motion.span layoutId="segment-pill" className="absolute inset-0 rounded-xl bg-[var(--bg-surface)] shadow border border-[var(--border-line)]" transition={{ type: 'spring', damping: 28, stiffness: 380 }} />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Banners */}
      {api.status === 'missing' && (
        <div role="status" className="flex gap-3 rounded-2xl border-2 border-[var(--status-amber)] bg-[var(--status-amber-soft)] p-4">
          <Database className="w-5 h-5 shrink-0 text-[var(--status-amber)] mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-extrabold text-sm">{c.setupTitle}</div>
            <p className="text-xs font-semibold mt-0.5">{c.setupBody}</p>
          </div>
        </div>
      )}
      {api.status === 'error' && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border-2 border-[var(--status-red)] bg-[var(--status-red-soft)] p-4">
          <span className="flex-1 text-sm font-bold">{c.loadError}</span>
          <button type="button" onClick={() => void api.refresh()} className="h-10 px-4 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold">
            {c.retry}
          </button>
        </div>
      )}
      {api.queuedCount > 0 && (
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-[var(--tactile-yellow-soft)] border-2 border-[var(--tactile-yellow)] p-3.5">
          <CloudOff className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-xs font-bold">{c.offlineSaved(api.queuedCount)}</span>
          {auth.user && api.online && (
            <button type="button" onClick={() => void api.flush()} className="h-9 px-3 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              {c.syncNow}
            </button>
          )}
          {!auth.user && (
            <button type="button" onClick={auth.openSignIn} className="h-9 px-3 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold">
              {c.signIn}
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={segment} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          {segment === 'explore' && (
            <ExploreView language={language} api={api} onRouteHere={onRouteHere} onContribute={() => setSegment('contribute')} />
          )}

          {segment === 'contribute' && (
            <div className="space-y-4">
              {/* Impact */}
              <div className="rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-line)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wide">{c.yourImpact}</div>
                    <div className="text-xl font-extrabold">{auth.user ? c.level[level] : c.signIn}</div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <div className="text-2xl font-extrabold font-mono-tabular">{api.mine.marks}</div>
                      <div className="text-[10px] font-bold text-[var(--ink-secondary)]">{c.statPlaces}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold font-mono-tabular">{api.mine.photos}</div>
                      <div className="text-[10px] font-bold text-[var(--ink-secondary)]">{c.statPhotos}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={nextAt ? Math.round((contributions / nextAt) * 100) : 100}>
                  <motion.div
                    className="h-full rounded-full bg-[var(--tactile-yellow)] border-r-2 border-[var(--ink-primary)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${nextAt ? Math.min(100, (contributions / nextAt) * 100) : 100}%` }}
                    transition={{ type: 'spring', damping: 24, stiffness: 120 }}
                  />
                </div>
                <p className="text-xs font-semibold text-[var(--ink-secondary)] mt-2">
                  {nextAt ? c.nextLevel(nextAt - contributions, c.level[level + 1]) : c.maxLevel}
                </p>
              </div>

              {!auth.user && auth.available && (
                <button
                  type="button"
                  onClick={auth.openSignIn}
                  className="w-full text-left rounded-3xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] border-2 border-[var(--ink-primary)] p-5 flex items-center gap-4 active:scale-[0.995] transition-transform"
                >
                  <span className="w-12 h-12 rounded-2xl bg-[var(--ink-primary)] text-[var(--tactile-yellow)] grid place-items-center shrink-0">
                    <Sparkles className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-extrabold text-base">{c.needSignInTitle}</span>
                    <span className="block text-sm font-semibold opacity-80">{c.needSignInBody}</span>
                  </span>
                </button>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <ActionCard
                  tone="green"
                  Icon={MapPinned}
                  title={c.markCardTitle}
                  body={c.markCardBody}
                  onClick={() => requireAuth('mark')}
                />
                <ActionCard
                  tone="ink"
                  Icon={Camera}
                  title={c.photoCardTitle}
                  body={c.photoCardBody}
                  onClick={() => requireAuth('photo')}
                />
              </div>
            </div>
          )}

          {segment === 'ai' && aiCheck}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {sheet === 'mark' && (
          <MarkPlaceSheet
            key="mark"
            language={language}
            places={places}
            onClose={() => setSheet(null)}
            onSubmit={api.addMark}
            onDone={() => {
              setSheet(null);
              setSegment('explore');
            }}
          />
        )}
        {sheet === 'photo' && (
          <PhotoUploadSheet
            key="photo"
            language={language}
            places={places}
            onClose={() => setSheet(null)}
            onSubmit={api.addPhoto}
            onDone={() => {
              setSheet(null);
              setSegment('explore');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({
  tone,
  Icon,
  title,
  body,
  onClick,
}: {
  tone: 'green' | 'ink';
  Icon: typeof Camera;
  title: string;
  body: string;
  onClick: () => void;
}) {
  const green = tone === 'green';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={`relative overflow-hidden text-left rounded-3xl p-5 min-h-[170px] flex flex-col justify-between border-2 ${
        green ? 'bg-[var(--status-good-soft)] border-[var(--status-good)]' : 'bg-[var(--bg-surface)] border-[var(--ink-primary)]'
      }`}
    >
      <span aria-hidden="true" className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full border-[14px] ${green ? 'border-[var(--status-good)]/15' : 'border-[var(--tactile-yellow)]/40'}`} />
      <span className={`relative w-12 h-12 rounded-2xl grid place-items-center ${green ? 'bg-[var(--status-good)] text-white' : 'bg-[var(--ink-primary)] text-[var(--tactile-yellow)]'}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </span>
      <span className="relative block mt-4">
        <span className="block text-lg font-extrabold leading-tight">{title}</span>
        <span className="block text-sm font-semibold text-[var(--ink-secondary)] mt-1">{body}</span>
      </span>
    </motion.button>
  );
}
