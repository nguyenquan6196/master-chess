import { Chess } from 'chess.js';
import { moveToUci, uciToMove, type Color } from '../chess/game';
import type { Puzzle } from './types';

/**
 * Solving state for one puzzle. `ply` indexes `puzzle.moves`: the next move expected
 * from the player (odd indexes), or the opponent's reply (even indexes > 0).
 */
export interface PuzzleSession {
  puzzle: Puzzle;
  fen: string;
  ply: number;
  playerColor: Color;
  /** Moves actually played (UCI), including the opening opponent move. */
  played: string[];
  mistakes: number;
  hintsUsed: number;
  status: 'playing' | 'solved';
}

export type MoveResult =
  /** Right move; the opponent reply (if any) should be played next via `playReply`. */
  | { kind: 'correct'; session: PuzzleSession }
  | { kind: 'solved'; session: PuzzleSession }
  /** Wrong move: the position is unchanged so the board snaps back. */
  | { kind: 'wrong'; session: PuzzleSession };

function apply(fen: string, uci: string): { fen: string; uci: string; mate: boolean } | null {
  const chess = new Chess(fen);
  try {
    const m = chess.move(uciToMove(uci));
    return { fen: chess.fen(), uci: moveToUci(m), mate: chess.isCheckmate() };
  } catch {
    return null;
  }
}

/** Starts a puzzle: plays the opponent's setup move. */
export function startPuzzle(puzzle: Puzzle): PuzzleSession {
  const first = apply(puzzle.fen, puzzle.moves[0]);
  if (!first) throw new Error(`Invalid puzzle ${puzzle.id}`);
  const playerColor: Color = new Chess(first.fen).turn();
  return {
    puzzle,
    fen: first.fen,
    ply: 1,
    playerColor,
    played: [first.uci],
    mistakes: 0,
    hintsUsed: 0,
    status: 'playing',
  };
}

/** Position before the opponent's setup move (for animating it in). */
export function setupPosition(puzzle: Puzzle): string {
  return puzzle.fen;
}

/** The player tries `uci`. Any move that delivers checkmate is accepted (Lichess rule). */
export function playPuzzleMove(session: PuzzleSession, uci: string): MoveResult {
  if (session.status !== 'playing') return { kind: 'wrong', session };
  const expected = session.puzzle.moves[session.ply];
  const result = apply(session.fen, uci);
  if (!result) return { kind: 'wrong', session };

  const isExpected = result.uci === expected || uci === expected;
  if (!isExpected && !result.mate) {
    return { kind: 'wrong', session: { ...session, mistakes: session.mistakes + 1 } };
  }

  const next: PuzzleSession = {
    ...session,
    fen: result.fen,
    ply: session.ply + 1,
    played: [...session.played, result.uci],
  };
  if (result.mate || next.ply >= session.puzzle.moves.length) {
    return { kind: 'solved', session: { ...next, status: 'solved' } };
  }
  return { kind: 'correct', session: next };
}

/** Plays the opponent's scripted reply after a correct player move. */
export function playReply(session: PuzzleSession): PuzzleSession {
  if (session.status !== 'playing' || session.ply % 2 !== 0) return session;
  const reply = session.puzzle.moves[session.ply];
  const result = reply ? apply(session.fen, reply) : null;
  if (!result) return session;
  return {
    ...session,
    fen: result.fen,
    ply: session.ply + 1,
    played: [...session.played, result.uci],
  };
}

/** The move the player should play now. */
export function expectedMove(session: PuzzleSession): { from: string; to: string } | null {
  if (session.status !== 'playing' || session.ply % 2 !== 1) return null;
  const m = uciToMove(session.puzzle.moves[session.ply]);
  return { from: m.from, to: m.to };
}

export function withHint(session: PuzzleSession): PuzzleSession {
  return { ...session, hintsUsed: session.hintsUsed + 1 };
}

/** Plays every remaining solution move (after "show solution"). */
export function revealSolution(session: PuzzleSession): PuzzleSession {
  let s: PuzzleSession = { ...session, hintsUsed: session.hintsUsed + 1 };
  while (s.ply < s.puzzle.moves.length) {
    const r = apply(s.fen, s.puzzle.moves[s.ply]);
    if (!r) break;
    s = { ...s, fen: r.fen, ply: s.ply + 1, played: [...s.played, r.uci] };
  }
  return { ...s, status: 'solved' };
}

/** Counted as a success for rating only when solved without mistakes, hints or solution. */
export function isCleanSolve(session: PuzzleSession): boolean {
  return session.status === 'solved' && session.mistakes === 0 && session.hintsUsed === 0;
}
