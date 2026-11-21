import { useEffect, useState } from 'react';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  Footprints,
  Image as ImageIcon,
  MapPin,
  Mic,
  MicOff,
  Route,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getSpeechLocale, STRINGS } from '../lib/i18n';
import type { CitySlug, LanguageCode, TravelMode, UserProfile, UserRole } from '../types/sugampath';

interface OnboardingFlowProps {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingFlow({ initialProfile, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<number>(1);
  const [draft, setDraft] = useState<UserProfile>(initialProfile);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  const t = STRINGS[draft.language];
  const totalSteps = draft.role === 'auditor' ? 3 : 4;

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text: string, lang: LanguageCode = draft.language) => {
    if (draft.visualOnly) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = getSpeechLocale(lang);
    u.rate = 0.92;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const speakSequence = (items: Array<{ text: string; lang: LanguageCode }>) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    items.forEach((item, idx) => {
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = getSpeechLocale(item.lang);
      u.rate = 0.92;
      if (idx === items.length - 1) {
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
      }
      window.speechSynthesis.speak(u);
    });
  };

  const handleListenScreen = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    if (step === 1) {
      speakSequence([
        { text: STRINGS.en.onboardWelcomeSpeech, lang: 'en' },
        { text: STRINGS.hi.onboardWelcomeSpeech, lang: 'hi' },
        { text: STRINGS.pa.onboardWelcomeSpeech, lang: 'pa' },
      ]);
      return;
    }
    if (step === 2) {
      speak(t.onboardRoleSpeech, draft.language);
      return;
    }
    if (step === 3 && draft.role === 'traveller') {
      speak(t.onboardModeSpeech, draft.language);
      return;
    }
    speak(t.onboardCitySpeech, draft.language);
  };

  const pickLanguage = (lang: LanguageCode) => {
    setDraft((p) => ({ ...p, language: lang }));
    setStep(2);
    if (draft.voiceEnabled && !draft.visualOnly) {
      speak(STRINGS[lang].onboardRoleSpeech, lang);
    }
  };

  const pickRole = (role: UserRole) => {
    setDraft((p) => ({ ...p, role }));
    setStep(3);
    if (draft.voiceEnabled && !draft.visualOnly) {
      speak(role === 'traveller' ? t.onboardModeSpeech : t.onboardCitySpeech, draft.language);
    }
  };

  const pickMode = (mode: TravelMode) => {
    const isVisualOnly = mode === 'standard';
    const autoVoice = mode === 'blind' ? true : isVisualOnly ? false : draft.voiceEnabled;
    const autoBigText = mode === 'walker' || mode === 'blind' ? true : draft.bigText;
    setDraft((p) => ({
      ...p,
      mode,
      voiceEnabled: autoVoice,
      visualOnly: isVisualOnly,
      bigText: autoBigText,
    }));
    setStep(4);
    if (mode === 'blind' || autoVoice) {
      speak(`${t.modes[mode]}. ${t.onboardCitySpeech}`, draft.language);
    }
  };

  const handleFinish = () => {
    stopSpeech();
    onComplete({ ...draft, onboarded: true });
  };

  const handleSkip = () => {
    stopSpeech();
    onComplete({ ...draft, onboarded: true });
  };

  const applyDictationText = (raw: string) => {
    const q = raw.toLowerCase();
    setListening(false);

    if (q.includes('hindi') || q.includes('हिन्दी') || q.includes('हिंदी')) {
      pickLanguage('hi');
      return;
    }
    if (q.includes('punjabi') || q.includes('ਪੰਜਾਬੀ') || q.includes('पंजाबी')) {
      pickLanguage('pa');
      return;
    }
    if (q.includes('english') || q.includes('अंग्रेजी') || q.includes('ਅੰਗਰੇਜ਼ੀ')) {
      pickLanguage('en');
      return;
    }
    if (q.includes('city') || q.includes('auditor') || q.includes('team') || q.includes('नगर') || q.includes('ਟੀਮ')) {
      pickRole('auditor');
      return;
    }
    if (q.includes('travel') || q.includes('यात्र') || q.includes('ਸਫ਼ਰ')) {
      pickRole('traveller');
      return;
    }
    if (q.includes('blind') || q.includes('vision') || q.includes('cane') || q.includes('दृष्टि') || q.includes('ਨੇਤਰ')) {
      setDraft((p) => ({ ...p, role: 'traveller' }));
      pickMode('blind');
      return;
    }
    if (q.includes('wheelchair') || q.includes('व्हील') || q.includes('ਵ੍ਹੀਲ')) {
      setDraft((p) => ({ ...p, role: 'traveller' }));
      pickMode('wheelchair');
      return;
    }
    if (q.includes('elder') || q.includes('walker') || q.includes('बुजुर्ग') || q.includes('ਬਜ਼ੁਰਗ')) {
      setDraft((p) => ({ ...p, role: 'traveller' }));
      pickMode('walker');
      return;
    }
    if (q.includes('patiala') || q.includes('पटियाला') || q.includes('ਪਟਿਆਲਾ')) {
      setDraft((p) => ({ ...p, city: 'patiala' }));
      speak(t.cities.patiala, draft.language);
      return;
    }
    if (q.includes('chandigarh') || q.includes('चंडीगढ़') || q.includes('ਚੰਡੀਗੜ੍ਹ')) {
      setDraft((p) => ({ ...p, city: 'chandigarh' }));
      speak(t.cities.chandigarh, draft.language);
      return;
    }
    if (q.includes('delhi') || q.includes('दिल्ली') || q.includes('ਦਿੱਲੀ')) {
      setDraft((p) => ({ ...p, city: 'new-delhi' }));
      speak(t.cities['new-delhi'], draft.language);
    }
  };

  const toggleDictation = () => {
    if (listening) {
      setListening(false);
      return;
    }
    setListening(true);

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec() as {
          lang: string;
          interimResults: boolean;
          onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
          onerror: () => void;
          start: () => void;
        };
        rec.lang = getSpeechLocale(draft.language);
        rec.interimResults = false;
        rec.onresult = (event) => {
          const text = event.results[0]?.[0]?.transcript || '';
          if (text) applyDictationText(text);
        };
        rec.onerror = () => {
          // Keep helper choices open
        };
        rec.start();
      } catch {
        // Keep helper choices open
      }
    }
  };

  const isCityStep =
    (draft.role === 'auditor' && step === 3) || (draft.role === 'traveller' && step === 4);

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--ink-primary)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-3xl p-6 sm:p-7 space-y-6">
        {/* Top bar: Brand + Skip */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-7 h-7 rounded-lg bg-[var(--tactile-yellow)] border border-[var(--ink-primary)] grid grid-cols-2 gap-0.5 p-1.5 shrink-0"
              aria-hidden="true"
            >
              <span className="rounded-full bg-[var(--ink-primary)]" />
              <span className="rounded-full bg-[var(--ink-primary)]" />
              <span className="rounded-full bg-[var(--ink-primary)]" />
              <span className="rounded-full bg-[var(--ink-primary)]" />
            </span>
            <span className="text-lg font-bold font-display text-[var(--ink-primary)]">{t.brand}</span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] px-2 py-1 min-h-[44px]"
          >
            {t.onboardSkip}
          </button>
        </div>

        {/* Calm Progress Dots */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[var(--ink-secondary)] font-mono-tabular">
            {t.onboardStepOf} {step} / {totalSteps}
          </span>

          {!draft.visualOnly && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleListenScreen}
                aria-pressed={isSpeaking}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 min-h-[38px] ${
                  isSpeaking
                    ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]'
                    : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isSpeaking ? t.stopSpeaking : t.listenPageBtn}</span>
              </button>

              <button
                type="button"
                onClick={toggleDictation}
                aria-expanded={listening}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 min-h-[38px] ${
                  listening
                    ? 'bg-[var(--status-red)] border-[var(--status-red)] text-white'
                    : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
                }`}
              >
                {listening ? (
                  <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{listening ? t.close : t.speakChoiceBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Dictation helper strip */}
        {listening && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-[var(--tactile-yellow-soft)] border border-[var(--ink-primary)] space-y-2"
          >
            <div className="text-xs font-bold text-[var(--ink-primary)]">{t.dictationHint}</div>
            <div className="flex flex-wrap gap-1.5">
              {['English', 'हिन्दी', 'ਪੰਜਾਬੀ', 'Blind', 'Wheelchair', 'Patiala'].map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => applyDictationText(word)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] text-xs font-bold text-[var(--ink-primary)] min-h-[36px]"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: LANGUAGE */}
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[var(--ink-primary)] text-balance">
              {t.onboardLangTitle}
            </h1>
            <div className="space-y-3">
              {(
                [
                  {
                    code: 'en',
                    label: 'English',
                    sub: 'Simple plain English',
                    sampleSpeech: STRINGS.en.onboardWelcomeSpeech,
                  },
                  {
                    code: 'hi',
                    label: 'हिन्दी (Hindi)',
                    sub: 'आसान हिंदी भाषा',
                    sampleSpeech: STRINGS.hi.onboardWelcomeSpeech,
                  },
                  {
                    code: 'pa',
                    label: 'ਪੰਜਾਬੀ (Punjabi)',
                    sub: 'ਸੌਖੀ ਪੰਜਾਬੀ ਭਾਸ਼ਾ',
                    sampleSpeech: STRINGS.pa.onboardWelcomeSpeech,
                  },
                ] as const
              ).map((item) => {
                const selected = draft.language === item.code;
                return (
                  <div
                    key={item.code}
                    className={`rounded-2xl border flex items-center gap-2 p-2 ${
                      selected
                        ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-paper)] border-[var(--border-line)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => pickLanguage(item.code)}
                      className="flex-1 text-left px-3 py-2.5 flex items-center justify-between gap-3 min-h-[56px]"
                    >
                      <div>
                        <div className="text-lg font-bold text-[var(--ink-primary)]">{item.label}</div>
                        <div className="text-xs text-[var(--ink-secondary)]">{item.sub}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--ink-primary)] shrink-0" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => speak(item.sampleSpeech, item.code)}
                      aria-label={`${t.listenPageBtn} ${item.label}`}
                      className="w-11 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] flex items-center justify-center shrink-0"
                    >
                      <Volume2 className="w-5 h-5 text-[var(--ink-primary)]" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: WHO IS USING */}
        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[var(--ink-primary)] text-balance">
              {t.onboardRoleTitle}
            </h1>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => pickRole('traveller')}
                className={`w-full text-left px-4 py-4 rounded-2xl border flex items-center justify-between gap-3 min-h-[80px] ${
                  draft.role === 'traveller'
                    ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] border-[var(--border-line)]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[var(--ink-primary)]">{t.onboardRoleTraveller}</div>
                    <div className="text-xs text-[var(--ink-secondary)] mt-0.5">{t.onboardRoleTravellerSub}</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => pickRole('auditor')}
                className={`w-full text-left px-4 py-4 rounded-2xl border flex items-center justify-between gap-3 min-h-[80px] ${
                  draft.role === 'auditor'
                    ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] border-[var(--border-line)]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[var(--ink-primary)]">{t.onboardRoleAuditor}</div>
                    <div className="text-xs text-[var(--ink-secondary)] mt-0.5">{t.onboardRoleAuditorSub}</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 (TRAVELLER): HOW CAN WE HELP */}
        {step === 3 && draft.role === 'traveller' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--ink-primary)] text-balance">
                {t.onboardModeTitle}
              </h1>
              <p className="text-xs text-[var(--ink-secondary)] mt-1">{t.onboardModeSub}</p>
            </div>

            <div className="space-y-2.5">
              {(
                [
                  { id: 'blind', icon: Eye },
                  { id: 'wheelchair', icon: Accessibility },
                  { id: 'walker', icon: Footprints },
                  { id: 'standard', icon: ImageIcon },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = draft.mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pickMode(item.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border flex items-center justify-between gap-3 min-h-[68px] ${
                      active
                        ? 'bg-[var(--tactile-yellow-soft)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-paper)] border-[var(--border-line)]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-line)] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[var(--ink-primary)]" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-[var(--ink-primary)]">{t.modes[item.id]}</div>
                        <div className="text-xs text-[var(--ink-secondary)] mt-0.5">{t.onboardModeSubs[item.id]}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: CITY + GENTLE 3-LINE QUICK TOUR */}
        {isCityStep && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-[var(--ink-primary)] text-balance">
              {t.onboardCityTitle}
            </h1>

            <div className="grid grid-cols-3 gap-2">
              {(['patiala', 'chandigarh', 'new-delhi'] as CitySlug[]).map((slug) => {
                const active = draft.city === slug;
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, city: slug }))}
                    aria-pressed={active}
                    className={`px-2 py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs sm:text-sm font-bold min-h-[60px] ${
                      active
                        ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]'
                        : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-full">{t.cities[slug]}</span>
                  </button>
                );
              })}
            </div>

            {/* Gentle Quick Preview Card (Never overwhelms) */}
            <div className="p-4 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] space-y-2">
              <div className="text-xs font-bold text-[var(--ink-secondary)]">{t.quickTourTitle}</div>
              <ul className="space-y-1.5 text-sm font-semibold text-[var(--ink-primary)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-good)] shrink-0" aria-hidden="true" />
                  <span>{t.quickTourStep1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-good)] shrink-0" aria-hidden="true" />
                  <span>{t.quickTourStep2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-[var(--status-good)] shrink-0" aria-hidden="true" />
                  <span>{t.quickTourStep3}</span>
                </li>
              </ul>
              <p className="text-xs text-[var(--ink-secondary)] pt-1">{t.replayGuideHint}</p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-4 px-6 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-bold flex items-center justify-center gap-2 min-h-[56px]"
            >
              <span>{t.onboardStartBtn}</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Calm Back Button */}
        {step > 1 && (
          <div>
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>{t.onboardBack}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
