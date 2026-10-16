'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import type { Profile } from '@/core/profile/schema';
import {
  ACHIEVEMENT_GROUPS,
  ACHIEVEMENTS,
  levelFor,
  liveStreak,
  type AchievementGroup,
} from '@/core/progress/progress';

/** Level and XP, daily streak and the achievement grid on the profile page. */
export function ProgressCard({ profile }: { profile: Profile }) {
  const t = useTranslations('progress');
  const ta = useTranslations('achievements');
  const [now] = useState(() => Date.now());
  const [group, setGroup] = useState<AchievementGroup>('learn');
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
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-accent transition-[width] duration-[var(--mc-dur-slow)]"
            style={{ width: `${(unlocked / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
        <div role="tablist" aria-label={t('achievements')} className="mb-3 flex flex-wrap gap-1.5">
          {ACHIEVEMENT_GROUPS.map((g) => {
            const list = ACHIEVEMENTS.filter((a) => a.group === g);
            const got = list.filter((a) => a.id in profile.achievements).length;
            return (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={group === g}
                onClick={() => setGroup(g)}
                className={cn(
                  'mc-press flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold',
                  group === g
                    ? 'border-accent bg-[color-mix(in_srgb,var(--mc-accent)_14%,var(--mc-surface))] text-fg'
                    : 'border-border bg-surface text-muted hover:text-fg',
                )}
              >
                {t(`groups.${g}`)}
                <span className="text-xs font-normal tabular-nums">
                  {got}/{list.length}
                </span>
              </button>
            );
          })}
        </div>
        <ul
          key={group}
          role="tabpanel"
          className="mc-pop grid max-h-[30rem] grid-cols-1 gap-2 overflow-y-auto p-0.5 pr-1 min-[420px]:grid-cols-2 xl:grid-cols-3"
        >
          {ACHIEVEMENTS.filter((a) => a.group === group).map((a) => {
            const has = a.id in profile.achievements;
            return (
              <li
                key={a.id}
                title={has ? undefined : t('locked')}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-2 transition-colors',
                  has
                    ? 'border-accent bg-surface shadow-card'
                    : 'border-dashed border-border bg-surface-2/60',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-full text-xl',
                    has ? 'bg-accent/15 ring-2 ring-accent' : 'bg-surface opacity-50 grayscale',
                  )}
                >
                  {a.icon}
                </span>
                <span className={cn('min-w-0', !has && 'opacity-70')}>
                  <span className="block truncate text-sm font-semibold">
                    {tDyn(`${a.id}.name`)}
                  </span>
                  <span className="block text-xs leading-snug text-muted">
                    {tDyn(`${a.id}.desc`)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
