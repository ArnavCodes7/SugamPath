import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {TrackPage} from './components/TrackPage.tsx';
import './index.css';

registerSW({
  immediate: true,
});

// Walk-With-Me: /track/<token> is a standalone family view. No onboarding, no login.
const trackMatch = window.location.pathname.match(/^\/track\/([A-Za-z0-9_-]{8,64})\/?$/);

createRoot(document.getElementById('root')!).render(
  trackMatch ? <TrackPage token={trackMatch[1]} /> : <App />
);
