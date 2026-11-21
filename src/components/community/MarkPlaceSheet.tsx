import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, CloudOff, Loader2, Send } from 'lucide-react';
import type { PlaceRow } from '../../lib/accessibility-types';
import { FEATURES, type CommunityMode, type NewMark, type Verdict } from '../../lib/community';
import { CM, featureLabel } from '../../lib/i18nCommunity';
import type { SaveResult } from '../../hooks/useCommunity';
import type { LanguageCode } from '../../types/sugampath';
import { LocationPicker, type PickedLocation } from './LocationPicker';
import { FEATURE_ICON, MODE_ICON, Sheet, StepDots, VERDICT_META, VerdictBadge } from './ui';

interface Props {
  language: LanguageCode;
  places: PlaceRow[];
  initialPlaceId?: string | null;
  onClose: () => void;
  onSubmit: (m: NewMark) => Promise<SaveResult>;
  onDone: () => void;
}

const STEPS = 4;
const VERDICTS: Verdict[] = ['friendly', 'partial', 'not_friendly'];
const MODES: CommunityMode[] = ['wheelchair', 'blind', 'walker'];

export function MarkPlaceSheet({ language, places, initialPlaceId, onClose, onSubmit, onDone }: Props) {
  const c = CM[language];
  const initial = initialPlaceId ? places.find((p) => p.external_id === initialPlaceId) : undefined;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [loc, setLoc] = useState<PickedLocation | null>(
    initial ? { lat: initial.lat, lon: initial.lon, placeExtId: initial.external_id, placeName: initial.name } : null
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [verdict, setVerdict] = useState<Verdict>('friendly');
  const [modes, setModes] = useState<CommunityMode[]>(['wheelchair']);
  const [features, setFeatures] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = <T extends string>(list: T[], v: T, set: (l: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const nameOk = name.trim().length >= 2;
  const canNext = step === 0 ? !!loc && nameOk : true;

  const go = (d: number) => {
    setDir(d);
    setStep((s) => Math.min(STEPS - 1, Math.max(0, s + d)));
  };

  const submit = async () => {
    if (!loc) return;
    setBusy(true);
    setError(null);
    const r = await onSubmit({
      name: name.trim(),
      lat: loc.lat,
      lon: loc.lon,
      place_ext_id: loc.placeExtId,
      verdict,
      features: verdict === 'not_friendly' ? [] : features,
      modes,
      note: note.trim() || null,
    });
    setBusy(false);
    if (r === 'saved' || r === 'queued') setResult(r);
    else setError(c.saveFailed);
  };

  // ---------------- success
  if (result) {
    return (
      <Sheet title={c.markTitle} onClose={onDone} closeLabel={c.close}>
        <div className="py-8 text-center space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="mx-auto w-24 h-24 rounded-full grid place-items-center"
            style={{ background: result === 'saved' ? VERDICT_META.friendly.soft : 'var(--status-amber-soft)' }}
          >
            {result === 'saved' ? (
              <CheckCircle2 className="w-14 h-14 text-[var(--status-good)]" aria-hidden="true" />
            ) : (
              <CloudOff className="w-12 h-12 text-[var(--status-amber)]" aria-hidden="true" />
            )}
          </motion.div>
          <h3 className="text-2xl font-extrabold">{c.thanks}</h3>
          <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-xs mx-auto">{result === 'saved' ? c.markDone : c.markQueued}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button type="button" onClick={onDone} className="h-12 px-6 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold">
              {c.doneView}
            </button>
          </div>
        </div>
      </Sheet>
    );
  }

  const sectionTitle = [c.stepWhere, c.stepVerdict, c.stepFeatures, c.stepNote][step];

  return (
    <Sheet
      title={c.markTitle}
      onClose={onClose}
      closeLabel={c.close}
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={step === 0 || busy}
            className="h-12 px-4 rounded-xl border-2 border-[var(--border-line)] font-bold inline-flex items-center gap-1.5 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{c.back}</span>
          </button>
          <div className="flex-1 flex justify-center">
            <StepDots total={STEPS} index={step} />
          </div>
          {step < STEPS - 1 ? (
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canNext}
              className="h-12 px-5 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold inline-flex items-center gap-1.5 disabled:opacity-30"
            >
              {c.next}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="h-12 px-5 rounded-xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] border-2 border-[var(--ink-primary)] font-extrabold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
              {busy ? c.saving : c.submitMark}
            </button>
          )}
        </div>
      }
    >
      <h3 className="text-xl font-extrabold mb-4">{sectionTitle}</h3>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          initial={{ opacity: 0, x: dir * 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -28 }}
          transition={{ duration: 0.18 }}
          className="space-y-5"
        >
          {step === 0 && (
            <>
              <LocationPicker
                language={language}
                places={places}
                value={loc}
                onChange={(v) => {
                  setLoc(v);
                  if (v?.placeName) setName(v.placeName);
                }}
              />
              <div>
                <label htmlFor="mark-name" className="text-xs font-bold text-[var(--ink-secondary)]">
                  {c.placeName}
                </label>
                <input
                  id="mark-name"
                  value={name}
                  maxLength={120}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={c.placeNamePh}
                  className="mt-1 w-full h-14 px-4 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-line)] text-base font-bold focus:border-[var(--ink-primary)] outline-none"
                />
                {name.length > 0 && !nameOk && <p className="mt-1 text-xs font-bold text-[var(--status-red)]">{c.nameNeeded}</p>}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-2.5" role="radiogroup" aria-label={c.stepVerdict}>
                {VERDICTS.map((v) => {
                  const m = VERDICT_META[v];
                  const on = verdict === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setVerdict(v)}
                      className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99]"
                      style={{
                        borderColor: on ? m.color : 'var(--border-line)',
                        background: on ? m.soft : 'var(--bg-surface)',
                        boxShadow: on ? `0 0 0 3px ${m.color}33` : undefined,
                      }}
                    >
                      <span className="w-12 h-12 rounded-full grid place-items-center shrink-0" style={{ background: on ? m.color : m.soft, color: on ? '#fff' : m.color }}>
                        <m.Icon className="w-6 h-6" aria-hidden="true" />
                      </span>
                      <span className="text-base font-extrabold">{c[m.key]}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <h4 className="text-sm font-extrabold mb-2">{c.stepWho}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map((m) => {
                    const Icon = MODE_ICON[m];
                    const on = modes.includes(m);
                    const label = m === 'wheelchair' ? c.modeWheelchair : m === 'blind' ? c.modeBlind : c.modeWalker;
                    return (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(modes, m, setModes)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 text-[11px] font-bold text-center min-h-[84px] transition-colors ${
                          on ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]' : 'bg-[var(--bg-surface)] border-[var(--border-line)]'
                        }`}
                      >
                        <Icon className="w-6 h-6" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {verdict === 'not_friendly' ? (
                <p className="p-4 rounded-2xl bg-[var(--status-red-soft)] text-sm font-bold">
                  {c.vNot}. {c.stepNote}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {FEATURES.map((f) => {
                    const Icon = FEATURE_ICON[f];
                    const on = features.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(features, f, setFeatures)}
                        className={`relative flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left text-[13px] font-bold min-h-[60px] transition-colors ${
                          on ? 'bg-[var(--status-good-soft)] border-[var(--status-good)]' : 'bg-[var(--bg-surface)] border-[var(--border-line)]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${on ? 'text-[var(--status-good)]' : 'text-[var(--ink-secondary)]'}`} aria-hidden="true" />
                        <span className="leading-tight">{featureLabel(c, f)}</span>
                        {on && <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-[var(--status-good)]" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <textarea
                  value={note}
                  maxLength={500}
                  rows={4}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={c.notePh}
                  aria-label={c.stepNote}
                  className="w-full p-4 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-line)] text-sm font-semibold focus:border-[var(--ink-primary)] outline-none resize-none"
                />
                <div className="text-right text-[11px] font-mono-tabular text-[var(--ink-secondary)]">{c.noteCount(note.length)}</div>
              </div>

              {/* Live preview of the card the community will see */}
              <div className="rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--ink-primary)] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-extrabold text-base leading-snug">{name || '—'}</div>
                  <VerdictBadge verdict={verdict} language={language} small />
                </div>
                {features.length > 0 && verdict !== 'not_friendly' && (
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[11px] font-bold">
                        {featureLabel(c, f)}
                      </span>
                    ))}
                  </div>
                )}
                {note && <p className="text-sm font-semibold text-[var(--ink-secondary)]">{note}</p>}
              </div>
              {error && (
                <p role="alert" className="text-sm font-bold text-[var(--status-red)]">
                  {error}
                </p>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}
