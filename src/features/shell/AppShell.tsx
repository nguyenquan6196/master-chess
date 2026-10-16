'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { BoardPrefsProvider } from '@/components/board/BoardPrefs';
import { BackdropParticles } from '@/components/ui/BackdropParticles';
import { cn } from '@/components/ui/cn';
import { HudSlot, HudSlotProvider } from '@/components/ui/PageHeader';
import { rankTitle } from '@/components/ui/RankBadge';
import { RankEmblem } from '@/components/ui/RankEmblem';
import { resolvePieceSet } from '@/core/profile/settingsOptions';
import { levelFor, liveStreak } from '@/core/progress/progress';
import { RANKS, rankStatus } from '@/core/rating/rank';
import { useMusicDirector } from '@/services/audio/musicDirector';
import { useSession } from '@/services/profile/session';
import { useSettings } from '@/services/settings/store';
import { THEME_INFO } from '@/services/theme/appearance';
import { useResolvedTheme } from '@/services/theme/useResolvedTheme';
import { HudIconButton } from './HudIconButton';
import { LanguageSelect } from './LanguageSelect';
import { SettingsButton } from './SettingsButton';
import { Toaster } from './Toaster';

/**
 * Game-style shell (Phase 5.5): no website navigation bar. A light HUD floats over the
 * scene — the player card on the lobby, a home button elsewhere followed by the page's `PageHeader` —
 * with sound, language and settings icons on the right.
 */
export function AppShell({ children, settings }: { children: ReactNode; settings: ReactNode }) {
  const t = useTranslations('nav');
  const tp = useTranslations('progress');
  const tr = useTranslations('rank');
  const pathname = usePathname();
  const profile = useSession((s) => s.profile);
  const pieceSet = useSettings((s) => s.pieceSet);
  const moveAnimation = useSettings((s) => s.moveAnimation);
  useMusicDirector(pathname);
  const muted = useSettings((s) => s.muted);
  const resolvedTheme = useResolvedTheme();
  const backdropMotion = useSettings((s) => s.backdropMotion);
  const backdrop = useSettings((s) => s.backdrop);
  const particles =
    backdropMotion && backdrop === 'theme' ? THEME_INFO[resolvedTheme].particles : null;
  const boardPieces = resolvePieceSet(pieceSet, resolvedTheme);
  const boardPrefs = useMemo(
    () => ({ pieceSet: boardPieces, moveAnimation }),
    [boardPieces, moveAnimation],
  );
  const [now] = useState(() => Date.now());

  const isLobby = pathname === '/';
  const rank = profile ? rankStatus(profile.gameRating.rating, profile.rankFloor) : null;
  const rankId = rank ? RANKS[rank.rankIndex].id : null;
  const rankLabel = rank ? rankTitle(rank, tr(RANKS[rank.rankIndex].id)) : '';

  return (
    <HudSlotProvider>
      {particles && <BackdropParticles key={resolvedTheme} kind={particles} />}
      <Toaster />
      <header className="sticky top-0 z-30 bg-linear-to-b from-bg via-bg/85 to-transparent pb-2">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-3 pt-3 sm:flex-nowrap sm:px-4">
          {isLobby && profile ? (
            <Link
              href="/profile"
              title={`${t('profile')} · ${rankLabel}`}
              className="mc-press flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface/90 py-1.5 pr-3 pl-1.5 shadow-card backdrop-blur hover:bg-surface"
            >
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl"
              >
                {profile.avatar}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display font-bold">{profile.name}</span>
                <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted">
                  {tp('level', { level: levelFor(profile.xp).level })}
                  <span aria-hidden>·</span>🔥 {liveStreak(profile.streak, now)}
                </span>
              </span>
              {rankId && <RankEmblem rank={rankId} size={40} animated={false} title={rankLabel} />}
            </Link>
          ) : !isLobby ? (
            <>
              <Link
                href="/"
                aria-label={t('home')}
                title={t('home')}
                className="mc-press grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-lg shadow-card hover:bg-surface-2"
              >
                <span aria-hidden className="text-base">
                  🏠
                </span>
              </Link>
              <HudSlot className="order-last flex w-full min-w-0 items-center gap-2 sm:order-none sm:w-auto sm:flex-1" />
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <HudIconButton
              label={muted ? t('unmute') : t('mute')}
              aria-pressed={muted}
              onClick={() => useSettings.getState().update({ muted: !muted })}
            >
              <span aria-hidden className="text-base">
                {muted ? '🔇' : '🔊'}
              </span>
            </HudIconButton>
            <LanguageSelect />
            <SettingsButton>
              <BoardPrefsProvider value={boardPrefs}>{settings}</BoardPrefsProvider>
            </SettingsButton>
            {!isLobby && profile && (
              <Link
                href="/profile"
                aria-label={t('profile')}
                title={`${profile.name} · ${rankLabel}`}
                className={cn(
                  'mc-press hidden h-10 items-center gap-1 rounded-full border bg-surface pr-1 pl-2 shadow-card hover:bg-surface-2 sm:flex',
                  pathname.startsWith('/profile') ? 'border-accent' : 'border-border',
                )}
              >
                <span aria-hidden className="text-lg">
                  {profile.avatar}
                </span>
                {rankId && <RankEmblem rank={rankId} size={34} animated={false} />}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main
        key={pathname.split('/').slice(0, 3).join('/')}
        className={cn(
          'mc-scene mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pt-2 pb-6 sm:px-4',
          isLobby && 'justify-center',
        )}
      >
        <BoardPrefsProvider value={boardPrefs}>{children}</BoardPrefsProvider>
      </main>
    </HudSlotProvider>
  );
}
