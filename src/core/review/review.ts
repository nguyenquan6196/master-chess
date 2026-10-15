import { Chess } from 'chess.js';
import { z } from 'zod';
import { moveToUci, uciToMove, type Color } from '../chess/game';

/**
 * Game review (spec §6.5): every position of a game is evaluated by the engine; each
 * move is classified by how much winning chance it gave away (Lichess-style win%).
 */
export const MOVE_CLASSES = ['best', 'good', 'inaccuracy', 'mistake', 'blunder'] as const;
export type MoveClass = (typeof MOVE_CLASSES)[number];

export const REVIEW = {
  /** Engine depth per position. */
  depth: 12,
  /** Win% given away (mover's view) from which a move is an inaccuracy/mistake/blunder. */
  inaccuracy: 5,
  mistake: 10,
  blunder: 15,
  /** Evals are clamped to this many cp for the chart (mates included). */
  chartCp: 1000,
} as const;

/** Raw engine data stored with the game: one entry per position (moves + 1). */
export const GameReviewSchema = z.object({
  depth: z.number().int(),
  /** Evaluation in centipawns from White's view (mates as ±MATE_CP − n). */
  evals: z.array(z.number()),
  /** Engine best move (UCI) per position, null at the end. */
  best: z.array(z.string().nullable()),
});
export type GameReviewData = z.infer<typeof GameReviewSchema>;

/** Winning chance (0–100) for White from a White-POV centipawn score (Lichess formula). */
export function winPercent(cp: number): number {
  const c = Math.max(-REVIEW.chartCp * 10, Math.min(REVIEW.chartCp * 10, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

/** Per-move accuracy (0–100) from the win% the mover gave away (Lichess formula). */
export function moveAccuracy(winLoss: number): number {
  const a = 103.1668 * Math.exp(-0.04354 * Math.max(winLoss, 0)) - 3.1669;
  return Math.max(0, Math.min(100, a));
}

export function classify(winLoss: number, playedBest: boolean): MoveClass {
  if (playedBest) return 'best';
  if (winLoss >= REVIEW.blunder) return 'blunder';
  if (winLoss >= REVIEW.mistake) return 'mistake';
  if (winLoss >= REVIEW.inaccuracy) return 'inaccuracy';
  return 'good';
}

export interface ReviewedMove {
  ply: number;
  color: Color;
  uci: string;
  san: string;
  /** Position before the move. */
  fenBefore: string;
  bestUci: string | null;
  bestSan: string | null;
  /** Win% given away by the mover. */
  winLoss: number;
  cls: MoveClass;
  accuracy: number;
}

export interface GameReview {
  moves: ReviewedMove[];
  /** White win% per position, for the chart (moves + 1 points). */
  whiteWin: number[];
  accuracy: Record<Color, number>;
  counts: Record<Color, Record<MoveClass, number>>;
}

const emptyCounts = (): Record<MoveClass, number> =>
  Object.fromEntries(MOVE_CLASSES.map((c) => [c, 0])) as Record<MoveClass, number>;

/** Turns stored engine data into classified moves, accuracy and chart points. */
export function buildReview(
  startFen: string,
  moves: readonly string[],
  data: GameReviewData,
): GameReview {
  const chess = new Chess(startFen);
  const whiteWin = data.evals.map(winPercent);
  const out: ReviewedMove[] = [];
  const counts = { w: emptyCounts(), b: emptyCounts() };
  const accSum = { w: 0, b: 0 };
  const accN = { w: 0, b: 0 };

  for (let i = 0; i < moves.length && i + 1 < data.evals.length; i++) {
    const fenBefore = chess.fen();
    const color = chess.turn();
    const bestUci = data.best[i] ?? null;
    let bestSan: string | null = null;
    if (bestUci) {
      try {
        bestSan = new Chess(fenBefore).move(uciToMove(bestUci)).san;
      } catch {
        bestSan = null;
      }
    }
    const played = chess.move(uciToMove(moves[i]));
    const uci = moveToUci(played);
    const before = color === 'w' ? whiteWin[i] : 100 - whiteWin[i];
    const after = color === 'w' ? whiteWin[i + 1] : 100 - whiteWin[i + 1];
    const winLoss = Math.max(0, before - after);
    const cls = classify(winLoss, uci === bestUci);
    const accuracy = moveAccuracy(winLoss);
    counts[color][cls]++;
    accSum[color] += accuracy;
    accN[color]++;
    out.push({
      ply: i,
      color,
      uci,
      san: played.san,
      fenBefore,
      bestUci,
      bestSan,
      winLoss,
      cls,
      accuracy,
    });
  }

  const avg = (c: Color) => (accN[c] ? Math.round((accSum[c] / accN[c]) * 10) / 10 : 0);
  return { moves: out, whiteWin, accuracy: { w: avg('w'), b: avg('b') }, counts };
}

/** Moves the player could retry: their own mistakes and blunders. */
export function retryableMoves(review: GameReview, player: Color): ReviewedMove[] {
  return review.moves.filter(
    (m) => m.color === player && (m.cls === 'mistake' || m.cls === 'blunder') && m.bestUci,
  );
}

export interface ReviewPosition {
  fen: string;
  /** Game-ending position: no engine needed. */
  terminal: { kind: 'mate'; loser: Color } | { kind: 'draw' } | null;
}

/** Every position of the game (moves + 1), flagging mates and draws. */
export function reviewPositions(startFen: string, moves: readonly string[]): ReviewPosition[] {
  const chess = new Chess(startFen);
  const at = (): ReviewPosition => ({
    fen: chess.fen(),
    terminal: chess.isCheckmate()
      ? { kind: 'mate', loser: chess.turn() }
      : chess.isDraw() || chess.isStalemate()
        ? { kind: 'draw' }
        : null,
  });
  const out = [at()];
  for (const uci of moves) {
    chess.move(uciToMove(uci));
    out.push(at());
  }
  return out;
}
