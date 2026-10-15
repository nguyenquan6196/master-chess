import type { BotId } from '../bot/levels';
import { updateRating, type Rating, type Score } from './glicko2';

/**
 * Player rank ladder (spec §6.7). The rank is a title earned by beating the "boss" bot
 * that guards it; inside a rank the tier (III → II → I) follows the game rating.
 * Display names live in messages under `rank.<id>`.
 */
export const RANK_IDS = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'elite',
  'grandmaster',
  'challenger',
] as const;
export type RankId = (typeof RANK_IDS)[number];

export interface RankDef {
  id: RankId;
  /** Rating where the rank starts (Bronze: where its tier III starts). */
  min: number;
  /** Number of tiers (III · II · I); 1 = no tiers. */
  tiers: 1 | 3;
  /** The bot that must be beaten to enter this rank. */
  boss: BotId;
}

/** Each rank spans RANK_WIDTH rating points (the last one is open-ended). */
export const RANK_WIDTH = 300;

export const RANKS: readonly RankDef[] = [
  { id: 'bronze', min: 300, tiers: 3, boss: 'chick' },
  { id: 'silver', min: 600, tiers: 3, boss: 'turtle' },
  { id: 'gold', min: 900, tiers: 3, boss: 'fox' },
  { id: 'platinum', min: 1200, tiers: 3, boss: 'wolf' },
  { id: 'diamond', min: 1500, tiers: 3, boss: 'lion' },
  { id: 'elite', min: 1800, tiers: 3, boss: 'eagle' },
  { id: 'grandmaster', min: 2100, tiers: 1, boss: 'dragon' },
  { id: 'challenger', min: 2400, tiers: 1, boss: 'master' },
];

export const GAME_RATING = {
  /** New players start in Bronze II with high uncertainty so early games move fast. */
  initial: { rating: 400, rd: 350, vol: 0.06 } satisfies Rating,
  /** Bots are treated as well-known opponents. */
  botRd: 60,
} as const;

/** Highest rank whose rating range the rating reaches (ignores promotion matches). */
export function rankIndexForRating(rating: number): number {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (rating >= RANKS[i].min) idx = i;
  return idx;
}

export const bossRankIndex = (botId: BotId): number => RANKS.findIndex((r) => r.boss === botId);

export interface RankStatus {
  /** Index into RANKS: the rank the player holds (= rankFloor). */
  rankIndex: number;
  /** 3 = III … 1 = I; 1 for ranks without tiers. */
  tier: 1 | 2 | 3;
  /** Points inside the current tier, 0 … tierSize. */
  progress: number;
  tierSize: number;
  /** Rank the player has qualified for but must win a promotion match to enter. */
  promotionTo: number | null;
}

/**
 * Where the player stands. The rank itself only changes through promotion matches
 * (`rankFloor`); the tier follows the rating, clamped to the rank's range.
 */
export function rankStatus(rating: number, rankFloor: number): RankStatus {
  const rankIndex = Math.min(Math.max(rankFloor, 0), RANKS.length - 1);
  const rank = RANKS[rankIndex];
  const next = RANKS[rankIndex + 1];
  const width = next ? next.min - rank.min : RANK_WIDTH;
  const tierSize = Math.round(width / rank.tiers);
  const inRank = Math.min(Math.max(rating - rank.min, 0), width);
  const tierFromBottom = Math.min(Math.floor(inRank / tierSize), rank.tiers - 1);
  const tier = (rank.tiers - tierFromBottom) as 1 | 2 | 3;
  const progress = Math.min(inRank - tierFromBottom * tierSize, tierSize);
  const promotionTo = next && rating >= next.min ? rankIndex + 1 : null;
  return { rankIndex, tier, progress: Math.round(progress), tierSize, promotionTo };
}

export const resultScore = (result: 'win' | 'loss' | 'draw'): Score =>
  result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;

export interface RatedOutcome {
  rating: Rating;
  delta: number;
  rankFloor: number;
  /** Set when this game was a promotion match: did the player pass it? */
  promotion: { to: number; passed: boolean } | null;
}

/**
 * Applies one rated game vs a bot of strength `botElo`. A win against the boss of the
 * rank the player qualified for promotes them (the rank floor goes up by one).
 */
export function applyRatedGame(
  player: Rating,
  rankFloor: number,
  game: { botId: BotId | null; botElo: number; result: 'win' | 'loss' | 'draw' },
): RatedOutcome {
  const pending = rankStatus(player.rating, rankFloor).promotionTo;
  const rating = updateRating(player, [
    { opponent: { rating: game.botElo, rd: GAME_RATING.botRd }, score: resultScore(game.result) },
  ]);
  const delta = Math.round(rating.rating - player.rating);
  const isPromotionMatch =
    pending !== null && game.botId !== null && RANKS[pending].boss === game.botId;
  if (!isPromotionMatch) return { rating, delta, rankFloor, promotion: null };
  const passed = game.result === 'win';
  return {
    rating,
    delta,
    rankFloor: passed ? pending : rankFloor,
    promotion: { to: pending, passed },
  };
}

/** A game counts for rating only without hints or take-backs (spec §6.7). */
export const isRatedGame = (g: { hintsUsed: number; undosUsed: number }): boolean =>
  g.hintsUsed === 0 && g.undosUsed === 0;
