'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { Flag } from '@/components/ui/Flag';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/services/i18n/config';
import { useSettings } from '@/services/settings/store';

/** Header language picker: WAI-ARIA select-only combobox with flags (keyboard accessible). */
export function LanguageSelect() {
  const t = useTranslations('settings');
  const locale = useSettings((s) => s.locale);
  const setLocale = useSettings((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [open]);

  function openList() {
    setActive(Math.max(0, LOCALES.indexOf(locale)));
    setOpen(true);
  }

  function choose(l: Locale) {
    setLocale(l);
    setOpen(false);
    button.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    const last = LOCALES.length - 1;
    if (e.key === 'ArrowDown') setActive((i) => (i >= last ? 0 : i + 1));
    else if (e.key === 'ArrowUp') setActive((i) => (i <= 0 ? last : i - 1));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(last);
    else if (e.key === 'Enter' || e.key === ' ') choose(LOCALES[active]);
    else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
      return;
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-label={t('language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${LOCALES[active]}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'mc-press flex h-10 items-center gap-1.5 rounded-full border bg-surface px-2.5 text-sm font-semibold shadow-card sm:gap-2 sm:px-3',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          open ? 'border-accent bg-surface-2' : 'border-border hover:bg-surface-2',
        )}
      >
        <Flag code={locale} />
        <span className="hidden lg:inline" lang={locale}>
          {LOCALE_LABELS[locale]}
        </span>
        {/* Phones: the flag alone (room for the HUD); tablets: the code. */}
        <span className="hidden uppercase sm:inline lg:hidden">{locale}</span>
        <span
          aria-hidden
          className={cn('text-xs text-muted transition-transform', open && 'rotate-180')}
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('language')}
          className="absolute right-0 z-30 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-card"
        >
          {LOCALES.map((l, i) => {
            const selected = l === locale;
            return (
              <li
                key={l}
                id={`${listId}-${l}`}
                role="option"
                aria-selected={selected}
                lang={l}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(l)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                  i === active && 'bg-surface-2',
                  selected && 'font-semibold text-accent',
                )}
              >
                <Flag code={l} />
                <span className="flex-1">{LOCALE_LABELS[l]}</span>
                {selected && <span aria-hidden>✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
