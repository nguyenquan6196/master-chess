'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import { resolveBotLevel } from '@/core/bot/levels';
import { gameRepo } from '@/services/db/repositories';
import { useSession } from '@/services/profile/session';

const MODES = [
  { href: '/play', title: 'nav.play', desc: 'home.playDesc', icon: '♟️', primary: true },
  {
    href: '/practice',
    title: 'nav.practice',
    desc: 'home.practiceDesc',
    icon: '🧩',
    primary: false,
  },
  { href: '/learn', title: 'nav.learn', desc: 'home.learnDesc', icon: '📖', primary: false },
] as const;

const SHORTCUTS = [
  { href: '/history', key: 'nav.history', icon: '🕘' },
  { href: '/profile', key: 'nav.profile', icon: '🏆' },
  { href: '/guide', key: 'nav.guide', icon: '📘' },
] as const;

/** The lobby (main menu): big mode tiles instead of a website navigation bar. */
export function HomeScreen() {
  const t = useTranslations();
  const profileId = useSession((s) => s.profile?.id);
  const ongoing = useLiveQuery(
    () => (profileId ? gameRepo.getOngoing(profileId) : Promise.resolve(undefined)),
    [profileId],
  );
  const ongoingLevel = ongoing ? resolveBotLevel(ongoing.botId, ongoing.customElo) : null;

  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span
          aria-hidden
          className="mc-float grid size-20 place-items-center rounded-3xl bg-accent text-5xl text-accent-fg shadow-card"
        >
          ♞
        </span>
        <p className="font-display text-4xl font-bold sm:text-5xl">Master Chess</p>
        <h1 className="max-w-md text-sm font-semibold text-muted">{t('home.title')}</h1>
      </div>

      {ongoing && ongoingLevel && (
        <Link
          href="/play/bot"
          className="mc-press flex items-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 py-2 shadow-card hover:bg-surface-2"
        >
          <span aria-hidden className="text-3xl">
            {ongoingLevel.emoji}
          </span>
          <span className="text-left">
            <span className="block font-display font-bold">▶ {t('botGame.continue')}</span>
            <span className="block text-xs text-muted">
              {t('botGame.continueDesc', {
                bot: t(`bots.${ongoing.botId}.name`),
                count: Math.ceil(ongoing.moves.length / 2),
              })}
            </span>
          </span>
        </Link>
      )}

      <ul className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {MODES.map((m) => (
          <li key={m.href}>
            <Link
              href={m.href}
              className={cn(
                'mc-press group flex h-full items-center gap-4 rounded-3xl border p-4 text-left shadow-card transition-transform hover:-translate-y-1 sm:flex-col sm:justify-center sm:p-6 sm:text-center',
                m.primary
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-border bg-surface hover:border-accent',
              )}
            >
              <span aria-hidden className="text-4xl sm:text-6xl">
                {m.icon}
              </span>
              <span>
                <span className="block font-display text-2xl font-bold">{t(m.title)}</span>
                <span className={cn('block text-sm', m.primary ? 'opacity-90' : 'text-muted')}>
                  {t(m.desc)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <nav className="flex flex-wrap justify-center gap-2" aria-label={t('nav.menu')}>
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="mc-press flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold shadow-card hover:bg-surface-2"
          >
            <span aria-hidden>{s.icon}</span>
            {t(s.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
