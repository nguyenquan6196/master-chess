'use client';

import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
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
    <div className="flex flex-col gap-6">
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => (
          <li key={m.href}>
            <Link href={m.href} className="group block h-full">
              <Card className="h-full transition-transform group-hover:-translate-y-1">
                <p className="text-3xl" aria-hidden>
                  {m.icon}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold">{t(m.title)}</h2>
                <p className="mt-1 text-sm text-muted">{t(m.desc)}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
