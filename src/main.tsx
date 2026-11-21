import {createRoot} from 'react-dom/client';
import {UpdatePrompt} from './components/UpdatePrompt.tsx';
import App from './App.tsx';
import {AuthProvider} from './lib/auth';
import {TrackPage} from './components/TrackPage.tsx';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './lib/maplibreSetup';
import {supabase} from './lib/supabase';
import {registerBackend} from './services/backend';
import {createSupabaseBackend, type SupabaseLike} from './services/backend/supabaseBackend';

if (supabase) {
  registerBackend(createSupabaseBackend(supabase as unknown as SupabaseLike));
}


// Walk-With-Me: /track/<token> is a standalone family view. No onboarding, no login.
const trackMatch = window.location.pathname.match(/^\/track\/([A-Za-z0-9_-]{8,64})\/?$/);

createRoot(document.getElementById('root')!).render(
  <>
    {trackMatch ? <TrackPage token={trackMatch[1]} /> : <AuthProvider><App /></AuthProvider>}
    <UpdatePrompt />
  </>
);
