import { z } from 'zod';

/**
 * Puzzle from the Lichess puzzle database (CC0). `fen` is the position BEFORE the
 * opponent's move; `moves[0]` is that opponent move, then player and opponent alternate.
 */
export interface Puzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  rd: number;
  themes: string[];
}

/** On-disk compact form: [id, fen, "uci uci ...", rating, rd, "theme theme ..."]. */
export const PuzzleTupleSchema = z.tuple([
  z.string(),
  z.string(),
  z.string(),
  z.number(),
  z.number(),
  z.string(),
]);
export type PuzzleTuple = z.infer<typeof PuzzleTupleSchema>;

export const PuzzleFileSchema = z.array(PuzzleTupleSchema);

export function decodePuzzle([id, fen, moves, rating, rd, themes]: PuzzleTuple): Puzzle {
  return {
    id,
    fen,
    moves: moves.split(' '),
    rating,
    rd,
    themes: themes ? themes.split(' ') : [],
  };
}

export function encodePuzzle(p: Puzzle): PuzzleTuple {
  return [p.id, p.fen, p.moves.join(' '), p.rating, p.rd, p.themes.join(' ')];
}

/** Rating buckets used to split the puzzle set into files (public/puzzles/rating/<min>.json). */
export const PUZZLE_BUCKET_SIZE = 200;
export const PUZZLE_MIN_RATING = 400;
export const PUZZLE_MAX_RATING = 2800;

export function bucketOf(rating: number): number {
  const clamped = Math.min(PUZZLE_MAX_RATING - 1, Math.max(PUZZLE_MIN_RATING, rating));
  return Math.floor(clamped / PUZZLE_BUCKET_SIZE) * PUZZLE_BUCKET_SIZE;
}

export function allBuckets(): number[] {
  const out: number[] = [];
  for (let r = PUZZLE_MIN_RATING; r < PUZZLE_MAX_RATING; r += PUZZLE_BUCKET_SIZE) out.push(r);
  return out;
}

/**
 * Themes offered in "theme training" (Lichess theme keys). Names are translated under
 * `puzzleThemes.<key>` in messages.
 */
export const TRAINING_THEMES = [
  'mateIn1',
  'mateIn2',
  'mateIn3',
  'fork',
  'pin',
  'skewer',
  'discoveredAttack',
  'doubleCheck',
  'hangingPiece',
  'trappedPiece',
  'sacrifice',
  'deflection',
  'attraction',
  'backRankMate',
  'smotheredMate',
  'promotion',
  'enPassant',
  'castling',
  'endgame',
  'rookEndgame',
  'pawnEndgame',
  'opening',
] as const;
export type TrainingTheme = (typeof TRAINING_THEMES)[number];

export function isTrainingTheme(v: unknown): v is TrainingTheme {
  return typeof v === 'string' && (TRAINING_THEMES as readonly string[]).includes(v);
}
