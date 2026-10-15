import { BOT_LEVELS, type BotId } from './levels';

/** Tuning for the "suggested opponent" (spec §6.3 adaptive difficulty). */
export const SUGGEST = {
  /** Aim slightly above the player's rating so wins feel earned. */
  targetOffset: 50,
  /** Each win in the current streak raises the target, each loss lowers it. */
  streakStep: 100,
  maxStreak: 3,
} as const;

export interface RecentResult {
  result: 'win' | 'loss' | 'draw';
}

/** Current streak from the most recent game: +n wins, −n losses, 0 after a draw/none. */
export function resultStreak(recentFirst: readonly RecentResult[]): number {
  const first = recentFirst[0]?.result;
  if (!first || first === 'draw') return 0;
  let n = 0;
  for (const g of recentFirst) {
    if (g.result !== first) break;
    n++;
  }
  return first === 'win' ? n : -n;
}

/**
 * The ladder bot closest to the player's level, nudged up after a winning streak and
 * down after a losing one. `recentFirst`: finished games, newest first.
 */
export function suggestBot(rating: number, recentFirst: readonly RecentResult[]): BotId {
  const streak = Math.max(
    -SUGGEST.maxStreak,
    Math.min(SUGGEST.maxStreak, resultStreak(recentFirst)),
  );
  const target = rating + SUGGEST.targetOffset + streak * SUGGEST.streakStep;
  let best = BOT_LEVELS[0];
  for (const b of BOT_LEVELS) {
    if (Math.abs(b.elo - target) < Math.abs(best.elo - target)) best = b;
  }
  return best.id;
}
