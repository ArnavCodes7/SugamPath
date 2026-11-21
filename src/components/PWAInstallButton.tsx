import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

interface PWAInstallButtonProps {
  installLabel: string;
  iosButtonLabel: string;
  iosTitle: string;
  iosStep1: string;
  iosStep2: string;
  desktopTitle: string;
  desktopStep1: string;
  desktopStep2: string;
  closeLabel: string;
}

export function PWAInstallButton({
  installLabel,
  iosButtonLabel,
  iosTitle,
  iosStep1,
  iosStep2,
  desktopTitle,
  desktopStep1,
  desktopStep2,
  closeLabel,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-xs font-bold hover:opacity-90 min-h-[40px] whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{installLabel}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-line)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] min-h-[40px] whitespace-nowrap shrink-0"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{isIOS ? iosButtonLabel : installLabel}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-6 space-y-4">
            <h2 id="pwa-install-title" className="text-lg font-bold text-[var(--ink-primary)]">
              {isIOS ? iosTitle : desktopTitle}
            </h2>
            <p className="text-sm text-[var(--ink-primary)] leading-relaxed">
              {isIOS ? iosStep1 : desktopStep1}
              <br />
              {isIOS ? iosStep2 : desktopStep2}
            </p>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-3 rounded-xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-sm font-bold min-h-[48px]"
            >
              {closeLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
