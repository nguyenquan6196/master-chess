import { describe, expect, it } from 'vitest';
import { BOT_LEVELS } from '../bot/levels';
import {
  applyRatedGame,
  bossRankIndex,
  GAME_RATING,
  isRatedGame,
  rankIndexForRating,
  RANKS,
  rankStatus,
} from './rank';

describe('core/rating/rank', () => {
  it('has one boss per rank, in ladder order', () => {
    expect(RANKS.map((r) => r.boss)).toEqual(BOT_LEVELS.map((b) => b.id));
    expect(bossRankIndex('fox')).toBe(2);
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min);
  });

  it('maps ratings to rank ranges', () => {
    expect(rankIndexForRating(100)).toBe(0);
    expect(rankIndexForRating(600)).toBe(1);
    expect(rankIndexForRating(1199)).toBe(2);
    expect(rankIndexForRating(2500)).toBe(7);
  });

  it('starts a new player in Bronze II with no promotion pending', () => {
    const s = rankStatus(GAME_RATING.initial.rating, 0);
    expect(s).toMatchObject({
      rankIndex: 0,
      tier: 2,
      progress: 0,
      tierSize: 100,
      promotionTo: null,
    });
  });

  it('computes tiers III → I and progress inside the tier', () => {
    expect(rankStatus(950, 2)).toMatchObject({ tier: 3, progress: 50 });
    expect(rankStatus(1050, 2)).toMatchObject({ tier: 2, progress: 50 });
    expect(rankStatus(1199, 2)).toMatchObject({ tier: 1, progress: 99 });
  });

  it('keeps the rank floor when the rating drops below it', () => {
    expect(rankStatus(700, 2)).toMatchObject({ rankIndex: 2, tier: 3, progress: 0 });
  });

  it('asks for a promotion match once the next rank is reached, capped at tier I', () => {
    const s = rankStatus(640, 0);
    expect(s).toMatchObject({ rankIndex: 0, tier: 1, progress: 100, promotionTo: 1 });
  });

  it('gives tierless ranks a single tier and no promotion beyond the top', () => {
    expect(rankStatus(2250, 6)).toMatchObject({ tier: 1, tierSize: 300, promotionTo: null });
    expect(rankStatus(3000, 7)).toMatchObject({ rankIndex: 7, promotionTo: null });
  });

  it('raises the rating after a win and lowers it after a loss', () => {
    const win = applyRatedGame(GAME_RATING.initial, 0, {
      botId: 'chick',
      botElo: 250,
      result: 'win',
    });
    const loss = applyRatedGame(GAME_RATING.initial, 0, {
      botId: 'chick',
      botElo: 250,
      result: 'loss',
    });
    expect(win.delta).toBeGreaterThan(0);
    expect(loss.delta).toBeLessThan(0);
    expect(win.promotion).toBeNull();
  });

  it('promotes on a win against the boss of the qualified rank only', () => {
    const player = { rating: 620, rd: 80, vol: 0.06 };
    const passed = applyRatedGame(player, 0, { botId: 'turtle', botElo: 500, result: 'win' });
    expect(passed.rankFloor).toBe(1);
    expect(passed.promotion).toEqual({ to: 1, passed: true });

    const failed = applyRatedGame(player, 0, { botId: 'turtle', botElo: 500, result: 'loss' });
    expect(failed.rankFloor).toBe(0);
    expect(failed.promotion).toEqual({ to: 1, passed: false });

    const otherBot = applyRatedGame(player, 0, { botId: 'fox', botElo: 800, result: 'win' });
    expect(otherBot.rankFloor).toBe(0);
    expect(otherBot.promotion).toBeNull();

    const custom = applyRatedGame(player, 0, { botId: null, botElo: 500, result: 'win' });
    expect(custom.promotion).toBeNull();
  });

  it('only rates games without hints or take-backs', () => {
    expect(isRatedGame({ hintsUsed: 0, undosUsed: 0 })).toBe(true);
    expect(isRatedGame({ hintsUsed: 1, undosUsed: 0 })).toBe(false);
    expect(isRatedGame({ hintsUsed: 0, undosUsed: 2 })).toBe(false);
  });
});
