import { chooseSampledMove } from '@/core/bot/choose';
import type { BotLevel } from '@/core/bot/levels';
import { legalUciMoves, turnOf } from '@/core/chess/game';
import { scoreToCp, toWhitePov, type EngineScore } from '@/core/engine/uci';
import { getEngine } from './StockfishEngine';

/** Asks the bot engine for a move at the given level. Returns a UCI move or null. */
export async function computeBotMove(fen: string, level: BotLevel): Promise<string | null> {
  const engine = getEngine('bot');
  const s = level.strategy;

  if (s.kind === 'sampled') {
    const { lines, bestMove } = await engine.analyze(fen, { depth: s.depth, multiPV: s.multiPV });
    const candidates = lines.map((l) => ({ move: l.pv[0], scoreCp: scoreToCp(l.score) }));
    const legal = legalUciMoves(fen);
    if (legal.length === 0) return null;
    return chooseSampledMove(candidates, legal, s) ?? bestMove;
  }

  const { bestMove } = await engine.analyze(fen, {
    movetimeMs: s.movetimeMs,
    elo: s.kind === 'limited' ? s.elo : null,
  });
  return bestMove;
}

export interface PositionEval {
  bestMove: string | null;
  /** Score from White's point of view. */
  score: EngineScore | null;
}

export const ANALYSIS_DEPTH = 12;

/** Full-strength evaluation on the analysis engine (hints, eval bar, draw offers). */
export async function evaluatePosition(fen: string, depth = ANALYSIS_DEPTH): Promise<PositionEval> {
  const { bestMove, lines } = await getEngine('analysis').analyze(fen, { depth, multiPV: 1 });
  const top = lines[0];
  return { bestMove, score: top ? toWhitePov(top.score, turnOf(fen)) : null };
}

export function stopAllEngines(): void {
  getEngine('bot').stop();
  getEngine('analysis').stop();
}
