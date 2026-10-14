'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';

/** Floating settings button (bottom right) that expands a settings panel. */
export function SettingsFab({ children }: { children: ReactNode }) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
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
    <div ref={root} className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          id="settings-panel"
          role="dialog"
          aria-label={t('title')}
          className="max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-fg shadow-card"
        >
          <h2 className="mb-4 font-display text-xl font-bold">⚙️ {t('title')}</h2>
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
          'flex size-12 items-center justify-center rounded-full text-xl shadow-card transition-transform hover:scale-105',
          open ? 'bg-accent text-accent-fg' : 'border border-border bg-surface',
        )}
      >
        <span aria-hidden>{open ? '✕' : '⚙️'}</span>
      </button>
    </div>
  );
}
