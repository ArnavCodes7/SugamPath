import { useEffect, useState } from 'react';
import { BatteryMedium, MapPin, ShieldAlert, ShieldCheck, WifiOff } from 'lucide-react';
import { backend } from '../services/backend';
import { clockTime, SAFE } from '../lib/i18nSafety';
import type { TripState } from '../types/safety';

/**
 * /track/<token>  -  the family view. No login, no install, any browser.
 * Reads only. The token in the URL is the access key.
 */
export function TrackPage({ token }: { token: string }) {
  const [trip, setTrip] = useState<TripState | null>(null);
  const [missing, setMissing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    let got = false;
    const off = backend.subscribeTrip(token, (t) => {
      got = true;
      setTrip(t);
    });
    // If nothing arrives quickly, check once more before saying the link is invalid.
    const timer = window.setTimeout(async () => {
      if (!got && !(await backend.getTrip(token))) setMissing(true);
    }, 4000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const on = () => setOnline(true);
    const offl = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', offl);
    return () => {
      off();
      window.clearTimeout(timer);
      window.clearInterval(tick);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', offl);
    };
  }, [token]);

  const lang = trip?.language ?? 'en';
  const s = SAFE[lang];
  const sos = trip?.sos && !trip.sos.resolvedAt ? trip.sos : null;
  const status = sos ? 'sos' : trip?.status ?? 'walking';

  const tone =
    status === 'sos'
      ? 'bg-[#b3261e] text-white'
      : status === 'arrived'
        ? 'bg-[var(--status-good)] text-white'
        : status === 'ended'
          ? 'bg-[var(--bg-subtle)] text-[var(--ink-primary)]'
          : 'bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)]';

  const label =
    status === 'sos' ? s.statusSos : status === 'arrived' ? s.statusArrived : status === 'ended' ? s.statusEnded : s.statusWalking;

  const pos = trip?.position;
  const secondsAgo = trip ? Math.max(0, Math.round((now - trip.updatedAt) / 1000)) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--ink-primary)]">
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        <header className="flex items-center gap-2 text-lg font-bold">
          <span className="w-7 h-7 rounded-lg bg-[var(--tactile-yellow)] border border-[var(--ink-primary)] grid grid-cols-2 gap-0.5 p-1.5" aria-hidden="true">
            <span className="rounded-full bg-[var(--ink-primary)]" />
            <span className="rounded-full bg-[var(--ink-primary)]" />
            <span className="rounded-full bg-[var(--ink-primary)]" />
            <span className="rounded-full bg-[var(--ink-primary)]" />
          </span>
          SugamPath
        </header>

        {!online && (
          <p className="flex items-center gap-2 text-xs font-bold rounded-xl bg-[var(--ink-primary)] text-[var(--tactile-yellow)] px-3 py-2">
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            {s.trackOffline}
          </p>
        )}

        {missing && !trip && (
          <p className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-5 text-base font-semibold">{s.trackNotFound}</p>
        )}

        {!trip && !missing && (
          <p className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-5 text-base font-semibold animate-pulse">
            {s.trackWaiting}
          </p>
        )}

        {trip && (
          <>
            <section aria-live="assertive" className={`rounded-3xl p-6 space-y-3 ${tone}`}>
              <div className="flex items-center gap-2 text-sm font-bold opacity-90">
                {status === 'sos' ? <ShieldAlert className="w-5 h-5" aria-hidden="true" /> : <ShieldCheck className="w-5 h-5" aria-hidden="true" />}
                <span>{s.trackTitle(trip.travellerLabel || s.trackTraveller)}</span>
              </div>
              <div className="text-4xl font-bold">{label}</div>
              {sos && (
                <div className="space-y-1">
                  <p className="text-lg font-bold">{s.trackSosAt(clockTime(sos.at, lang))}</p>
                  <p className="text-base">{sos.kind === 'fall' ? s.trackFall : s.trackManual}</p>
                </div>
              )}
              {trip.sos?.resolvedAt && <p className="text-base font-bold">{s.trackSosResolved}</p>}
            </section>

            <section className="rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-5 space-y-3">
              <div className="text-xs font-bold text-[var(--ink-secondary)]">{trip.placeName}</div>
              <div className="text-lg font-bold">{trip.gateName}</div>
              <div
                className="h-3 rounded-full bg-[var(--bg-subtle)] overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={trip.totalSteps}
                aria-valuenow={status === 'arrived' ? trip.totalSteps : trip.stepIndex + 1}
              >
                <div
                  className="h-full bg-[var(--status-good)] transition-all"
                  style={{ width: `${((status === 'arrived' ? trip.totalSteps : trip.stepIndex + 1) / Math.max(1, trip.totalSteps)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-secondary)]">
                <span className="font-mono-tabular">{s.trackStep(Math.min(trip.stepIndex + 1, trip.totalSteps), trip.totalSteps)}</span>
                {trip.battery !== null && (
                  <span className="inline-flex items-center gap-1">
                    <BatteryMedium className="w-4 h-4" aria-hidden="true" />
                    {s.trackBattery(trip.battery)}
                  </span>
                )}
              </div>
              {status === 'walking' && <p className="text-base font-semibold">{trip.currentInstruction}</p>}
            </section>

            <section className="rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-5 space-y-2">
              {pos ? (
                <a
                  href={`https://www.google.com/maps?q=${pos.lat},${pos.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-base font-bold underline underline-offset-4 min-h-[48px]"
                >
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                  {s.trackOpenMap}
                </a>
              ) : (
                <p className="text-sm font-semibold text-[var(--ink-secondary)]">{s.trackNoLocation}</p>
              )}
              <p className="text-xs text-[var(--ink-secondary)]">{s.trackUpdated(secondsAgo)}</p>
            </section>

            {trip.cautions.length > 0 && (
              <section className="rounded-2xl bg-[var(--status-amber-soft)] border border-[var(--status-amber)]/30 p-4 space-y-1.5">
                <h2 className="text-xs font-bold text-[var(--status-amber)]">{s.trackCautions}</h2>
                <ul className="space-y-1 text-sm font-semibold">
                  {trip.cautions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
