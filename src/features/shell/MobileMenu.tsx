'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';

interface MobileMenuProps {
  items: readonly { href: string; key: 'learn' | 'practice' | 'play' | 'guide'; icon: string }[];
  isActive: (href: string) => boolean;
}

/** Phone navigation: a dropdown card over the page (does not push content down). */
export function MobileMenu({ items, isActive }: MobileMenuProps) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

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
    <div ref={root} className="relative sm:hidden">
      <button
        type="button"
        aria-label={t('menu')}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex size-9 items-center justify-center rounded-full border text-lg transition-colors',
          open ? 'border-accent bg-surface-2' : 'border-transparent hover:bg-surface-2',
        )}
      >
        <span aria-hidden>{open ? '✕' : '☰'}</span>
      </button>

      {open && (
        <nav
          id={menuId}
          className="absolute right-0 z-30 mt-2 min-w-52 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-card"
        >
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-surface-2',
                  active ? 'bg-surface-2 font-semibold text-accent' : 'text-fg',
                )}
              >
                <span aria-hidden>{item.icon}</span>
                <span className="flex-1">{t(item.key)}</span>
                {active && <span aria-hidden>•</span>}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
