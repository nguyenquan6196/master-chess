'use client';

import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { rankTitle } from '@/components/ui/RankBadge';
import { RankEmblem } from '@/components/ui/RankEmblem';
import type { Profile } from '@/core/profile/schema';
import { RANKS, rankStatus } from '@/core/rating/rank';

/** Rank, tier progress and promotion match call-to-action (spec §6.7, temporary UI). */
export function RankCard({ profile }: { profile: Profile }) {
  const tk = useTranslations('ranking');
  const tr = useTranslations('rank');
  const tb = useTranslations('bots');
  const status = rankStatus(profile.gameRating.rating, profile.rankFloor);
  const rank = RANKS[status.rankIndex];
  const promotion = status.promotionTo !== null ? RANKS[status.promotionTo] : null;
  const percent = Math.round((status.progress / status.tierSize) * 100);

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold">🏆 {tk('title')}</h2>
      <div className="flex items-center gap-4">
        <RankEmblem rank={rank.id} size={96} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-bold">{rankTitle(status, tr(rank.id))}</p>
          <p className="text-sm text-muted tabular-nums">
            {tk('rating', { rating: Math.round(profile.gameRating.rating) })}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={status.progress}
              aria-valuemin={0}
              aria-valuemax={status.tierSize}
            >
              <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs font-semibold text-muted tabular-nums">
              {tk('progress', { progress: status.progress, size: status.tierSize })}
            </span>
          </div>
        </div>
      </div>
      <ol className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-surface-2 p-2">
        {RANKS.map((r, i) => (
          <li
            key={r.id}
            title={tr(r.id)}
            className={cn(
              'grid place-items-center transition-opacity',
              i !== status.rankIndex && 'opacity-35 grayscale',
            )}
          >
            <RankEmblem
              rank={r.id}
              size={i === status.rankIndex ? 52 : 42}
              animated={i === status.rankIndex}
            />
          </li>
        ))}
      </ol>
      {promotion && (
        <Link
          href="/play/bot"
          className="rounded-xl border-2 border-accent px-4 py-3 text-sm font-semibold hover:bg-surface-2"
        >
          ⚔️ {tk('promotionTitle')}{' '}
          <span className="font-normal text-muted">
            {tk('promotionDesc', { rank: tr(promotion.id), bot: tb(`${promotion.boss}.name`) })}
          </span>
        </Link>
      )}
    </Card>
  );
}
