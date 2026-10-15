import { RANKS, type RankId, type RankStatus } from '@/core/rating/rank';
import { cn } from './cn';

/** Temporary emblem until the SVG shields of Phase 5: the rank's centre piece. */
export const RANK_ICONS: Record<RankId, string> = {
  bronze: '♟',
  silver: '♞',
  gold: '♝',
  platinum: '♜',
  diamond: '♛',
  elite: '♚',
  grandmaster: '👑',
  challenger: '🏆',
};

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
      <span aria-hidden>{RANK_ICONS[RANKS[status.rankIndex].id]}</span>
      {rankTitle(status, rankName)}
    </span>
  );
}
