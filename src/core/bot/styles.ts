import { Chess, type Move, type PieceSymbol } from 'chess.js';
import type { Candidate, Rng } from './choose';

/**
 * Bot playing styles (spec §6.4): a bonus added to engine candidates that are close to
 * the best move, so the bot keeps playing sensibly but with a recognizable taste.
 * Names/descriptions live in messages under `botStyles.<id>`.
 */
export const BOT_STYLES = ['balanced', 'aggressive', 'defensive', 'positional', 'chaotic'] as const;
export type BotStyle = (typeof BOT_STYLES)[number];

export const isBotStyle = (v: unknown): v is BotStyle =>
  typeof v === 'string' && (BOT_STYLES as readonly string[]).includes(v);

export const STYLE_ICONS: Record<BotStyle, string> = {
  balanced: '🤖',
  aggressive: '⚔️',
  defensive: '🛡️',
  positional: '🧠',
  chaotic: '🎲',
};

export const STYLE_TUNING = {
  /** Only candidates at most this far below the best move get a style bonus. */
  windowCp: 80,
  /** Weak (sampled) bots: multiply the softmax temperature for the chaotic style. */
  chaoticTemperatureFactor: 1.8,
  /** Bonuses in centipawns. */
  bonus: {
    check: 35,
    capturePerPawn: 15,
    kingsidePawnPush: 15,
    advance: 4,
    tradeWhenAhead: 25,
    keepStructure: 10,
    kingExposed: -25,
    center: 15,
    develop: 15,
    keepPieces: 20,
    quietChaos: 10,
  },
  /** Material lead (cp) that counts as "ahead" for the defensive style. */
  aheadCp: 150,
} as const;

const PIECE_CP: Record<PieceSymbol, number> = { p: 100, n: 300, b: 300, r: 500, q: 900, k: 0 };
const CENTER = new Set(['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5']);

function moveOf(chess: Chess, uci: string): Move | null {
  try {
    const m = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    chess.undo();
    return m;
  } catch {
    return null;
  }
}

/** Material balance in cp from `color`'s point of view. */
function materialFor(chess: Chess, color: 'w' | 'b'): number {
  let sum = 0;
  for (const row of chess.board())
    for (const sq of row) if (sq) sum += (sq.color === color ? 1 : -1) * PIECE_CP[sq.type];
  return sum;
}

/** Style bonus (cp) for one legal move in `fen`. Balanced always returns 0. */
export function styleBonus(fen: string, uci: string, style: BotStyle): number {
  if (style === 'balanced') return 0;
  const chess = new Chess(fen);
  const m = moveOf(chess, uci);
  if (!m) return 0;
  const B = STYLE_TUNING.bonus;
  const captured = m.captured ? PIECE_CP[m.captured] : 0;
  const isCheck = m.san.includes('+') || m.san.includes('#');
  const forward = m.color === 'w' ? 1 : -1;
  const rankDelta = (Number(m.to[1]) - Number(m.from[1])) * forward;

  switch (style) {
    case 'aggressive': {
      let b = 0;
      if (isCheck) b += B.check;
      b += (captured / 100) * B.capturePerPawn;
      // Pawn storms toward the enemy king's usual (kingside) home.
      if (m.piece === 'p' && 'fgh'.includes(m.from[0]) && rankDelta > 0) b += B.kingsidePawnPush;
      if (m.piece !== 'k' && rankDelta > 0) b += B.advance;
      return b;
    }
    case 'defensive': {
      let b = 0;
      const ahead = materialFor(chess, m.color) >= STYLE_TUNING.aheadCp;
      if (ahead && m.captured && PIECE_CP[m.captured] >= PIECE_CP[m.piece]) b += B.tradeWhenAhead;
      if (m.piece === 'p' && 'fgh'.includes(m.from[0])) b += B.kingExposed;
      if (m.piece !== 'p') b += B.keepStructure;
      if (m.piece === 'k' && !m.san.startsWith('O-O')) b += B.kingExposed;
      if (m.san.startsWith('O-O')) b += B.keepStructure;
      return b;
    }
    case 'positional': {
      let b = 0;
      if (CENTER.has(m.to)) b += B.center;
      const backRank = m.color === 'w' ? '1' : '8';
      if ((m.piece === 'n' || m.piece === 'b') && m.from[1] === backRank) b += B.develop;
      if (m.san.startsWith('O-O')) b += B.develop;
      return b;
    }
    case 'chaotic': {
      // Keep the board full of pieces and play surprising quiet moves.
      return m.captured ? -B.keepPieces : B.quietChaos;
    }
  }
}

/**
 * Re-ranks engine candidates by style: candidates within the window of the best get
 * their bonus; the rest keep their engine score. Returns new scores (same order).
 */
export function applyStyle(
  fen: string,
  candidates: readonly Candidate[],
  style: BotStyle,
): Candidate[] {
  if (style === 'balanced' || candidates.length === 0) return [...candidates];
  const best = Math.max(...candidates.map((c) => c.scoreCp));
  return candidates.map((c) =>
    best - c.scoreCp <= STYLE_TUNING.windowCp
      ? { ...c, scoreCp: c.scoreCp + styleBonus(fen, c.move, style) }
      : c,
  );
}

/** For strong bots: the styled pick among candidates close to the engine's own choice. */
export function pickStyledMove(
  fen: string,
  candidates: readonly Candidate[],
  engineMove: string,
  style: BotStyle,
  rng: Rng = Math.random,
): string {
  if (style === 'balanced') return engineMove;
  const chosen = candidates.find((c) => c.move === engineMove);
  if (!chosen) return engineMove;
  const eligible = candidates.filter(
    (c) => Math.abs(c.scoreCp - chosen.scoreCp) <= STYLE_TUNING.windowCp,
  );
  const styled = eligible.map((c) => ({
    move: c.move,
    score: c.scoreCp + styleBonus(fen, c.move, style),
  }));
  const top = Math.max(...styled.map((s) => s.score));
  const best = styled.filter((s) => s.score === top);
  return best[Math.floor(rng() * best.length)].move;
}
