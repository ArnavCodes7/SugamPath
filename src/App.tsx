import { useEffect, useState } from 'react';
import {
  BookOpen,
  Camera,
  Home,
  ListChecks,
  Route,
  SlidersHorizontal,
  WifiOff,
} from 'lucide-react';
import { INITIAL_ISSUES, INITIAL_PLACES } from './data/mockSugamData';
import { ISSUE_TRANSLATIONS, localizePlaceName, STRINGS } from './lib/i18n';
import type { SamplePhotoKey } from './lib/mockPhotoAudit';
import type { ScoringResult } from './lib/scoring';
import type {
  AuditFindings,
  AuditIssue,
  IssueCategory,
  IssueStatus,
  Place,
  UserProfile,
} from './types/sugampath';
import { OnboardingFlow } from './components/OnboardingFlow';
import { PreferencesModal } from './components/PreferencesModal';
import { TravellerApp, type TravellerTab } from './components/TravellerApp';
import { AuditorConsole, type AuditorTab } from './components/AuditorConsole';

const STORAGE_KEY = 'sugampath_user_v1';

const DEFAULT_PROFILE: UserProfile = {
  onboarded: false,
  role: 'traveller',
  language: 'en',
  mode: 'wheelchair',
  city: 'patiala',
  bigText: false,
  voiceEnabled: true,
  highContrast: false,
  visualOnly: false,
};

function loadSavedProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(loadSavedProfile);
  const [travellerTab, setTravellerTab] = useState<TravellerTab>('home');
  const [auditorTab, setAuditorTab] = useState<AuditorTab>('fixlist');

  const [places, setPlaces] = useState<Place[]>(INITIAL_PLACES);
  const [issues, setIssues] = useState<AuditIssue[]>(INITIAL_ISSUES);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  const t = STRINGS[profile.language];

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = profile.language;
    root.classList.toggle('dark', profile.highContrast);
    root.classList.remove('text-scale-lg', 'text-scale-xl');
    if (profile.bigText) root.classList.add('text-scale-lg');
    root.classList.toggle('reduce-motion', reduceMotion);
  }, [profile.language, profile.highContrast, profile.bigText, reduceMotion]);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const updateProfile = (patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const handleVerifyGate = (placeId: string, gateId: string, vote: 'confirm' | 'dispute') => {
    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id !== placeId) return p;
        return {
          ...p,
          gates: p.gates.map((g) => {
            if (g.id !== gateId) return g;
            const confirmations = vote === 'confirm' ? g.confirmations + 1 : g.confirmations;
            const disputes = vote === 'dispute' ? g.disputes + 1 : g.disputes;
            const label = confirmations >= 3 && disputes < 2 ? 'verified' : g.label;
            return { ...g, confirmations, disputes, label };
          }),
        };
      })
    );
  };

  const handleFocusPlaceCity = (placeId: string) => {
    const found = places.find((p) => p.id === placeId);
    if (found && found.city !== profile.city) {
      updateProfile({ city: found.city });
    }
  };

  const handleAuditComplete = ({
    placeId,
    result,
    findings,
    photoUrl,
    sceneText,
    sampleKey,
  }: {
    placeId: string;
    result: ScoringResult;
    findings: AuditFindings;
    photoUrl: string;
    sceneText: string;
    sampleKey?: SamplePhotoKey;
  }) => {
    // Do NOT update Place scores or create city issues when confidence < 0.5 (not_verified)
    if (result.label !== 'ai_estimate') {
      return;
    }

    const auditedPlace = places.find((p) => p.id === placeId);
    if (!auditedPlace) return;

    setPlaces((prev) =>
      prev.map((p) =>
        p.id === placeId
          ? {
              ...p,
              score_wheelchair: result.score_wheelchair,
              score_blind: result.score_blind,
              score_walker: result.score_walker,
              confidence: result.final_confidence,
              label: 'ai_estimate',
              source: sampleKey ? 'Sample data' : 'AI estimate',
              last_audited_at: new Date().toISOString(),
            }
          : p
      )
    );

    if (result.triggered_issue_severities.length > 0) {
      const topTrigger = [...result.triggered_issue_severities].sort(
        (a, b) => b.severity - a.severity
      )[0];
      if (topTrigger && topTrigger.severity >= 3) {
        const localizedPlace = localizePlaceName(auditedPlace.name, profile.language);
        const category = (topTrigger.category as IssueCategory) || 'other';
        const newIssue: AuditIssue = {
          id: `ISS-${Math.floor(1050 + Math.random() * 800)}`,
          city: auditedPlace.city,
          city_name: t.cities[auditedPlace.city],
          place_id: auditedPlace.id,
          place_name: auditedPlace.name,
          target_type:
            findings.subject === 'bus_stop'
              ? 'bus_stop'
              : findings.subject === 'footpath' || findings.subject === 'crossing'
                ? 'path_segment'
                : 'gate',
          category,
          title: `${t.travellerPhotoReportTitle}: ${localizedPlace}`,
          description: sceneText,
          severity: topTrigger.severity as 1 | 2 | 3 | 4 | 5,
          status: 'open',
          affected_daily_commuters: 950,
          confirmations: 1,
          disputes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          map_pos: {
            x: auditedPlace.map_pos.x + 12,
            y: auditedPlace.map_pos.y - 10,
          },
          proof_photo: photoUrl,
          proof_alt: sceneText,
          provider: 'Gemini',
          model: 'gemini-2.5-flash',
          prompt_version: 'audit-v1',
          processing_ms: 1500,
          label: 'ai_estimate',
          source: sampleKey ? 'Sample data' : 'AI estimate',
          findings,
          events: [
            {
              id: `ev-${Date.now()}`,
              type: 'created',
              actor: t.travellerPhotoReportActor,
              timestamp: t.justNow,
              note: sceneText,
            },
          ],
        };
        setIssues((prev) => [newIssue, ...prev]);
      }
    }
  };

  const handleUpdateIssueStatus = (issueId: string, nextStatus: IssueStatus, note: string) => {
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id !== issueId) return iss;
        return {
          ...iss,
          status: nextStatus,
          updated_at: new Date().toISOString(),
          events: [
            {
              id: `ev-${Date.now()}`,
              type: 'status_change',
              actor: t.roleAuditor,
              timestamp: t.justNow,
              old_status: iss.status,
              new_status: nextStatus,
              note,
            },
            ...iss.events,
          ],
        };
      })
    );
  };

  const handleDownloadCsv = () => {
    const headers = t.csvHeaders;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = issues.map((iss) => {
      const tr = profile.language === 'en' ? null : ISSUE_TRANSLATIONS[iss.id]?.[profile.language];
      return [
        iss.id,
        t.cities[iss.city],
        localizePlaceName(iss.place_name, profile.language),
        tr?.title || iss.title,
        iss.severity,
        t.statuses[iss.status],
        iss.affected_daily_commuters,
      ]
        .map(esc)
        .join(',');
    });
    const csv = [headers.map(esc).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sugampath-fix-list.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!profile.onboarded) {
    return (
      <OnboardingFlow
        initialProfile={profile}
        onComplete={(completed) => {
          setProfile(completed);
          setTravellerTab('home');
          setAuditorTab('fixlist');
        }}
      />
    );
  }

  const travellerTabs = [
    { id: 'home', label: t.tabHome, icon: Home },
    { id: 'route', label: t.tabBestRoute, icon: Route },
    { id: 'photo', label: t.tabCheckPhoto, icon: Camera },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--ink-primary)] flex flex-col">
      {isOffline && (
        <div
          role="status"
          className="px-4 py-2 bg-[var(--ink-primary)] text-[var(--tactile-yellow)] text-xs font-bold flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t.offlineBanner}</span>
        </div>
      )}

      {/* Calm 3-Zone App Bar */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-line)] md:sticky md:top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
          <a
            href="#main-content"
            className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--ink-primary)] whitespace-nowrap shrink-0"
          >
            <span
              className="w-7 h-7 rounded-lg bg-[var(--tactile-yellow)] border border-[var(--ink-primary)] grid grid-cols-2 gap-0.5 p-1.5 shrink-0"
              aria-hidden="true"
            >
              <span className="rounded-full bg-[var(--ink-primary)]" />
              <span className="rounded-full bg-[var(--ink-primary)]" />
              <span className="rounded-full bg-[var(--ink-primary)]" />
              <span className="rounded-full bg-[var(--ink-primary)]" />
            </span>
            <span>{t.brand}</span>
          </a>

          <nav
            aria-label={t.travellerToolsAria}
            className="hidden md:flex items-center gap-6 text-sm font-semibold"
          >
            {profile.role === 'traveller' ? (
              travellerTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTravellerTab(item.id)}
                  aria-current={travellerTab === item.id ? 'page' : undefined}
                  className={`py-1.5 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    travellerTab === item.id
                      ? 'text-[var(--ink-primary)] border-[var(--tactile-yellow)] font-bold'
                      : 'text-[var(--ink-secondary)] border-transparent hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <>
                {(
                  [
                    { id: 'fixlist', label: t.auditorTabFixList },
                    { id: 'demo', label: t.auditorTabDemoGuide },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAuditorTab(item.id)}
                    aria-current={auditorTab === item.id ? 'page' : undefined}
                    className={`py-1.5 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                      auditorTab === item.id
                        ? 'text-[var(--ink-primary)] border-[var(--tactile-yellow)] font-bold'
                        : 'text-[var(--ink-secondary)] border-transparent hover:text-[var(--ink-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setPrefsOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-line)] text-xs sm:text-sm font-bold text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] min-h-[40px] whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.preferencesTitle}</span>
          </button>
        </div>
      </header>

      {/* Main Content with Generous Negative Space */}
      <main id="main-content" className="flex-1 w-full pb-20 md:pb-10">
        {profile.role === 'traveller' ? (
          <TravellerApp
            tab={travellerTab}
            onTabChange={setTravellerTab}
            places={places}
            city={profile.city}
            mode={profile.mode}
            language={profile.language}
            voiceEnabled={profile.voiceEnabled}
            visualOnly={profile.visualOnly}
            isOffline={isOffline}
            onToggleOffline={() => setIsOffline((v) => !v)}
            onOpenPreferences={() => setPrefsOpen(true)}
            emergencyContact={profile.emergencyContact ?? null}
            passiveMapping={profile.passiveMapping !== false}
            onSaveContact={(c) => updateProfile({ emergencyContact: c })}
            onVerifyGate={handleVerifyGate}
            onFocusPlaceCity={handleFocusPlaceCity}
            onAuditComplete={handleAuditComplete}
          />
        ) : (
          <AuditorConsole
            tab={auditorTab}
            onTabChange={setAuditorTab}
            issues={issues}
            places={places}
            defaultCity={profile.city}
            language={profile.language}
            onUpdateStatus={handleUpdateIssueStatus}
            onDownloadCsv={handleDownloadCsv}
            onSwitchToTraveller={() => updateProfile({ role: 'traveller' })}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label={t.travellerToolsAria}
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[var(--bg-surface)] border-t border-[var(--border-line)]"
      >
        {profile.role === 'traveller' ? (
          <div className="grid h-full grid-cols-3">
            {travellerTabs.map((item) => {
              const Icon = item.icon;
              const active = travellerTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTravellerTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                    active
                      ? 'text-[var(--ink-primary)] bg-[var(--tactile-yellow-soft)]'
                      : 'text-[var(--ink-secondary)]'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="truncate max-w-full px-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 h-full">
            {(
              [
                { id: 'fixlist', label: t.auditorTabFixList, icon: ListChecks },
                { id: 'demo', label: t.auditorTabDemoGuide, icon: BookOpen },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = auditorTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAuditorTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                    active
                      ? 'text-[var(--ink-primary)] bg-[var(--tactile-yellow-soft)]'
                      : 'text-[var(--ink-secondary)]'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="truncate max-w-full px-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Settings & Replay Welcome Guide Modal */}
      <PreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
        reduceMotion={reduceMotion}
        onToggleReduceMotion={() => setReduceMotion((v) => !v)}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline((v) => !v)}
        onRedoOnboarding={() => updateProfile({ onboarded: false })}
      />
    </div>
  );
}
