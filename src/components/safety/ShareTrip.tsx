import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { SAFE } from '../../lib/i18nSafety';
import { whatsappLink } from '../../lib/safety/device';
import type { EmergencyContact } from '../../types/safety';
import type { LanguageCode } from '../../types/sugampath';

interface Props {
  url: string;
  language: LanguageCode;
  contact: EmergencyContact | null;
  placeName: string;
}

/** One tap: opens the phone's share sheet (or WhatsApp to the saved contact, or copies the link). */
export function ShareTrip({ url, language, contact, placeName }: Props) {
  const s = SAFE[language];
  const [copied, setCopied] = useState(false);
  const text = `${s.trackTitle(placeName)}: ${url}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SugamPath', text, url });
        return;
      } catch {
        // cancelled or unsupported: fall through
      }
    }
    if (contact) {
      window.open(whatsappLink(contact.phone, text), '_blank', 'noreferrer');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard blocked
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-line)] px-4 py-3">
      <span className="text-sm font-bold text-[var(--ink-primary)]">{s.shareTitle}</span>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--tactile-yellow)] text-[var(--tactile-yellow-ink)] text-sm font-bold min-h-[44px] shrink-0"
      >
        {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
        <span>{copied ? s.shareCopied : s.shareBtn}</span>
      </button>
    </div>
  );
}
