'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { ActionButton, GameLayout, HudCard } from '@/components/ui/GameLayout';
import { cn } from '@/components/ui/cn';
import { Confetti } from '@/components/ui/Confetti';
import { isCleanSolve } from '@/core/puzzle/session';
import type { PuzzleSolver } from './usePuzzleSolver';

interface PuzzleBoardProps {
  solver: PuzzleSolver;
  /** Mode-specific info shown above the controls (rating, timer, score…). */
  header?: ReactNode;
  /** Mode-specific actions shown once solved (e.g. "Next puzzle"). */
  actions?: ReactNode;
  /** Hide hint/solution (e.g. Puzzle Rush). */
  allowHelp?: boolean;
  /** Show the puzzle's difficulty and themes. */
  showMeta?: boolean;
}

export function PuzzleBoard({
  solver,
  header,
  actions,
  allowHelp = true,
  showMeta = true,
}: PuzzleBoardProps) {
  const t = useTranslations('puzzle');
  const tg = useTranslations('game');
  const tt = useTranslations('puzzleThemes');
  const s = solver.session;
  const playerColorName = solver.orientation === 'white' ? tg('white') : tg('black');
  const clean = s ? isCleanSolve(s) : false;

  const status = solver.solved
    ? clean
      ? t('solved')
      : t('solvedWithHelp')
    : solver.feedback === 'wrong'
      ? t('wrong')
      : solver.feedback === 'correct'
        ? t('correct')
        : solver.canMove
          ? t('yourTurn', { color: playerColorName })
          : t('opponentMoves');

  const knownThemes = solver.puzzle.themes.filter((th) => tt.has(th as never));

  const statusBox = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded-2xl border px-4 py-3 font-display text-lg font-semibold shadow-card',
        solver.solved && 'border-accent bg-accent text-accent-fg',
        solver.feedback === 'wrong' && 'border-danger bg-surface text-danger',
        solver.feedback === 'correct' && 'border-accent bg-surface text-accent',
        !solver.solved && !solver.feedback && 'border-border bg-surface',
      )}
    >
      {!solver.solved && (
        <span
          aria-hidden
          className={cn(
            'inline-block size-4 shrink-0 rounded-full border border-border',
            solver.orientation === 'white' ? 'bg-side-white' : 'bg-side-black',
          )}
        />
      )}
      <span className="min-w-0 flex-1">{status}</span>
      {actions}
    </div>
  );

  return (
    <GameLayout
      top={header}
      board={
        <div className="relative">
          <ChessBoard
            fen={solver.fen}
            orientation={solver.orientation}
            movableColor={solver.canMove ? (solver.orientation === 'white' ? 'w' : 'b') : 'none'}
            lastMove={solver.lastMove}
            marks={solver.marks}
            arrows={solver.arrows}
            onMove={solver.onMove}
            promotionLabels={{
              title: tg('choosePromotion'),
              cancel: tg('cancel'),
              pieces: {
                q: tg('pieces.q'),
                r: tg('pieces.r'),
                b: tg('pieces.b'),
                n: tg('pieces.n'),
              },
            }}
          />
          <Confetti trigger={solver.solved && clean ? solver.puzzle.rating + 1 : null} />
        </div>
      }
      bottom={statusBox}
      actions={
        allowHelp && !solver.solved ? (
          <>
            <ActionButton
              icon="💡"
              label={t('hint')}
              onClick={solver.hint}
              disabled={!solver.canMove}
            />
            <ActionButton
              icon="👁️"
              label={t('solution')}
              onClick={solver.showSolution}
              disabled={!s}
            />
          </>
        ) : undefined
      }
      side={
        showMeta ? (
          <HudCard className="py-3 text-sm">
            <p className="font-semibold">{t('puzzleRating', { rating: solver.puzzle.rating })}</p>
            {solver.solved && knownThemes.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-1">
                {knownThemes.map((th) => (
                  <span key={th} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                    {tt(th as never)}
                  </span>
                ))}
              </p>
            )}
          </HudCard>
        ) : undefined
      }
    />
  );
}
