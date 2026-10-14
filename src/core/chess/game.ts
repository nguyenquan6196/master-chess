import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';

export type { Color, Move, PieceSymbol, Square };

export type PromotionPiece = Extract<PieceSymbol, 'q' | 'r' | 'b' | 'n'>;
export const PROMOTION_PIECES: readonly PromotionPiece[] = ['q', 'r', 'b', 'n'];

export type DrawReason = 'stalemate' | 'threefold' | 'insufficient' | 'fifty-moves';

export type GameStatus =
  | { kind: 'playing'; turn: Color; inCheck: boolean }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'draw'; reason: DrawReason };

export interface MoveInput {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
}

export const START_FEN = new Chess().fen();

/**
 * Loads a position for read-only queries (legal targets, colors, check). Diagrams in
 * lessons may omit kings, which strict validation rejects, so validation is skipped.
 */
function view(fen: string): Chess {
  return new Chess(fen, { skipValidation: true });
}

/** Immutable snapshot of a game, safe to keep in React state. */
export interface GameSnapshot {
  startFen: string;
  fen: string;
  history: Move[];
  status: GameStatus;
}

export function getStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' };
  }
  if (chess.isStalemate()) return { kind: 'draw', reason: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { kind: 'draw', reason: 'insufficient' };
  if (chess.isThreefoldRepetition()) return { kind: 'draw', reason: 'threefold' };
  if (chess.isDrawByFiftyMoves()) return { kind: 'draw', reason: 'fifty-moves' };
  return { kind: 'playing', turn: chess.turn(), inCheck: chess.inCheck() };
}

function snapshotOf(chess: Chess, startFen: string): GameSnapshot {
  return {
    startFen,
    fen: chess.fen(),
    history: chess.history({ verbose: true }),
    status: getStatus(chess),
  };
}

/** Rebuilds a Chess instance from move history (keeps repetition detection correct). */
function replay(startFen: string, history: readonly Move[]): Chess {
  const chess = new Chess(startFen);
  for (const m of history) chess.move({ from: m.from, to: m.to, promotion: m.promotion });
  return chess;
}

export function newGame(fen: string = START_FEN): GameSnapshot {
  return snapshotOf(new Chess(fen), fen);
}

/** Returns the new snapshot, or null when the move is illegal or the game is over. */
export function applyMove(game: GameSnapshot, input: MoveInput): GameSnapshot | null {
  if (game.status.kind !== 'playing') return null;
  const chess = replay(game.startFen, game.history);
  try {
    chess.move(input);
  } catch {
    return null;
  }
  return snapshotOf(chess, game.startFen);
}

export function undoMove(game: GameSnapshot): GameSnapshot {
  if (game.history.length === 0) return game;
  return snapshotOf(replay(game.startFen, game.history.slice(0, -1)), game.startFen);
}

/** Destination squares the piece on `square` can legally move to. */
export function legalTargets(fen: string, square: Square): Square[] {
  const chess = view(fen);
  return chess.moves({ square, verbose: true }).map((m) => m.to);
}

/** True when moving from→to is a legal pawn move that requires choosing a promotion piece. */
export function isPromotionMove(fen: string, from: Square, to: Square): boolean {
  const chess = view(fen);
  return chess
    .moves({ square: from, verbose: true })
    .some((m) => m.to === to && m.promotion !== undefined);
}

/** Square of the king of the side to move if it is in check, otherwise null. */
export function checkedKingSquare(fen: string): Square | null {
  const chess = view(fen);
  if (!chess.inCheck()) return null;
  return chess.findPiece({ type: 'k', color: chess.turn() })[0] ?? null;
}

export function pieceColorAt(fen: string, square: Square): Color | null {
  return view(fen).get(square)?.color ?? null;
}

export function turnOf(fen: string): Color {
  return view(fen).turn();
}

export function toPgn(game: GameSnapshot, headers: Record<string, string> = {}): string {
  const chess = replay(game.startFen, game.history);
  for (const [k, v] of Object.entries(headers)) chess.setHeader(k, v);
  return chess.pgn();
}

/** "e7e8q" → { from: 'e7', to: 'e8', promotion: 'q' }. */
export function uciToMove(uci: string): MoveInput {
  const promotion = uci[4] as PromotionPiece | undefined;
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(promotion ? { promotion } : {}),
  };
}

export function moveToUci(move: { from: string; to: string; promotion?: string }): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

/** All legal moves of the side to move, in UCI notation. */
export function legalUciMoves(fen: string): string[] {
  return new Chess(fen).moves({ verbose: true }).map(moveToUci);
}

export interface LinePosition {
  fen: string;
  /** The move that led to this position (null for the start). */
  move: { from: string; to: string; san: string } | null;
}

/**
 * Positions along a line of SAN moves (e.g. "e4 e5 Nf3"), starting with `startFen`.
 * Stops at the first illegal move.
 */
export function positionsFromSan(
  sans: readonly string[],
  startFen: string = START_FEN,
): LinePosition[] {
  const chess = new Chess(startFen);
  const out: LinePosition[] = [{ fen: chess.fen(), move: null }];
  for (const san of sans) {
    try {
      const m = chess.move(san);
      out.push({ fen: chess.fen(), move: { from: m.from, to: m.to, san: m.san } });
    } catch {
      break;
    }
  }
  return out;
}

/** True when `fen` loads as a legal chess position. */
export function isValidFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}
