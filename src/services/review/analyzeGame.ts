import { MATE_CP, scoreToCp } from '@/core/engine/uci';
import type { GameRecord } from '@/core/profile/schema';
import { REVIEW, reviewPositions, type GameReviewData } from '@/core/review/review';
import { gameRepo } from '../db/repositories';
import { evaluatePosition } from '../engine/bot';
import { getEngine } from '../engine/StockfishEngine';
import { recordProgress } from '../progress/progress';

/**
 * Evaluates every position of a finished game on the analysis engine, saves the data
 * with the game and returns it. `isCancelled` is checked between positions.
 */
export async function analyzeGame(
  game: GameRecord,
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean = () => false,
): Promise<GameReviewData | null> {
  const positions = reviewPositions(game.startFen, game.moves);
  const evals: number[] = [];
  const best: (string | null)[] = [];
  for (let i = 0; i < positions.length; i++) {
    if (isCancelled()) return null;
    const p = positions[i];
    if (p.terminal) {
      evals.push(p.terminal.kind === 'draw' ? 0 : p.terminal.loser === 'w' ? -MATE_CP : MATE_CP);
      best.push(null);
    } else {
      const r = await evaluatePosition(p.fen, REVIEW.depth);
      evals.push(r.score ? scoreToCp(r.score) : (evals[evals.length - 1] ?? 0));
      best.push(r.bestMove);
    }
    onProgress(i + 1, positions.length);
  }
  const data: GameReviewData = { depth: REVIEW.depth, evals, best };
  await gameRepo.saveReview(game.id, data);
  void recordProgress(game.profileId, { kind: 'review' });
  return data;
}

export function stopAnalysis(): void {
  getEngine('analysis').stop();
}
