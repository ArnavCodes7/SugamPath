import { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { SAFE } from '../../lib/i18nSafety';
import { cleanPhone, isValidPhone } from '../../lib/safety/device';
import type { EmergencyContact } from '../../types/safety';
import type { LanguageCode } from '../../types/sugampath';

interface Props {
  language: LanguageCode;
  contact: EmergencyContact | null | undefined;
  onChange: (c: EmergencyContact) => void;
  /** Large touch targets and text for the voice-first layout. */
  large?: boolean;
}

/** One small card. Shows who gets alerted, or asks once for a name and number. */
export function EmergencyContactCard({ language, contact, onChange, large = false }: Props) {
  const s = SAFE[language];
  const [editing, setEditing] = useState(!contact);
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [touched, setTouched] = useState(false);

  const valid = name.trim().length > 0 && isValidPhone(phone);
  const field = `w-full rounded-xl border border-[var(--border-line)] bg-[var(--bg-paper)] px-3.5 text-[var(--ink-primary)] ${
    large ? 'py-4 text-lg min-h-[60px]' : 'py-2.5 text-sm min-h-[44px]'
  }`;

  if (!editing && contact) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--status-good-soft)] border border-[var(--status-good)]/30 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <HeartHandshake className="w-5 h-5 text-[var(--status-good)] shrink-0" aria-hidden="true" />
          <span className={`font-bold text-[var(--ink-primary)] truncate ${large ? 'text-base' : 'text-sm'}`}>
            {s.contactSaved(contact.name)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-bold underline underline-offset-4 text-[var(--ink-primary)] min-h-[40px] px-1 shrink-0"
        >
          {s.contactChange}
        </button>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!valid) return;
        onChange({ name: name.trim(), phone: cleanPhone(phone) });
        setEditing(false);
      }}
    >
      <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
        <HeartHandshake className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>{s.contactTitle}</span>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={s.contactName}
        aria-label={s.contactName}
        autoComplete="name"
        className={field}
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={s.contactPhone}
        aria-label={s.contactPhone}
        inputMode="tel"
        autoComplete="tel"
        className={field}
      />
      {touched && !valid && phone && !isValidPhone(phone) && (
        <p role="alert" className="text-xs font-semibold text-[var(--status-red)]">
          {s.contactInvalid}
        </p>
      )}
      <p className="text-xs text-[var(--ink-secondary)]">{s.contactWhy}</p>
      <button
        type="submit"
        className={`w-full rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold ${
          large ? 'py-4 text-lg min-h-[60px]' : 'py-2.5 text-sm min-h-[46px]'
        }`}
      >
        {s.contactSave}
      </button>
    </form>
  );
}
