import type { SampledStrategy } from './levels';

export interface Candidate {
  /** UCI move, e.g. "e2e4". */
  move: string;
  /** Engine score in centipawns from the bot's point of view (mates already converted). */
  scoreCp: number;
}

/** Random source in [0, 1); injectable so tests are deterministic. */
export type Rng = () => number;

/**
 * Picks a move for a "sampled" (weak) bot: sometimes a random legal move, otherwise a
 * softmax draw over the engine's candidates weighted by how close they are to the best.
 */
export function chooseSampledMove(
  candidates: readonly Candidate[],
  legalMoves: readonly string[],
  strategy: Pick<SampledStrategy, 'randomMoveRate' | 'temperatureCp'>,
  rng: Rng = Math.random,
): string {
  if (legalMoves.length === 0) throw new Error('No legal moves');
  if (candidates.length === 0 || rng() < strategy.randomMoveRate) {
    return legalMoves[Math.floor(rng() * legalMoves.length)];
  }

  const best = Math.max(...candidates.map((c) => c.scoreCp));
  const temperature = Math.max(strategy.temperatureCp, 1);
  const weights = candidates.map((c) => Math.exp((c.scoreCp - best) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);

  let r = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].move;
  }
  return candidates[candidates.length - 1].move;
}

/** Uniform delay within [min, max]. */
export function thinkDelayMs(range: readonly [number, number], rng: Rng = Math.random): number {
  const [min, max] = range;
  return Math.round(min + (max - min) * rng());
}

/** Small seeded PRNG (mulberry32) for reproducible tests and calibration runs. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
