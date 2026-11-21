import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, KeyRound, Loader2, LogOut, Mail, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { CM } from '../../lib/i18nCommunity';
import type { LanguageCode } from '../../types/sugampath';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COOLDOWN_S = 45;

/** Email + magic link sheet. Also doubles as the account panel once signed in. */
export function AuthSheet({ language }: { language: LanguageCode }) {
  const c = CM[language];
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'email' | 'sent'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [name, setName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.sheetOpen) return;
    setError(null);
    setCode('');
    if (!auth.user) setPhase('email');
    setName(auth.displayName);
    setNameSaved(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.sheetOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (!auth.sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && auth.closeSignIn();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [auth]);

  const send = async () => {
    if (!EMAIL_RE.test(email.trim())) return setError(c.invalidEmail);
    setBusy(true);
    setError(null);
    const { error: err } = await auth.sendMagicLink(email);
    setBusy(false);
    if (err) return setError(err);
    setPhase('sent');
    setCooldown(COOLDOWN_S);
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await auth.verifyCode(email, code);
    setBusy(false);
    if (err) setError(err);
  };

  const saveName = async () => {
    const { error: err } = await auth.setDisplayName(name);
    if (err) return setError(err);
    setNameSaved(true);
  };

  return (
    <AnimatePresence>
      {auth.sheetOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label={c.close}
            onClick={auth.closeSignIn}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-t-[28px] sm:rounded-[28px] border border-[var(--border-line)] shadow-2xl overflow-hidden"
          >
            {/* Brand header */}
            <div className="relative bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] px-6 pt-6 pb-8">
              <div
                aria-hidden="true"
                className="absolute -right-6 -top-6 w-32 h-32 rounded-full border-[14px] border-black/10"
              />
              <div
                aria-hidden="true"
                className="absolute right-10 top-10 w-10 h-10 rounded-full border-[6px] border-black/10"
              />
              <button
                type="button"
                onClick={auth.closeSignIn}
                aria-label={c.close}
                className="absolute right-3 top-3 w-10 h-10 grid place-items-center rounded-full bg-black/10 hover:bg-black/20"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-[var(--ink-primary)] text-[var(--tactile-yellow)] grid place-items-center mb-3">
                {auth.user ? <ShieldCheck className="w-6 h-6" aria-hidden="true" /> : <Mail className="w-6 h-6" aria-hidden="true" />}
              </div>
              <h2 id="auth-title" className="text-2xl font-extrabold leading-tight pr-10">
                {auth.user ? c.account : phase === 'sent' ? c.checkInbox : c.authTitle}
              </h2>
              <p className="text-sm font-semibold mt-1 opacity-80 pr-6">
                {auth.user ? c.welcomeBack : phase === 'sent' ? c.sentTo(email.trim()) : c.authSub}
              </p>
            </div>

            <div className="px-6 py-5 space-y-4 -mt-3 bg-[var(--bg-surface)] rounded-t-3xl relative">
              {!auth.available ? (
                <p className="text-sm font-semibold text-[var(--status-red)]">{c.authOff}</p>
              ) : auth.user ? (
                <>
                  <div className="text-xs font-bold text-[var(--ink-secondary)]">
                    {c.signedInAs}
                    <div className="text-sm text-[var(--ink-primary)] break-all">{auth.user.email}</div>
                  </div>
                  <div>
                    <label htmlFor="auth-name" className="text-xs font-bold text-[var(--ink-secondary)]">
                      {c.displayName}
                    </label>
                    <div className="flex gap-2 mt-1">
                      <input
                        id="auth-name"
                        value={name}
                        maxLength={30}
                        onChange={(e) => {
                          setName(e.target.value);
                          setNameSaved(false);
                        }}
                        className="flex-1 min-w-0 h-12 px-4 rounded-xl bg-[var(--bg-paper)] border-2 border-[var(--border-line)] font-semibold focus:border-[var(--ink-primary)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void saveName()}
                        disabled={!name.trim() || name.trim() === auth.displayName}
                        className="px-4 h-12 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
                      >
                        {nameSaved ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : null}
                        {nameSaved ? c.saved : c.save}
                      </button>
                    </div>
                    <p className="text-[11px] font-semibold text-[var(--ink-secondary)] mt-1.5">{c.displayNameHint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void auth.signOut();
                      auth.closeSignIn();
                    }}
                    className="w-full h-12 rounded-xl border-2 border-[var(--border-line)] font-bold inline-flex items-center justify-center gap-2 hover:bg-[var(--bg-subtle)]"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    {c.signOut}
                  </button>
                </>
              ) : phase === 'email' ? (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                  }}
                >
                  <label htmlFor="auth-email" className="text-xs font-bold text-[var(--ink-secondary)]">
                    {c.emailLabel}
                  </label>
                  <input
                    ref={inputRef}
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder={c.emailPlaceholder}
                    className="w-full h-14 px-4 rounded-2xl bg-[var(--bg-paper)] border-2 border-[var(--border-line)] text-base font-semibold focus:border-[var(--ink-primary)] outline-none"
                  />
                  {error && (
                    <p role="alert" className="text-sm font-bold text-[var(--status-red)]">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy || !email.trim()}
                    className="w-full h-14 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-base font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.99] transition-transform"
                  >
                    {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Mail className="w-5 h-5" aria-hidden="true" />}
                    {busy ? c.sending : c.sendLink}
                  </button>
                  <p className="text-xs font-semibold text-[var(--ink-secondary)] flex gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[var(--status-good)]" aria-hidden="true" />
                    {c.authWhy}
                  </p>
                </form>
              ) : (
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mx-auto w-16 h-16 rounded-full bg-[var(--status-good-soft)] text-[var(--status-good)] grid place-items-center"
                  >
                    <Mail className="w-8 h-8" aria-hidden="true" />
                  </motion.div>

                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (code.trim().length >= 6) void verify();
                    }}
                  >
                    <label htmlFor="auth-code" className="text-xs font-bold text-[var(--ink-secondary)] flex items-start gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                      {c.linkOtherDevice}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="auth-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="123456"
                        aria-label={c.codeLabel}
                        className="flex-1 min-w-0 h-12 px-4 rounded-xl bg-[var(--bg-paper)] border-2 border-[var(--border-line)] font-mono-tabular text-lg tracking-[0.3em] text-center focus:border-[var(--ink-primary)] outline-none"
                      />
                      <button
                        type="submit"
                        disabled={busy || code.length < 6}
                        className="px-4 h-12 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold disabled:opacity-40"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : c.verify}
                      </button>
                    </div>
                  </form>
                  {error && (
                    <p role="alert" className="text-sm font-bold text-[var(--status-red)]">
                      {error}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 text-sm font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setPhase('email');
                        setCode('');
                        setError(null);
                      }}
                      className="underline underline-offset-4 min-h-[44px]"
                    >
                      {c.useOtherEmail}
                    </button>
                    <button
                      type="button"
                      onClick={() => void send()}
                      disabled={cooldown > 0 || busy}
                      className="underline underline-offset-4 disabled:opacity-50 disabled:no-underline min-h-[44px]"
                    >
                      {cooldown > 0 ? c.resendIn(cooldown) : c.resend}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Header button: "Sign in", or an avatar that opens the account panel. */
export function AccountButton({ language }: { language: LanguageCode }) {
  const c = CM[language];
  const auth = useAuth();
  if (!auth.available) return null;
  const initial = (auth.displayName[0] ?? '?').toUpperCase();
  return auth.user ? (
    <button
      type="button"
      onClick={auth.openSignIn}
      aria-label={`${c.account}: ${auth.displayName}`}
      title={auth.displayName}
      className="w-10 h-10 rounded-full bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] border-2 border-[var(--ink-primary)] font-extrabold grid place-items-center shrink-0"
    >
      {initial}
    </button>
  ) : (
    <button
      type="button"
      onClick={auth.openSignIn}
      disabled={!auth.ready}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs sm:text-sm font-bold min-h-[40px] whitespace-nowrap shrink-0 disabled:opacity-60"
    >
      <Mail className="w-4 h-4" aria-hidden="true" />
      <span>{c.signIn}</span>
    </button>
  );
}
