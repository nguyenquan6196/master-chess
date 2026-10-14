import { describe, expect, it } from 'vitest';
import { newRating, updateRating, winProbability } from './glicko2';

describe('core/rating/glicko2', () => {
  it("matches Glickman's worked example", () => {
    const r = updateRating({ rating: 1500, rd: 200, vol: 0.06 }, [
      { opponent: { rating: 1400, rd: 30 }, score: 1 },
      { opponent: { rating: 1550, rd: 100 }, score: 0 },
      { opponent: { rating: 1700, rd: 300 }, score: 0 },
    ]);
    expect(r.rating).toBeCloseTo(1464.06, 1);
    expect(r.rd).toBeCloseTo(151.52, 1);
    expect(r.vol).toBeCloseTo(0.05999, 4);
  });

  it('raises the rating after a win and lowers it after a loss', () => {
    const start = newRating(1000, 200);
    const opp = { rating: 1000, rd: 80 };
    expect(updateRating(start, [{ opponent: opp, score: 1 }]).rating).toBeGreaterThan(1000);
    expect(updateRating(start, [{ opponent: opp, score: 0 }]).rating).toBeLessThan(1000);
  });

  it('moves more when uncertain', () => {
    const opp = { rating: 1200, rd: 80 };
    const fresh = updateRating(newRating(1200, 350), [{ opponent: opp, score: 1 }]);
    const settled = updateRating(newRating(1200, 60), [{ opponent: opp, score: 1 }]);
    expect(fresh.rating - 1200).toBeGreaterThan(settled.rating - 1200);
  });

  it('grows RD when inactive and keeps it within bounds', () => {
    const r = updateRating(newRating(1500, 50), []);
    expect(r.rd).toBeGreaterThan(50);
    expect(updateRating(newRating(1500, 350), []).rd).toBe(350);
  });

  it('computes win probabilities', () => {
    expect(winProbability({ rating: 1500, rd: 50 }, { rating: 1500, rd: 50 })).toBeCloseTo(0.5, 5);
    expect(winProbability({ rating: 1900, rd: 50 }, { rating: 1500, rd: 50 })).toBeGreaterThan(
      0.85,
    );
  });
});
