import { useId, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { PlaceRow } from '../../lib/accessibility-types';

interface Props {
  label: string;
  places: PlaceRow[];
  value: string | null;
  onChange: (externalId: string | null) => void;
  placeholder: string;
  noAccessLabel: string;
  disabled?: boolean;
  /** Let places without a connected gate be picked (e.g. when marking, not routing). */
  allowUnroutable?: boolean;
}

/** Accessible searchable dropdown (ARIA combobox). Non-routable places are listed but not selectable. */
export function PlacePicker({ label, places, value, onChange, placeholder, noAccessLabel, disabled, allowUnroutable }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = places.find((p) => p.external_id === value) ?? null;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? places.filter((p) => p.name.toLowerCase().includes(q)) : places;
  }, [places, query]);

  const choose = (p: PlaceRow | undefined) => {
    if (!p || (!p.routable && !allowUnroutable)) return;
    onChange(p.external_id);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault();
        choose(matches[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : selected?.name ?? ''}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="w-full h-12 pl-3 pr-10 rounded-xl border-2 border-[var(--border-line)] bg-[var(--bg-surface)] text-base font-semibold text-[var(--ink-primary)] focus:border-[var(--ink-primary)] outline-none disabled:opacity-50"
        />
        {selected && !open && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onChange(null);
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1 w-10 h-10 grid place-items-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-xl border-2 border-[var(--ink-primary)] bg-[var(--bg-surface)] shadow-lg"
        >
          {matches.length === 0 && (
            <li className="px-3 py-3 text-sm text-[var(--ink-secondary)]">—</li>
          )}
          {matches.map((p, i) => (
            <li
              key={p.external_id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={p.external_id === value}
              aria-disabled={!p.routable && !allowUnroutable}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2.5 text-sm flex items-center justify-between gap-2 ${
                p.routable || allowUnroutable ? 'cursor-pointer text-[var(--ink-primary)] font-semibold' : 'cursor-not-allowed text-[var(--ink-secondary)] opacity-60'
              } ${i === active ? 'bg-[var(--tactile-yellow-soft)]' : ''}`}
            >
              <span className="truncate">{p.name}</span>
              {!p.routable && !allowUnroutable && <span className="text-[11px] shrink-0">{noAccessLabel}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
