import { rankColors } from '@/components/ui/RankEmblem';
import type { RankId } from '@/core/rating/rank';

/**
 * A bot's strength on its player card: the Elo on a plate in the metal of the rank the
 * bot guards (the card's frame shares it), or a plain number for the custom bot.
 */
export function BossElo({
  elo,
  rank,
  title,
}: {
  elo: number;
  rank: RankId | null;
  title?: string;
}) {
  if (!rank) {
    return (
      <span className="rounded-lg bg-surface-2 px-2.5 py-1 font-display text-lg font-bold tabular-nums">
        {elo}
      </span>
    );
  }
  const c = rankColors(rank);
  return (
    <span
      title={title}
      className="rounded-lg border px-2.5 py-0.5 font-display text-lg font-bold tabular-nums"
      style={{
        color: c.ink,
        borderColor: c.dark,
        background: `linear-gradient(160deg, ${c.face}, ${c.light} 45%, ${c.dark})`,
        textShadow: `0 1px 0 ${c.face}`,
      }}
    >
      {elo}
    </span>
  );
}
