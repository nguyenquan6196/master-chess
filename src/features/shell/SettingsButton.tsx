'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { HudIconButton } from './HudIconButton';

/** Gap between the gear and the panel: the same as the language dropdown (`mt-2`). */
const PANEL_GAP_PX = 8;

/**
 * ⚙️ icon in the HUD that opens the settings panel as a floating card right under it
 * (full width on phones). Its right edge lines up with the gear button's. On desktop the
 * panel can be expanded: the right edge stays, the width grows (animated) to the left
 * edge of the page container, and the content flows into two equal columns.
 */
export function SettingsButton({ children }: { children: ReactNode }) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [anchor, setAnchor] = useState({ top: 64, right: 16, wide: 1024 });

  // Pin the panel to the gear: top = its bottom + gap, right edge = the button's right
  // edge, expanded width = from the page container's left edge to that right edge.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = root.current?.getBoundingClientRect();
      if (!button) return;
      // Right edge of the panel's containing block, measured on the panel itself so
      // scrollbars / gutters are accounted for exactly.
      let edge = document.documentElement.clientWidth;
      if (panel.current) {
        const css = getComputedStyle(panel.current);
        edge = panel.current.getBoundingClientRect().right + parseFloat(css.right);
      }
      const box = root.current?.closest('header')?.firstElementChild;
      const left = box
        ? box.getBoundingClientRect().left + parseFloat(getComputedStyle(box).paddingLeft)
        : PANEL_GAP_PX;
      setAnchor({
        top: Math.round(button.bottom + PANEL_GAP_PX),
        right: Math.round(edge - button.right),
        wide: Math.round(button.right - left),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

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
          ref={panel}
          id="settings-panel"
          role="dialog"
          aria-label={t('title')}
          style={
            {
              '--panel-top': `${anchor.top}px`,
              '--panel-right': `${anchor.right}px`,
              '--panel-wide': `${anchor.wide}px`,
            } as CSSProperties
          }
          className={cn(
            'mc-scene fixed inset-x-3 top-(--panel-top) z-40 flex max-h-[calc(100dvh-var(--panel-top)-0.75rem)] origin-top-right flex-col overflow-hidden rounded-2xl border border-border bg-surface text-fg shadow-card',
            'sm:right-(--panel-right) sm:left-auto sm:h-[calc(100dvh-var(--panel-top)-1rem)] sm:max-h-none',
            'transition-[width] duration-(--mc-dur-slow) ease-(--mc-ease)',
            expanded ? 'sm:w-(--panel-wide)' : 'sm:w-[36rem]',
          )}
        >
          <div
            className={cn(
              'flex items-center justify-between gap-2 border-b border-border px-5 py-4',
              expanded ? 'sm:px-8' : 'sm:px-6',
            )}
          >
            <h2 className="font-display text-2xl font-bold">{t('title')}</h2>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="hidden rounded-lg px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg sm:block"
            >
              {expanded ? `⤡ ${t('shrink')}` : `⤢ ${t('expand')}`}
            </button>
          </div>
          {/* Only the body scrolls, inset from the rounded corners. */}
          <div
            className={cn(
              '@container min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-gutter:stable] [scrollbar-width:thin]',
              expanded ? 'sm:px-8' : 'sm:px-6',
            )}
          >
            {children}
          </div>
        </section>
      )}
    </div>
  );
}
