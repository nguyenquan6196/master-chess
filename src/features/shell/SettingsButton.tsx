'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { HudIconButton } from './HudIconButton';

/**
 * ⚙️ icon in the HUD that opens the settings panel as a floating card under it
 * (full width on phones). The panel can be expanded to a large sheet on desktop.
 */
export function SettingsButton({ children }: { children: ReactNode }) {
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
      <HudIconButton
        label={open ? t('close') : t('open')}
        aria-expanded={open}
        aria-controls="settings-panel"
        active={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⚙️
      </HudIconButton>
      {open && (
        <section
          id="settings-panel"
          role="dialog"
          aria-label={t('title')}
          className={cn(
            'mc-scene fixed inset-x-3 top-16 z-40 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-fg shadow-card',
            expanded
              ? 'sm:inset-x-8 sm:bottom-6 sm:max-h-none sm:p-8'
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
    </div>
  );
}
