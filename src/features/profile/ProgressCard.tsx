'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import type { Profile } from '@/core/profile/schema';
import { ACHIEVEMENTS, levelFor, liveStreak } from '@/core/progress/progress';

/** Level and XP, daily streak and the achievement grid on the profile page. */
export function ProgressCard({ profile }: { profile: Profile }) {
  const t = useTranslations('progress');
  const ta = useTranslations('achievements');
  const [now] = useState(() => Date.now());
  const lv = levelFor(profile.xp);
  const streak = liveStreak(profile.streak, now);
  const unlocked = ACHIEVEMENTS.filter((a) => a.id in profile.achievements).length;
  /** Achievement ids are data; their messages are checked by core/progress tests. */
  const tDyn = ta as unknown as (key: string) => string;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent font-display text-2xl font-bold text-accent-fg"
        >
          {lv.level}
        </span>
        <div className="min-w-40 flex-1">
          <p className="font-display text-xl font-bold">{t('level', { level: lv.level })}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.round((lv.into / lv.needed) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted tabular-nums">
            {t('xp', { into: lv.into, needed: lv.needed })} · {t('totalXp', { xp: profile.xp })}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 px-4 py-2 text-center">
          <p className="font-display text-2xl font-bold">🔥 {streak}</p>
          <p className="text-xs text-muted">
            {streak > 0 ? t('streak', { days: streak }) : t('noStreak')}
          </p>
          {profile.streak.best > 0 && (
            <p className="text-xs text-muted">{t('streakBest', { days: profile.streak.best })}</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center justify-between font-display text-lg font-semibold">
          🏅 {t('achievements')}
          <span className="text-sm font-normal text-muted tabular-nums">
            {t('progress', { done: unlocked, total: ACHIEVEMENTS.length })}
          </span>
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = a.id in profile.achievements;
            return (
              <li
                key={a.id}
                title={got ? undefined : t('locked')}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-2',
                  got ? 'border-accent bg-surface' : 'border-border bg-surface-2 opacity-55',
                )}
              >
                <span className={cn('text-2xl', !got && 'grayscale')} aria-hidden>
                  {a.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {tDyn(`${a.id}.name`)}
                  </span>
                  <span className="block text-xs text-muted">{tDyn(`${a.id}.desc`)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
