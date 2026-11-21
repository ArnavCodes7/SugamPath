import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Download,
  Map as MapIcon,
  MapPin,
  MessageSquarePlus,
  X,
} from 'lucide-react';
import { PATH_SEGMENTS } from '../data/mockSugamData';
import { ISSUE_TRANSLATIONS, localizeGateName, localizePlaceName, STRINGS } from '../lib/i18n';
import type {
  AuditIssue,
  CitySlug,
  IssueStatus,
  LanguageCode,
  Place,
} from '../types/sugampath';
import { InteractiveMap } from './InteractiveMap';
import { TrustLabelText } from './ScoreBadge';
import { LegalReportPanel } from './safety/LegalReportPanel';

export type AuditorTab = 'fixlist' | 'demo';

interface AuditorConsoleProps {
  tab: AuditorTab;
  onTabChange: (tab: AuditorTab) => void;
  issues: AuditIssue[];
  places: Place[];
  defaultCity: CitySlug;
  language: LanguageCode;
  onUpdateStatus: (issueId: string, status: IssueStatus, note: string) => void;
  onDownloadCsv: () => void;
  onSwitchToTraveller: () => void;
}

export function AuditorConsole({
  tab,
  onTabChange,
  issues,
  places,
  defaultCity,
  language,
  onUpdateStatus,
  onDownloadCsv,
  onSwitchToTraveller,
}: AuditorConsoleProps) {
  const t = STRINGS[language];

  const [cityFilter, setCityFilter] = useState<CitySlug | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [mapCity, setMapCity] = useState<CitySlug>(defaultCity);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(issues[0]?.id || '');
  const [note, setNote] = useState('');
  const [brokenPhoto, setBrokenPhoto] = useState<Record<string, boolean>>({});
  const [demoStepDone, setDemoStepDone] = useState<Record<number, boolean>>({});

  const visibleIssues = useMemo(() => {
    return issues
      .filter((i) => {
        if (cityFilter !== 'all' && i.city !== cityFilter) return false;
        if (statusFilter !== 'all' && i.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const aClosed = a.status === 'fixed' || a.status === 'wont_fix' ? 1 : 0;
        const bClosed = b.status === 'fixed' || b.status === 'wont_fix' ? 1 : 0;
        if (aClosed !== bClosed) return aClosed - bClosed;
        return b.severity * 10000 + b.affected_daily_commuters - (a.severity * 10000 + a.affected_daily_commuters);
      });
  }, [issues, cityFilter, statusFilter]);

  const selectedIssue = issues.find((i) => i.id === selectedId) || visibleIssues[0] || null;
  const openCount = issues.filter((i) => i.status === 'open' || i.status === 'acknowledged').length;
  const fixedCount = issues.filter((i) => i.status === 'fixed').length;

  const getLocalizedIssueText = (iss: AuditIssue) => {
    const tr = ISSUE_TRANSLATIONS[iss.id];
    if (language === 'hi' && tr?.hi) return tr.hi;
    if (language === 'pa' && tr?.pa) return tr.pa;
    return { title: iss.title, desc: iss.description };
  };

  const handleSaveStatus = (nextStatus: IssueStatus) => {
    if (!selectedIssue) return;
    onUpdateStatus(selectedIssue.id, nextStatus, note.trim() || t.statuses[nextStatus]);
    setNote('');
  };

  const handleDemoAction = (stepIndex: number) => {
    setDemoStepDone((p) => ({ ...p, [stepIndex]: true }));
    if (stepIndex === 0) {
      setCityFilter('patiala');
      setStatusFilter('open');
      setSelectedId('ISS-1041');
      setMapCity('patiala');
      onTabChange('fixlist');
    } else if (stepIndex === 1) {
      setCityFilter('all');
      setStatusFilter('all');
      setSelectedId('ISS-1042');
      setMapCity('new-delhi');
      onTabChange('fixlist');
    } else if (stepIndex === 2) {
      onDownloadCsv();
    } else if (stepIndex === 3) {
      onSwitchToTraveller();
    }
  };

  const mapPlaces = places.filter((p) => p.city === mapCity);
  const mapSegments = PATH_SEGMENTS.filter((s) => s.city === mapCity);
  const mapIssues = issues.filter((i) => i.city === mapCity && i.status !== 'fixed');

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* DEMO GUIDE TAB */}
      {tab === 'demo' && (
        <section
          aria-label={t.demoTitle}
          className="bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[var(--ink-primary)]">{t.demoTitle}</h1>
              <p className="text-sm text-[var(--ink-secondary)] mt-1">{t.demoIntro}</p>
            </div>
            <button
              type="button"
              onClick={() => onTabChange('fixlist')}
              className="px-4 py-2.5 rounded-xl bg-[var(--tactile-yellow)] border border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)] text-sm font-bold min-h-[44px]"
            >
              {t.demoStartAction}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.demoSteps.map((step, idx) => {
              const done = demoStepDone[idx];
              return (
                <div
                  key={step.stepNum}
                  className="p-4 sm:p-5 rounded-2xl border border-[var(--border-line)] bg-[var(--bg-paper)] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] font-mono-tabular font-bold text-sm flex items-center justify-center">
                        {step.stepNum}
                      </span>
                      {done && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--status-good)]">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>{t.done}</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[var(--ink-primary)]">{step.title}</h2>
                    <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">{step.body}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDemoAction(idx)}
                    className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-sm font-bold text-[var(--ink-primary)] hover:bg-[var(--tactile-yellow-soft)] min-h-[44px]"
                  >
                    <span>{step.buttonLabel}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CALM FIX LIST WORKSPACE */}
      {tab === 'fixlist' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-2xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="text-xs text-[var(--ink-secondary)]">{t.auditorOpenCount}</div>
                <div className="text-xl font-bold font-mono-tabular text-[var(--status-red)]">{openCount}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--ink-secondary)]">{t.auditorFixedCount}</div>
                <div className="text-xl font-bold font-mono-tabular text-[var(--status-good)]">{fixedCount}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--ink-secondary)]">{t.auditorHubsCount}</div>
                <div className="text-xl font-bold font-mono-tabular text-[var(--ink-primary)]">{places.length}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[var(--border-line)] text-sm font-bold text-[var(--ink-primary)] min-h-[44px]"
              >
                <MapIcon className="w-4 h-4" aria-hidden="true" />
                <span>{t.showMapBtn}</span>
              </button>

              <button
                type="button"
                onClick={onDownloadCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold min-h-[44px]"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{t.downloadCsv}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Ranked Fix List */}
            <section
              aria-label={t.fixListHeading}
              className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-2xl overflow-hidden"
            >
              <div className="p-3.5 border-b border-[var(--border-line)] flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-base font-bold text-[var(--ink-primary)]">{t.fixListHeading}</h1>
                <div className="flex gap-1.5">
                  <select
                    aria-label={t.allCities}
                    value={cityFilter}
                    onChange={(e) => {
                      const v = e.target.value as CitySlug | 'all';
                      setCityFilter(v);
                      if (v !== 'all') setMapCity(v);
                    }}
                    className="rounded-lg border border-[var(--border-line)] bg-[var(--bg-paper)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)] min-h-[38px]"
                  >
                    <option value="all">{t.allCities}</option>
                    <option value="patiala">{t.cities.patiala}</option>
                    <option value="chandigarh">{t.cities.chandigarh}</option>
                    <option value="new-delhi">{t.cities['new-delhi']}</option>
                  </select>

                  <select
                    aria-label={t.filterAllStatus}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'all')}
                    className="rounded-lg border border-[var(--border-line)] bg-[var(--bg-paper)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)] min-h-[38px]"
                  >
                    <option value="all">{t.filterAllStatus}</option>
                    <option value="open">{t.statuses.open}</option>
                    <option value="acknowledged">{t.statuses.acknowledged}</option>
                    <option value="fixed">{t.statuses.fixed}</option>
                  </select>
                </div>
              </div>

              <ul className="divide-y divide-[var(--border-line)] max-h-[480px] overflow-y-auto">
                {visibleIssues.map((iss) => {
                  const active = selectedIssue?.id === iss.id;
                  const txt = getLocalizedIssueText(iss);
                  return (
                    <li key={iss.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(iss.id);
                          setMapCity(iss.city);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 ${
                          active ? 'bg-[var(--tactile-yellow-soft)]' : 'hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs text-[var(--ink-secondary)]">
                            <span className="font-mono-tabular font-bold text-[var(--ink-primary)]">{iss.id}</span> ·{' '}
                            {t.cities[iss.city]}
                          </div>
                          <div className="text-sm font-bold text-[var(--ink-primary)] line-clamp-2">{txt.title}</div>
                          <div className="text-xs text-[var(--ink-secondary)]">
                            {localizePlaceName(iss.place_name, language)}
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <div
                            className={`text-xs font-bold ${
                              iss.status === 'fixed'
                                ? 'text-[var(--status-good)]'
                                : iss.status === 'acknowledged'
                                  ? 'text-[var(--status-amber)]'
                                  : 'text-[var(--status-red)]'
                            }`}
                          >
                            {t.statuses[iss.status]}
                          </div>
                          <div className="text-xs font-mono-tabular text-[var(--ink-secondary)]">
                            {iss.severity}/5
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Selected Issue Detail & Status Update */}
            <section
              aria-label={t.proofPhotoHeading}
              className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-2xl p-5 space-y-4"
            >
              {!selectedIssue ? (
                <p className="text-sm text-[var(--ink-secondary)]">{t.pickIssueHint}</p>
              ) : (
                <>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-secondary)] mb-1">
                      <span className="font-mono-tabular font-bold text-[var(--ink-primary)]">
                        {selectedIssue.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{localizePlaceName(selectedIssue.place_name, language)}</span>
                      {selectedIssue.gate_name && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{localizeGateName(selectedIssue.gate_name, language)}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <TrustLabelText label={selectedIssue.label} language={language} showInfo />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--ink-primary)]">
                      {getLocalizedIssueText(selectedIssue).title}
                    </h2>
                    <p className="text-sm text-[var(--ink-secondary)] mt-1">
                      {getLocalizedIssueText(selectedIssue).desc}
                    </p>
                  </div>

                  {selectedIssue.proof_photo && !brokenPhoto[selectedIssue.id] ? (
                    <img
                      src={selectedIssue.proof_photo}
                      alt={selectedIssue.proof_alt || selectedIssue.title}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenPhoto((p) => ({ ...p, [selectedIssue.id]: true }))}
                      className="w-full h-44 object-cover rounded-xl border border-[var(--border-line)]"
                    />
                  ) : (
                    <div className="h-36 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center gap-2 text-xs text-[var(--ink-secondary)]">
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      <span>{t.proofPhotoHeading}</span>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2 border-t border-[var(--border-line)]">
                    <div className="grid grid-cols-3 gap-2">
                      {(['open', 'acknowledged', 'fixed'] as const).map((st) => {
                        const active = selectedIssue.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleSaveStatus(st)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] ${
                              active
                                ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]'
                                : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]'
                            }`}
                          >
                            {t.statuses[st]}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.addNotePlaceholder}
                        aria-label={t.addNotePlaceholder}
                        className="flex-1 rounded-xl border border-[var(--border-line)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--ink-primary)] min-h-[44px]"
                      />
                      <button
                        type="button"
                        disabled={!note.trim()}
                        onClick={() => handleSaveStatus(selectedIssue.status)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold disabled:opacity-40 min-h-[44px] shrink-0"
                      >
                        <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
                        <span>{t.saveUpdate}</span>
                      </button>
                    </div>
                  </div>

                  <LegalReportPanel
                    key={selectedIssue.id}
                    issue={selectedIssue}
                    place={places.find((p) => p.id === selectedIssue.place_id)}
                    language={language}
                  />

                  <ul className="space-y-1.5 text-xs pt-2 border-t border-[var(--border-line)]">
                    {selectedIssue.events.slice(0, 3).map((ev) => (
                      <li key={ev.id} className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[var(--ink-secondary)] shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <span className="font-bold text-[var(--ink-primary)]">{ev.actor}</span> ·{' '}
                          <span className="font-mono-tabular text-[var(--ink-secondary)]">
                            {ev.timestamp === 'Just now' ? t.justNow : ev.timestamp}
                          </span>
                          <span className="text-[var(--ink-secondary)]"> — {ev.note}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {/* OPTIONAL MAP MODAL */}
      {mapOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auditor-map-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-line)] flex flex-wrap items-center justify-between gap-3">
              <h2 id="auditor-map-title" className="text-base font-bold text-[var(--ink-primary)]">
                {t.mapHeading}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg">
                  {(['patiala', 'chandigarh', 'new-delhi'] as CitySlug[]).map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setMapCity(slug)}
                      className={`px-3 py-1 text-xs font-bold rounded-md min-h-[34px] ${
                        mapCity === slug
                          ? 'bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)]'
                          : 'text-[var(--ink-secondary)]'
                      }`}
                    >
                      {t.cities[slug]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMapOpen(false)}
                  aria-label={t.close}
                  className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="h-[360px]">
              <InteractiveMap
                city={mapCity}
                language={language}
                mode="wheelchair"
                mapMode="auditor"
                places={mapPlaces}
                selectedPlace={mapPlaces[0] || places[0]}
                segments={mapSegments}
                issues={mapIssues}
                selectedIssueId={selectedIssue?.id}
                onSelectIssue={(id) => {
                  setSelectedId(id);
                  setMapOpen(false);
                }}
                controlsBottomOffsetClass="bottom-3"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
