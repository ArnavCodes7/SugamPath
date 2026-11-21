import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthState {
  /** true once the first session check has finished (so the UI doesn't flash "signed out"). */
  ready: boolean;
  /** false when Supabase env vars are missing: the app then runs fully on-device. */
  available: boolean;
  session: Session | null;
  user: User | null;
  displayName: string;
  /** Sends a magic link (and a 6-digit code) to the email. */
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  /** For when the link opens in another browser: type the code from the same email. */
  verifyCode: (email: string, code: string) => Promise<{ error: string | null }>;
  setDisplayName: (name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Auth sheet open state is app-wide so any screen can ask the user to sign in. */
  sheetOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** "arnav.singh@x.com" -> "arnav.singh". Never expose the full address publicly. */
export function nameFromEmail(email: string | undefined | null): string {
  const local = (email ?? '').split('@')[0] ?? '';
  const clean = local.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20);
  return clean || 'Member';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    // detectSessionInUrl (default) turns the magic-link redirect into a session on first load.
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setReady(true);
      if (event === 'SIGNED_IN') {
        setSheetOpen(false);
        // Drop the token fragment / code from the address bar after the magic link lands.
        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/', shouldCreateUser: true },
    });
    return { error: error?.message ?? null };
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    return { error: error?.message ?? null };
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: name.trim().slice(0, 30) } });
    if (!error && data.user) setSession((s) => (s ? { ...s, user: data.user } : s));
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(() => {
    const user = session?.user ?? null;
    const meta = (user?.user_metadata ?? {}) as { display_name?: string };
    return {
      ready,
      available: !!supabase,
      session,
      user,
      displayName: meta.display_name?.trim() || nameFromEmail(user?.email),
      sendMagicLink,
      verifyCode,
      setDisplayName,
      signOut,
      sheetOpen,
      openSignIn: () => setSheetOpen(true),
      closeSignIn: () => setSheetOpen(false),
    };
  }, [ready, session, sheetOpen, sendMagicLink, verifyCode, setDisplayName, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
