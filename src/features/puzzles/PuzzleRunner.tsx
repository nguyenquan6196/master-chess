'use client';

import type { ReactNode } from 'react';
import type { PuzzleSession } from '@/core/puzzle/session';
import type { Puzzle } from '@/core/puzzle/types';
import { PuzzleBoard } from './PuzzleBoard';
import { usePuzzleSolver, type PuzzleSolver } from './usePuzzleSolver';

interface PuzzleRunnerProps {
  puzzle: Puzzle;
  onSolved?: (session: PuzzleSession, elapsedMs: number) => void;
  onMistake?: (session: PuzzleSession, elapsedMs: number) => void;
  header?: ReactNode;
  actions?: (solver: PuzzleSolver) => ReactNode;
  allowHelp?: boolean;
  showMeta?: boolean;
}

/** One puzzle on the board. Render with `key={puzzle.id}` so each puzzle starts fresh. */
export function PuzzleRunner({
  puzzle,
  onSolved,
  onMistake,
  header,
  actions,
  allowHelp,
  showMeta,
}: PuzzleRunnerProps) {
  const solver = usePuzzleSolver(puzzle, {
    onSolved: (s) => onSolved?.(s, solver.elapsedMs()),
    onMistake: (s) => onMistake?.(s, solver.elapsedMs()),
  });
  return (
    <PuzzleBoard
      solver={solver}
      header={header}
      actions={actions?.(solver)}
      allowHelp={allowHelp}
      showMeta={showMeta}
    />
  );
}
