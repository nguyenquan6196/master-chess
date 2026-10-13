'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';

const NAV_ITEMS = [
  { href: '/learn', key: 'learn', icon: '📖' },
  { href: '/practice', key: 'practice', icon: '🧩' },
  { href: '/play', key: 'play', icon: '♟️' },
  { href: '/settings', key: 'settings', icon: '⚙️' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-fg"
            onClick={() => setOpen(false)}
          >
            <span aria-hidden>♞</span>
            Master Chess
          </Link>

          <nav className="ml-auto hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-accent text-accent-fg'
                    : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-fg hover:bg-surface-2 sm:hidden"
            aria-label={t('menu')}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>

        {open && (
          <nav className="flex flex-col border-t border-border px-4 py-2 sm:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2 font-medium',
                  isActive(item.href) ? 'text-accent' : 'text-fg',
                )}
              >
                <span aria-hidden className="mr-2">
                  {item.icon}
                </span>
                {t(item.key)}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
