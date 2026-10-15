'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';

/**
 * Floating settings button (bottom right) that expands a settings panel.
 * Desktop: a wide card anchored above the button. Phones: full width with even margins.
 */
export function SettingsFab({ children }: { children: ReactNode }) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div ref={root}>
      {open && (
        <section
          id="settings-panel"
          role="dialog"
          aria-label={t('title')}
          className={cn(
            'fixed inset-x-4 bottom-20 z-40 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-fg shadow-card',
            expanded
              ? 'sm:inset-x-8 sm:top-20 sm:p-8'
              : 'sm:inset-x-auto sm:right-4 sm:w-[36rem] sm:p-6',
          )}
        >
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">⚙️ {t('title')}</h2>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="hidden rounded-lg px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg sm:block"
            >
              {expanded ? `⤡ ${t('shrink')}` : `⤢ ${t('expand')}`}
            </button>
          </div>
          {children}
        </section>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="settings-panel"
        aria-label={open ? t('close') : t('open')}
        title={t('title')}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full text-xl shadow-card transition-transform hover:scale-105',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          open ? 'bg-accent text-accent-fg' : 'border border-border bg-surface',
        )}
      >
        <span aria-hidden>{open ? '✕' : '⚙️'}</span>
      </button>
    </div>
  );
}
