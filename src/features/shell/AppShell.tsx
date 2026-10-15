'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { BoardPrefsProvider } from '@/components/board/BoardPrefs';
import { BackdropParticles } from '@/components/ui/BackdropParticles';
import { cn } from '@/components/ui/cn';
import { rankTitle } from '@/components/ui/RankBadge';
import { RankEmblem } from '@/components/ui/RankEmblem';
import { RANKS, rankStatus } from '@/core/rating/rank';
import { useSession } from '@/services/profile/session';
import { useMusicDirector } from '@/services/audio/musicDirector';
import { useSettings } from '@/services/settings/store';
import { THEME_INFO } from '@/services/theme/appearance';
import { useResolvedTheme } from '@/services/theme/useResolvedTheme';
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
  const pieceSet = useSettings((s) => s.pieceSet);
  const moveAnimation = useSettings((s) => s.moveAnimation);
  useMusicDirector(pathname);
  const muted = useSettings((s) => s.muted);
  const toggleMute = () => useSettings.getState().update({ muted: !muted });
  const resolvedTheme = useResolvedTheme();
  const backdropMotion = useSettings((s) => s.backdropMotion);
  const backdrop = useSettings((s) => s.backdrop);
  const particles =
    backdropMotion && backdrop === 'theme' ? THEME_INFO[resolvedTheme].particles : null;
  const boardPrefs = useMemo(() => ({ pieceSet, moveAnimation }), [pieceSet, moveAnimation]);
  const tr = useTranslations('rank');
  const rank = profile ? rankStatus(profile.gameRating.rating, profile.rankFloor) : null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {particles && <BackdropParticles key={resolvedTheme} kind={particles} />}
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
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? t('unmute') : t('mute')}
              title={muted ? t('unmute') : t('mute')}
              className="grid size-9 place-items-center rounded-full border border-border text-base hover:bg-surface-2"
            >
              <span aria-hidden>{muted ? '🔇' : '🔊'}</span>
            </button>
            <LanguageSelect />
            {profile && (
              <Link
                href="/profile"
                title={
                  rank
                    ? `${t('profile')} · ${rankTitle(rank, tr(RANKS[rank.rankIndex].id))}`
                    : t('profile')
                }
                className={cn(
                  'flex max-w-48 items-center gap-2 rounded-full border px-2 py-1 text-sm font-semibold',
                  isActive('/profile') ? 'border-accent' : 'border-border hover:bg-surface-2',
                )}
              >
                <span aria-hidden>{profile.avatar}</span>
                <span className="hidden truncate md:inline">{profile.name}</span>
                {rank && <RankEmblem rank={RANKS[rank.rankIndex].id} size={22} animated={false} />}
              </Link>
            )}
          </div>

          <MobileMenu items={NAV_ITEMS} isActive={isActive} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24">
        <BoardPrefsProvider value={boardPrefs}>{children}</BoardPrefsProvider>
      </main>
      <SettingsFab>
        <BoardPrefsProvider value={boardPrefs}>{settings}</BoardPrefsProvider>
      </SettingsFab>
    </>
  );
}
