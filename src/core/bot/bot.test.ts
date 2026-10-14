import { describe, expect, it } from 'vitest';
import { chooseSampledMove, seededRng, thinkDelayMs, type Candidate } from './choose';
import { BOT_IDS, BOT_LEVELS, botAcceptsDraw, getBotLevel } from './levels';

const candidates: Candidate[] = [
  { move: 'e2e4', scoreCp: 40 },
  { move: 'd2d4', scoreCp: 35 },
  { move: 'g2g4', scoreCp: -150 },
];
const legal = ['e2e4', 'd2d4', 'g2g4', 'a2a3'];

function histogram(fn: () => string, n = 4000) {
  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const m = fn();
    counts[m] = (counts[m] ?? 0) + 1;
  }
  return counts;
}

describe('core/bot/levels', () => {
  it('defines every bot id exactly once, in ascending Elo', () => {
    expect(BOT_LEVELS.map((b) => b.id)).toEqual([...BOT_IDS]);
    const elos = BOT_LEVELS.map((b) => b.elo);
    expect([...elos].sort((a, b) => a - b)).toEqual(elos);
  });

  it('uses the Stockfish limiter only within its supported Elo range', () => {
    for (const b of BOT_LEVELS) {
      if (b.strategy.kind === 'limited') {
        expect(b.strategy.elo).toBeGreaterThanOrEqual(1320);
        expect(b.strategy.elo).toBeLessThanOrEqual(3190);
      }
    }
  });

  it('looks up levels by id', () => {
    expect(getBotLevel('fox').emoji).toBe('🦊');
  });

  it('accepts draws when worse or in long level games', () => {
    expect(botAcceptsDraw(-200, 10)).toBe(true);
    expect(botAcceptsDraw(0, 10)).toBe(false);
    expect(botAcceptsDraw(10, 80)).toBe(true);
    expect(botAcceptsDraw(300, 80)).toBe(false);
  });
});

describe('core/bot/choose', () => {
  it('is deterministic with a seeded rng', () => {
    const s = { randomMoveRate: 0.3, temperatureCp: 100 };
    const a = Array.from({ length: 20 }, (_, i) =>
      chooseSampledMove(candidates, legal, s, seededRng(i)),
    );
    const b = Array.from({ length: 20 }, (_, i) =>
      chooseSampledMove(candidates, legal, s, seededRng(i)),
    );
    expect(a).toEqual(b);
  });

  it('almost always plays near-best moves at low temperature and no randomness', () => {
    const rng = seededRng(1);
    const counts = histogram(() =>
      chooseSampledMove(candidates, legal, { randomMoveRate: 0, temperatureCp: 10 }, rng),
    );
    expect((counts.e2e4 ?? 0) + (counts.d2d4 ?? 0)).toBe(4000);
  });

  it('spreads choices more at high temperature', () => {
    const rng = seededRng(2);
    const counts = histogram(() =>
      chooseSampledMove(candidates, legal, { randomMoveRate: 0, temperatureCp: 300 }, rng),
    );
    expect(counts.g2g4).toBeGreaterThan(200);
  });

  it('plays random legal moves at the configured rate', () => {
    const rng = seededRng(3);
    const counts = histogram(() =>
      chooseSampledMove(candidates, legal, { randomMoveRate: 1, temperatureCp: 10 }, rng),
    );
    expect(counts.a2a3).toBeGreaterThan(800);
  });

  it('falls back to a legal move when the engine gave no candidates', () => {
    expect(legal).toContain(chooseSampledMove([], legal, { randomMoveRate: 0, temperatureCp: 50 }));
  });

  it('keeps think delays in range', () => {
    const rng = seededRng(4);
    for (let i = 0; i < 100; i++) {
      const d = thinkDelayMs([500, 1200], rng);
      expect(d).toBeGreaterThanOrEqual(500);
      expect(d).toBeLessThanOrEqual(1200);
    }
  });
});
