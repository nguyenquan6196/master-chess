import { describe, expect, it } from 'vitest';
import { START_FEN } from '../chess/game';
import { MATE_CP } from '../engine/uci';
import { buildReview, classify, moveAccuracy, retryableMoves, REVIEW, winPercent } from './review';

describe('core/review', () => {
  it('maps centipawns to win% like Lichess', () => {
    expect(winPercent(0)).toBe(50);
    expect(winPercent(300)).toBeGreaterThan(70);
    expect(winPercent(-300)).toBeLessThan(30);
    expect(winPercent(MATE_CP)).toBeGreaterThan(99);
  });

  it('gives 100% accuracy for no loss and less for big losses', () => {
    expect(moveAccuracy(0)).toBeCloseTo(100, 0);
    expect(moveAccuracy(30)).toBeLessThan(30);
  });

  it('classifies by win% given away', () => {
    expect(classify(0, true)).toBe('best');
    expect(classify(2, false)).toBe('good');
    expect(classify(REVIEW.inaccuracy, false)).toBe('inaccuracy');
    expect(classify(REVIEW.mistake, false)).toBe('mistake');
    expect(classify(REVIEW.blunder, false)).toBe('blunder');
  });

  it("builds a review from engine data (Fool's mate: Black is perfect, White blunders)", () => {
    const moves = ['f2f3', 'e7e5', 'g2g4', 'd8h4'];
    const review = buildReview(START_FEN, moves, {
      depth: 12,
      evals: [20, -20, -30, -MATE_CP + 1, -MATE_CP],
      best: ['e2e4', 'e7e5', 'e2e4', 'd8h4', null],
    });
    expect(review.moves.map((m) => m.san)).toEqual(['f3', 'e5', 'g4', 'Qh4#']);
    expect(review.moves.map((m) => m.cls)).toEqual(['good', 'best', 'blunder', 'best']);
    expect(review.moves[2].bestSan).toBe('e4');
    expect(review.accuracy.b).toBeGreaterThan(review.accuracy.w);
    expect(review.counts.w.blunder).toBe(1);
    expect(review.whiteWin).toHaveLength(5);
    expect(retryableMoves(review, 'w').map((m) => m.san)).toEqual(['g4']);
    expect(retryableMoves(review, 'b')).toEqual([]);
  });
});
