'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SquareMark } from '@/components/board/ChessBoard';
import { moveToUci, uciToMove, type MoveInput } from '@/core/chess/game';
import {
  expectedMove,
  playPuzzleMove,
  playReply,
  revealSolution,
  startPuzzle,
  withHint,
  type PuzzleSession,
} from '@/core/puzzle/session';
import type { Puzzle } from '@/core/puzzle/types';
import { playSfx } from '@/services/audio/sfx';

/** Delays that make the opponent's moves readable. */
const SETUP_DELAY_MS = 600;
const REPLY_DELAY_MS = 450;
const FEEDBACK_MS = 1200;

export type SolverFeedback = 'correct' | 'wrong' | null;

export interface PuzzleSolver {
  puzzle: Puzzle;
  session: PuzzleSession | null;
  fen: string;
  lastMove: { from: string; to: string } | null;
  orientation: 'white' | 'black';
  canMove: boolean;
  feedback: SolverFeedback;
  solved: boolean;
  marks: Record<string, SquareMark>;
  arrows: { from: string; to: string }[];
  onMove: (input: MoveInput) => boolean;
  hint: () => void;
  showSolution: () => void;
  /** Time spent on this puzzle so far. */
  elapsedMs: () => number;
}

interface Options {
  /** Called once when the puzzle is solved (cleanly or not). */
  onSolved?: (session: PuzzleSession) => void;
  /** Called on every wrong move. */
  onMistake?: (session: PuzzleSession) => void;
}

function lastOf(uci: string | undefined) {
  if (!uci) return null;
  const m = uciToMove(uci);
  return { from: m.from, to: m.to };
}

/** Runs one puzzle on the board. Remount (key={puzzle.id}) for the next puzzle. */
export function usePuzzleSolver(
  puzzle: Puzzle,
  { onSolved, onMistake }: Options = {},
): PuzzleSolver {
  const [session, setSession] = useState<PuzzleSession | null>(null);
  const [feedback, setFeedback] = useState<SolverFeedback>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const callbacks = useRef({ onSolved, onMistake });
  useEffect(() => {
    callbacks.current = { onSolved, onMistake };
  });

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  // Show the position, then animate the opponent's setup move.
  useEffect(() => {
    startedAt.current = Date.now();
    const t = setTimeout(() => {
      setSession(startPuzzle(puzzle));
      playSfx('move');
    }, SETUP_DELAY_MS);
    const pending = timers.current;
    return () => {
      clearTimeout(t);
      pending.forEach(clearTimeout);
    };
  }, [puzzle]);

  const finish = useCallback((s: PuzzleSession) => {
    playSfx('win');
    callbacks.current.onSolved?.(s);
  }, []);

  const onMove = useCallback(
    (input: MoveInput): boolean => {
      if (!session || session.status !== 'playing') return false;
      const result = playPuzzleMove(session, moveToUci(input));
      setHintLevel(0);
      if (result.kind === 'wrong') {
        playSfx('illegal');
        setSession(result.session);
        setFeedback('wrong');
        later(() => setFeedback(null), FEEDBACK_MS);
        callbacks.current.onMistake?.(result.session);
        return false;
      }
      setSession(result.session);
      if (result.kind === 'solved') {
        finish(result.session);
        return true;
      }
      playSfx('move');
      setFeedback('correct');
      later(() => {
        setSession((s) => (s ? playReply(s) : s));
        setFeedback(null);
        playSfx('move');
      }, REPLY_DELAY_MS);
      return true;
    },
    [session, later, finish],
  );

  const hint = useCallback(() => {
    if (!session || session.status !== 'playing') return;
    if (hintLevel === 0) setSession(withHint(session));
    setHintLevel((h) => Math.min(h + 1, 2));
  }, [session, hintLevel]);

  const showSolution = useCallback(() => {
    if (!session || session.status !== 'playing') return;
    const s = revealSolution(session);
    setSession(s);
    setHintLevel(0);
    finish(s);
  }, [session, finish]);

  const expected = session ? expectedMove(session) : null;
  const marks: Record<string, SquareMark> = {};
  if (expected && hintLevel >= 1) marks[expected.from] = 'hint';
  const arrows = expected && hintLevel >= 2 ? [expected] : [];

  const fen = session?.fen ?? puzzle.fen;
  const playerColor = session?.playerColor ?? (puzzle.fen.split(' ')[1] === 'w' ? 'b' : 'w');
  const awaitingPlayer = !!session && session.status === 'playing' && session.ply % 2 === 1;

  return {
    puzzle,
    session,
    fen,
    lastMove: lastOf(session?.played[session.played.length - 1]),
    orientation: playerColor === 'w' ? 'white' : 'black',
    canMove: awaitingPlayer,
    feedback,
    solved: session?.status === 'solved',
    marks,
    arrows,
    onMove,
    hint,
    showSolution,
    elapsedMs: () => Date.now() - startedAt.current,
  };
}
