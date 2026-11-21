import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {TrackPage} from './components/TrackPage.tsx';
import './index.css';
import {createClient} from '@supabase/supabase-js';
import {registerBackend} from './services/backend';
import {createSupabaseBackend, type SupabaseLike} from './services/backend/supabaseBackend';

const SB_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SB_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
if (SB_URL && SB_KEY) {
  registerBackend(createSupabaseBackend(createClient(SB_URL, SB_KEY) as unknown as SupabaseLike));
}

registerSW({
  immediate: true,
});

// Walk-With-Me: /track/<token> is a standalone family view. No onboarding, no login.
const trackMatch = window.location.pathname.match(/^\/track\/([A-Za-z0-9_-]{8,64})\/?$/);

createRoot(document.getElementById('root')!).render(
  trackMatch ? <TrackPage token={trackMatch[1]} /> : <App />
);
