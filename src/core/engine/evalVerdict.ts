import type { EngineScore } from './uci';

/** Centipawn thresholds (White's view) for the plain-words verdict under the eval gauge. */
export const EVAL_VERDICT_CP = {
  /** Below this either way the position counts as level. */
  equal: 50,
  /** From here one side is clearly better. */
  clear: 150,
  /** From here one side should win with good play. */
  winning: 400,
} as const;

export type EvalLevel = 'equal' | 'slight' | 'clear' | 'winning' | 'mate';

export interface EvalVerdict {
  level: EvalLevel;
  /** The side that is better (null when level). */
  side: 'w' | 'b' | null;
  /** Moves to mate (level `mate` only). */
  mateIn?: number;
}

/** A short verdict for a White-POV engine score (null while unknown or after mate). */
export function evalVerdict(score: EngineScore | null): EvalVerdict | null {
  if (!score) return null;
  if (score.kind === 'mate') {
    if (score.value === 0) return null;
    return { level: 'mate', side: score.value > 0 ? 'w' : 'b', mateIn: Math.abs(score.value) };
  }
  const cp = Math.abs(score.value);
  const side = score.value > 0 ? 'w' : 'b';
  if (cp < EVAL_VERDICT_CP.equal) return { level: 'equal', side: null };
  if (cp < EVAL_VERDICT_CP.clear) return { level: 'slight', side };
  if (cp < EVAL_VERDICT_CP.winning) return { level: 'clear', side };
  return { level: 'winning', side };
}

/** Each verdict has a few wordings; which one shows changes from move to move. */
export const VERDICT_VARIANTS = ['a', 'b', 'c'] as const;
export type VerdictVariant = (typeof VERDICT_VARIANTS)[number];

/** The wording for the position after `ply` half-moves (stable while the move is the same). */
export function verdictVariant(ply: number): VerdictVariant {
  return VERDICT_VARIANTS[Math.abs(Math.trunc(ply)) % VERDICT_VARIANTS.length];
}
