import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, CheckCircle2, CloudOff, ImagePlus, Loader2, MapPin, MapPinOff, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react';
import type { PlaceRow } from '../../lib/accessibility-types';
import { PHOTO_TAGS, compressImage, distM, type NewPhoto } from '../../lib/community';
import { CM, tagLabel } from '../../lib/i18nCommunity';
import type { SaveResult } from '../../hooks/useCommunity';
import type { LanguageCode } from '../../types/sugampath';
import { Sheet, TAG_ICON } from './ui';

interface Props {
  language: LanguageCode;
  places: PlaceRow[];
  onClose: () => void;
  onSubmit: (p: NewPhoto) => Promise<SaveResult>;
  onDone: () => void;
}

interface Fix {
  lat: number;
  lon: number;
  accuracy: number;
}

export function PhotoUploadSheet({ language, places, onClose, onSubmit, onDone }: Props) {
  const c = CM[language];
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [fix, setFix] = useState<Fix | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [busy, setBusy] = useState<'compress' | 'upload' | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocBusy(false);
        setFix({ lat: coords.latitude, lon: coords.longitude, accuracy: Math.round(coords.accuracy) });
      },
      () => setLocBusy(false),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 }
    );
  }, []);

  // Roads are photographed where the user is standing, so attach the location right away.
  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    setError(null);
    setFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setError(null);
    setBusy('compress');
    let img: { blob: Blob; width: number; height: number };
    try {
      img = await compressImage(file);
    } catch {
      setBusy(null);
      return setError(c.tooBig);
    }
    setBusy('upload');
    // Link to a campus place when the photo was taken right next to one (<= 80 m).
    let near: string | null = null;
    if (fix) {
      let best = 80;
      for (const p of places) {
        const d = distM(fix.lat, fix.lon, p.lat, p.lon);
        if (d < best) {
          best = d;
          near = p.external_id;
        }
      }
    }
    const r = await onSubmit({
      blob: img.blob,
      width: img.width,
      height: img.height,
      lat: fix?.lat ?? null,
      lon: fix?.lon ?? null,
      accuracy_m: fix?.accuracy ?? null,
      place_ext_id: near,
      tags,
      note: note.trim() || null,
    });
    setBusy(null);
    if (r === 'saved' || r === 'queued') setResult(r);
    else setError(c.saveFailed);
  };

  if (result) {
    return (
      <Sheet title={c.photoTitle} onClose={onDone} closeLabel={c.close}>
        <div className="py-8 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="mx-auto w-24 h-24 rounded-full grid place-items-center bg-[var(--status-good-soft)]"
          >
            {result === 'saved' ? (
              <CheckCircle2 className="w-14 h-14 text-[var(--status-good)]" aria-hidden="true" />
            ) : (
              <CloudOff className="w-12 h-12 text-[var(--status-amber)]" aria-hidden="true" />
            )}
          </motion.div>
          {preview && <img src={preview} alt="" className="mx-auto h-28 w-28 object-cover rounded-2xl border-2 border-[var(--ink-primary)] -rotate-3" />}
          <h3 className="text-2xl font-extrabold">{c.thanks}</h3>
          <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-xs mx-auto">{result === 'saved' ? c.photoDone : c.photoQueued}</p>
          <button type="button" onClick={onDone} className="h-12 px-6 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold">
            {c.doneView}
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      title={c.photoTitle}
      onClose={onClose}
      closeLabel={c.close}
      footer={
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!file || !!busy}
          className="w-full h-14 rounded-2xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] border-2 border-[var(--ink-primary)] text-base font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <UploadCloud className="w-5 h-5" aria-hidden="true" />}
          {busy === 'compress' ? c.compressing : busy === 'upload' ? c.uploading : c.submitPhoto}
        </button>
      }
    >
      <div className="space-y-5">
        {/* Capture */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        <input ref={galleryRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />

        {preview ? (
          <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--ink-primary)] bg-black">
            <img src={preview} alt="" className="w-full max-h-[46dvh] object-contain" />
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="absolute bottom-3 right-3 h-10 px-3.5 rounded-xl bg-white text-gray-900 shadow-lg text-xs font-bold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              {c.retake}
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="relative overflow-hidden h-40 rounded-3xl bg-[var(--ink-primary)] text-[var(--bg-surface)] flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <span aria-hidden="true" className="absolute inset-3 rounded-2xl border-2 border-dashed border-white/25" />
              <span className="w-16 h-16 rounded-full bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] grid place-items-center">
                <Camera className="w-8 h-8" aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold">{c.takePhoto}</span>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="h-14 rounded-2xl border-2 border-[var(--border-line)] bg-[var(--bg-surface)] font-bold inline-flex items-center justify-center gap-2"
            >
              <ImagePlus className="w-5 h-5" aria-hidden="true" />
              {c.chooseGallery}
            </button>
            <p className="text-xs font-semibold text-[var(--ink-secondary)] text-center">{c.photoHint}</p>
          </div>
        )}

        {/* Tags */}
        <div>
          <h3 className="text-sm font-extrabold mb-2">{c.tagsTitle}</h3>
          <div className="flex flex-wrap gap-2">
            {PHOTO_TAGS.map((t) => {
              const Icon = TAG_ICON[t];
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags((l) => (on ? l.filter((x) => x !== t) : [...l, t]))}
                  className={`inline-flex items-center gap-1.5 px-3.5 h-11 rounded-full border-2 text-sm font-bold transition-colors ${
                    on ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]' : 'bg-[var(--bg-surface)] border-[var(--border-line)]'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tagLabel(c, t)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div
          className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 ${
            fix ? 'bg-[var(--status-good-soft)] border-[var(--status-good)]/50' : 'bg-[var(--bg-surface)] border-[var(--border-line)]'
          }`}
        >
          {locBusy ? (
            <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
          ) : fix ? (
            <MapPin className="w-5 h-5 text-[var(--status-good)] shrink-0" aria-hidden="true" />
          ) : (
            <MapPinOff className="w-5 h-5 text-[var(--ink-secondary)] shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1 text-sm font-bold min-w-0">
            {locBusy ? c.locating : fix ? c.gpsAttached(fix.accuracy) : c.gpsMissing}
          </span>
          {fix ? (
            <button type="button" onClick={() => setFix(null)} className="text-xs font-bold underline underline-offset-4 min-h-[40px]">
              {c.gpsRemove}
            </button>
          ) : (
            <button type="button" onClick={locate} disabled={locBusy} className="text-xs font-bold underline underline-offset-4 min-h-[40px]">
              {c.gpsAttach}
            </button>
          )}
        </div>

        <textarea
          value={note}
          maxLength={500}
          rows={3}
          onChange={(e) => setNote(e.target.value)}
          placeholder={c.notePh}
          aria-label={c.stepNote}
          className="w-full p-4 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-line)] text-sm font-semibold focus:border-[var(--ink-primary)] outline-none resize-none"
        />

        {error && (
          <p role="alert" className="text-sm font-bold text-[var(--status-red)]">
            {error}
          </p>
        )}
        <p className="text-[11px] font-semibold text-[var(--ink-secondary)] flex gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[var(--status-good)]" aria-hidden="true" />
          {c.privacyNote}
        </p>
      </div>
    </Sheet>
  );
}
