import type { Rng } from '../bot/choose';
import type { Puzzle } from './types';

/** Rating windows tried in order when looking for an unseen puzzle near the target. */
const SEARCH_WINDOWS = [75, 150, 300, 600];

/** Picks an unseen puzzle close to `targetRating` (random within the closest window). */
export function pickPuzzle(
  candidates: readonly Puzzle[],
  targetRating: number,
  seen: ReadonlySet<string>,
  rng: Rng = Math.random,
): Puzzle | null {
  const unseen = candidates.filter((p) => !seen.has(p.id));
  const pool = unseen.length > 0 ? unseen : candidates;
  for (const w of SEARCH_WINDOWS) {
    const near = pool.filter((p) => Math.abs(p.rating - targetRating) <= w);
    if (near.length > 0) return near[Math.floor(rng() * near.length)];
  }
  // Nothing close: take the nearest one.
  let best: Puzzle | null = null;
  for (const p of pool) {
    if (!best || Math.abs(p.rating - targetRating) < Math.abs(best.rating - targetRating)) best = p;
  }
  return best;
}

/** Day key in local time, e.g. "2026-10-14". */
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Stable index for "puzzle of the day": same for everyone on the same date. */
export function dailyIndex(day: string, count: number): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % Math.max(count, 1);
}
