'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { useSession } from '@/services/profile/session';
import { LanguageSelect } from './LanguageSelect';
import { MobileMenu } from './MobileMenu';
import { SettingsFab } from './SettingsFab';

const NAV_ITEMS = [
  { href: '/learn', key: 'learn', icon: '📖' },
  { href: '/practice', key: 'practice', icon: '🧩' },
  { href: '/play', key: 'play', icon: '♟️' },
] as const;

export function AppShell({ children, settings }: { children: ReactNode; settings: ReactNode }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const profile = useSession((s) => s.profile);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-display text-xl font-bold whitespace-nowrap text-fg"
            aria-label="Master Chess"
          >
            <span aria-hidden className="text-2xl">
              ♞
            </span>
            {/* Narrow phones: icon only, leaving room for the language and player buttons. */}
            <span className="hidden min-[440px]:inline">Master Chess</span>
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

          <div className="ml-auto flex items-center gap-2 sm:ml-2">
            <LanguageSelect />
            {profile && (
              <Link
                href="/profile"
                title={t('profile')}
                className={cn(
                  'flex max-w-40 items-center gap-2 rounded-full border px-2 py-1 text-sm font-semibold',
                  isActive('/profile') ? 'border-accent' : 'border-border hover:bg-surface-2',
                )}
              >
                <span aria-hidden>{profile.avatar}</span>
                <span className="hidden truncate md:inline">{profile.name}</span>
              </Link>
            )}
          </div>

          <MobileMenu items={NAV_ITEMS} isActive={isActive} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24">{children}</main>
      <SettingsFab>{settings}</SettingsFab>
    </>
  );
}
