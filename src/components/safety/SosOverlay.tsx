import { useEffect, useState } from 'react';
import { MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { SAFE } from '../../lib/i18nSafety';
import { smsLink, telLink, whatsappLink } from '../../lib/safety/device';
import type { WalkSession } from '../../hooks/useWalkSession';
import type { EmergencyContact } from '../../types/safety';
import type { LanguageCode } from '../../types/sugampath';
import { HoldButton } from './HoldButton';

interface Props {
  session: WalkSession;
  contact: EmergencyContact | null;
  language: LanguageCode;
}

/**
 * Full-screen emergency layer. Two states:
 *  - countdown: the whole screen is one cancel button (tap anywhere).
 *  - sent: three huge targets. Call (top), message (middle), "I am safe" (bottom, needs a hold).
 */
export function SosOverlay({ session, contact, language }: Props) {
  const s = SAFE[language];
  const { sos } = session;
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (sos.state === 'idle') return null;

  if (sos.state === 'countdown') {
    return (
      <button
        type="button"
        onClick={session.cancelSos}
        aria-live="assertive"
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-[#b3261e] text-white p-6 text-center"
      >
        <span className="text-2xl font-bold">{s.sosIn}</span>
        <span className="font-mono-tabular text-[9rem] leading-none font-bold" aria-label={`${sos.secondsLeft}`}>
          {sos.secondsLeft}
        </span>
        <span className="text-3xl font-bold">{s.sosCancelHint}</span>
      </button>
    );
  }

  const reason = sos.kind === 'fall' ? s.sosFall : s.sosManual;
  const message = s.sosMessage(reason, session.trackUrl ?? '');
  const callHref = telLink(contact?.phone ?? '112');
  // WhatsApp needs data. SMS works on a bare signal, which is what a tunnel gives you.
  const msgHref = contact ? (online ? whatsappLink(contact.phone, message) : smsLink(contact.phone, message)) : null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#b3261e] text-white" role="alertdialog" aria-label={s.sosSentTitle}>
      <a
        href={callHref}
        className="flex-[5] flex flex-col items-center justify-center gap-3 bg-white text-[#b3261e] text-center p-4"
      >
        <Phone className="w-14 h-14" aria-hidden="true" />
        <span className="text-3xl font-bold">{contact ? s.sosCall(contact.name) : s.sosCall112}</span>
      </a>
      {msgHref && (
        <a
          href={msgHref}
          target={online ? '_blank' : undefined}
          rel="noreferrer"
          className="flex-[3] flex items-center justify-center gap-3 text-2xl font-bold border-t-4 border-white/30 p-4"
        >
          <MessageCircle className="w-9 h-9" aria-hidden="true" />
          <span>{online ? s.sosWhatsapp : s.sosSms}</span>
        </a>
      )}
      <HoldButton
        holdMs={2000}
        onActivate={session.confirmSafe}
        className="flex-[2] flex items-center justify-center gap-3 text-xl font-bold bg-black/30 border-t-4 border-white/30 p-4 text-white"
      >
        <ShieldCheck className="w-7 h-7 inline mr-2" aria-hidden="true" />
        {s.sosImOk}
      </HoldButton>
    </div>
  );
}
