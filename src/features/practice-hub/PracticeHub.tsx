'use client';

import { useTranslations } from 'use-intl';
import { MenuTile } from '@/components/ui/MenuTile';
import { useSession } from '@/services/profile/session';

const MODES = [
  { href: '/practice/rated', title: 'rated', desc: 'ratedDesc', icon: '🧩' },
  { href: '/practice/themes', title: 'themes', desc: 'themesDesc', icon: '🎯' },
  { href: '/practice/rush', title: 'rush', desc: 'rushDesc', icon: '⚡' },
  { href: '/practice/daily', title: 'daily', desc: 'dailyDesc', icon: '📅' },
  { href: '/practice/quiz', title: 'quiz', desc: 'quizDesc', icon: '📝' },
] as const;

export function PracticeHub() {
  const t = useTranslations('practice');
  const rating = useSession((s) => s.profile?.puzzleRating.rating);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        {rating !== undefined && (
          <p className="text-sm text-muted">
            {t('yourRating')}:{' '}
            <span className="font-display text-xl font-bold text-fg tabular-nums">
              {Math.round(rating)}
            </span>
          </p>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m, i) => (
          <li key={m.href}>
            <MenuTile
              href={m.href}
              icon={m.icon}
              title={t(m.title)}
              desc={t(m.desc)}
              primary={i === 0}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
