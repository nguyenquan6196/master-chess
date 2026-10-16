import { RANKS, type RankStatus } from '@/core/rating/rank';
import { cn } from './cn';
import { RankEmblem } from './RankEmblem';

const ROMAN = { 1: 'I', 2: 'II', 3: 'III' } as const;

/** "Gold II" — `rankName` is the translated name of `status.rankIndex`. */
export function rankTitle(status: RankStatus, rankName: string): string {
  return RANKS[status.rankIndex].tiers > 1 ? `${rankName} ${ROMAN[status.tier]}` : rankName;
}

/** Small pill: emblem + rank title. */
export function RankBadge({
  status,
  rankName,
  className,
}: {
  status: RankStatus;
  rankName: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold',
        className,
      )}
    >
      <RankEmblem rank={RANKS[status.rankIndex].id} size={22} animated={false} />
      {rankTitle(status, rankName)}
    </span>
  );
}
