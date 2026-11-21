import { Building2, RotateCcw, UserCheck, X } from 'lucide-react';
import { STRINGS } from '../lib/i18n';
import type { CitySlug, LanguageCode, TravelMode, UserProfile } from '../types/sugampath';
import { PWAInstallButton } from './PWAInstallButton';
import { EmergencyContactCard } from './safety/EmergencyContactCard';
import { SAFE } from '../lib/i18nSafety';

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onRedoOnboarding: () => void;
}

export function PreferencesModal({
  open,
  onClose,
  profile,
  onUpdateProfile,
  reduceMotion,
  onToggleReduceMotion,
  isOffline,
  onToggleOffline,
  onRedoOnboarding,
}: PreferencesModalProps) {
  if (!open) return null;

  const t = STRINGS[profile.language];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-md bg-[var(--bg-surface)] border-t sm:border border-[var(--border-line)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 id="preferences-title" className="text-xl font-bold text-[var(--ink-primary)]">
            {t.preferencesTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="w-11 h-11 rounded-full bg-[var(--bg-subtle)] text-[var(--ink-primary)] flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Prominent Replay Welcome Guide Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onRedoOnboarding();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-[var(--tactile-yellow-soft)] border border-[var(--ink-primary)] text-sm font-bold text-[var(--ink-primary)] flex items-center justify-center gap-2 min-h-[50px]"
        >
          <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t.redoSetupBtn}</span>
        </button>

        {/* Language */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-[var(--ink-secondary)]">{t.languageLabel}</div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'pa', label: 'ਪੰਜਾਬੀ' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => onUpdateProfile({ language: lang.code as LanguageCode })}
                className={`py-2.5 px-3 rounded-xl border text-sm font-bold min-h-[44px] ${
                  profile.language === lang.code
                    ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]'
                    : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Aid (when in Traveller role) */}
        {profile.role === 'traveller' && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-[var(--ink-secondary)]">{t.myAidLabel}</div>
            <div className="grid grid-cols-2 gap-2">
              {(['blind', 'wheelchair', 'walker', 'standard'] as TravelMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    onUpdateProfile({
                      mode: m,
                      voiceEnabled: m === 'blind' ? true : m === 'standard' ? false : profile.voiceEnabled,
                      visualOnly: m === 'standard' ? true : m === 'blind' ? false : profile.visualOnly,
                      bigText: m === 'walker' || m === 'blind' ? true : profile.bigText,
                    })
                  }
                  className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold min-h-[44px] ${
                    profile.mode === m
                      ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]'
                      : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
                  }`}
                >
                  {t.modes[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Display & Voice Toggles */}
        <div className="space-y-2 pt-2 border-t border-[var(--border-line)]">
          <div className="text-xs font-bold text-[var(--ink-secondary)]">{t.settings}</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateProfile({ bigText: !profile.bigText })}
              aria-pressed={profile.bigText}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] ${
                profile.bigText
                  ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              {t.onboardBigText}: {profile.bigText ? t.on : t.off}
            </button>

            <button
              type="button"
              onClick={() => onUpdateProfile({ xlText: !profile.xlText })}
              aria-pressed={!!profile.xlText}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] ${
                profile.xlText
                  ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              {t.onboardBigText} ++: {profile.xlText ? t.on : t.off}
            </button>
            <button
              type="button"
              onClick={() => onUpdateProfile({ highContrast: !profile.highContrast })}
              aria-pressed={profile.highContrast}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] ${
                profile.highContrast
                  ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              {t.highContrast}: {profile.highContrast ? t.on : t.off}
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateProfile({
                  voiceEnabled: !profile.voiceEnabled,
                  visualOnly: !profile.voiceEnabled ? false : profile.visualOnly,
                })
              }
              aria-pressed={profile.voiceEnabled}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] ${
                profile.voiceEnabled
                  ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              {t.voiceAloud}: {profile.voiceEnabled ? t.on : t.off}
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateProfile({
                  visualOnly: !profile.visualOnly,
                  voiceEnabled: !profile.visualOnly ? false : profile.voiceEnabled,
                })
              }
              aria-pressed={Boolean(profile.visualOnly)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] ${
                profile.visualOnly
                  ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              {t.visualOnlyLabel}: {profile.visualOnly ? t.on : t.off}
            </button>

            <button
              type="button"
              onClick={onToggleReduceMotion}
              aria-pressed={reduceMotion}
              className={`col-span-2 px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] ${
                reduceMotion
                  ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
              }`}
            >
              {t.reduceMotion}: {reduceMotion ? t.on : t.off}
            </button>
          </div>
        </div>

        {/* Safety: who gets alerted, and whether walks help map surfaces */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-line)]">
          <EmergencyContactCard
            language={profile.language}
            contact={profile.emergencyContact}
            onChange={(c) => onUpdateProfile({ emergencyContact: c })}
          />
          <button
            type="button"
            onClick={() => onUpdateProfile({ passiveMapping: profile.passiveMapping === false })}
            aria-pressed={profile.passiveMapping !== false}
            className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] text-left ${
              profile.passiveMapping !== false
                ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)] text-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
            }`}
          >
            {SAFE[profile.language].mappingLabel}: {profile.passiveMapping !== false ? t.on : t.off}
          </button>
        </div>
        {/* Role Switch, PWA Install, Offline Test */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-line)]">
          <button
            type="button"
            onClick={() => {
              onUpdateProfile({ role: profile.role === 'traveller' ? 'auditor' : 'traveller' });
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold flex items-center justify-center gap-2 min-h-[48px]"
          >
            {profile.role === 'traveller' ? (
              <>
                <Building2 className="w-4 h-4" aria-hidden="true" />
                <span>{t.switchRoleToAuditor}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" aria-hidden="true" />
                <span>{t.switchRoleToTraveller}</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <PWAInstallButton
              installLabel={t.installApp}
              iosButtonLabel={t.installIos}
              iosTitle={t.iosTitle}
              iosStep1={t.iosStep1}
              iosStep2={t.iosStep2}
              desktopTitle={t.desktopInstallTitle}
              desktopStep1={t.desktopInstallStep1}
              desktopStep2={t.desktopInstallStep2}
              closeLabel={t.close}
            />

            <button
              type="button"
              onClick={onToggleOffline}
              className="px-3 py-2 rounded-lg border border-[var(--border-line)] text-xs font-semibold text-[var(--ink-primary)] min-h-[40px]"
            >
              {t.simulateOffline}: {isOffline ? t.on : t.off}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
