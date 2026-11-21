import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows a banner when a new version of the app has been downloaded. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      // Look for a new version every 30 minutes and whenever the app returns to the foreground.
      if (!reg) return;
      setInterval(() => void reg.update(), 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void reg.update();
      });
    },
  });
  if (!needRefresh) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,420px)] flex items-center gap-3 rounded-2xl border-2 border-black bg-[#FFC72C] text-black p-3 shadow-lg"
    >
      <span className="flex-1 text-sm font-bold">A new version of SugamPath is ready.</span>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="min-h-[44px] px-4 rounded-xl bg-black text-white text-sm font-bold"
      >
        Update
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss"
        className="min-h-[44px] px-2 text-sm font-bold"
      >
        Later
      </button>
    </div>
  );
}
