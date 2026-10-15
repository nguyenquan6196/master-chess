import openings from '@content/books/openings.json';
import { BOOK, bookMove, buildBooks, type OpeningBook } from '@/core/bot/book';
import { chooseSampledMove } from '@/core/bot/choose';
import type { BotLevel } from '@/core/bot/levels';
import { applyStyle, pickStyledMove, STYLE_TUNING, type BotStyle } from '@/core/bot/styles';
import { legalUciMoves, turnOf } from '@/core/chess/game';
import { scoreToCp, toWhitePov, type EngineScore } from '@/core/engine/uci';
import { getEngine } from './StockfishEngine';

let books: Record<BotStyle, OpeningBook> | null = null;

/** Book move for this style while the game is young (built on first use). */
function fromBook(fen: string, level: BotLevel, style: BotStyle): string | null {
  if (level.elo < BOOK.minBotElo) return null;
  const [, turn, , , , fullmove] = fen.split(' ');
  const ply = (Number(fullmove) - 1) * 2 + (turn === 'b' ? 1 : 0);
  if (!(ply < BOOK.maxPly)) return null;
  books ??= buildBooks(openings);
  return bookMove(books[style], fen);
}

/** Candidate lines requested from strong bots so a style can pick among them. */
const STYLED_MULTI_PV = 4;

/** Asks the bot engine for a move at the given level and style. Returns a UCI move or null. */
export async function computeBotMove(
  fen: string,
  level: BotLevel,
  style: BotStyle = 'balanced',
): Promise<string | null> {
  const book = fromBook(fen, level, style);
  if (book) return book;

  const engine = getEngine('bot');
  const s = level.strategy;

  if (s.kind === 'sampled') {
    const { lines, bestMove } = await engine.analyze(fen, { depth: s.depth, multiPV: s.multiPV });
    const raw = lines.map((l) => ({ move: l.pv[0], scoreCp: scoreToCp(l.score) }));
    const legal = legalUciMoves(fen);
    if (legal.length === 0) return null;
    const temperatureCp =
      style === 'chaotic'
        ? s.temperatureCp * STYLE_TUNING.chaoticTemperatureFactor
        : s.temperatureCp;
    return (
      chooseSampledMove(applyStyle(fen, raw, style), legal, { ...s, temperatureCp }) ?? bestMove
    );
  }

  const styled = style !== 'balanced';
  const { bestMove, lines } = await engine.analyze(fen, {
    movetimeMs: s.movetimeMs,
    elo: s.kind === 'limited' ? s.elo : null,
    multiPV: styled ? STYLED_MULTI_PV : 1,
  });
  if (!bestMove || !styled) return bestMove;
  const candidates = lines.map((l) => ({ move: l.pv[0], scoreCp: scoreToCp(l.score) }));
  return pickStyledMove(fen, candidates, bestMove, style);
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
