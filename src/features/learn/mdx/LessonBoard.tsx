'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard, type SquareMark } from '@/components/board/ChessBoard';
import { legalTargets, START_FEN, type Square } from '@/core/chess/game';

/** Splits "e2e4 g1f3" or "e4, d4" into tokens. */
export const tokens = (s?: string) => (s ?? '').split(/[\s,]+/).filter(Boolean);

export function usePromotionLabels() {
  const tg = useTranslations('game');
  return {
    title: tg('choosePromotion'),
    cancel: tg('cancel'),
    pieces: { q: tg('pieces.q'), r: tg('pieces.r'), b: tg('pieces.b'), n: tg('pieces.n') },
  };
}

interface LessonBoardProps {
  /** Position to show (default: the starting position). */
  fen?: string;
  /** Arrows as UCI pairs: "e2e4 g1f3". */
  arrows?: string;
  /** Squares to highlight: "e4 d4". */
  squares?: string;
  /** Show the legal moves of the piece on this square as dots. */
  show?: string;
  orientation?: 'white' | 'black';
  /** Caption under the board. */
  children?: ReactNode;
}

/** Read-only diagram for lessons: `<Board fen="…" arrows="e2e4" squares="e4" show="g1" />`. */
export function LessonBoard({
  fen = START_FEN,
  arrows,
  squares,
  show,
  orientation = 'white',
  children,
}: LessonBoardProps) {
  const promotionLabels = usePromotionLabels();
  const marks: Record<string, SquareMark> = {};
  for (const sq of tokens(squares)) marks[sq] = 'hint';
  if (show) {
    marks[show] = 'hint';
    for (const sq of legalTargets(fen, show as Square)) marks[sq] = 'selected';
  }
  const arrowList = tokens(arrows).map((a) => ({ from: a.slice(0, 2), to: a.slice(2, 4) }));

  return (
    <figure className="not-prose mx-auto my-6 w-full max-w-[360px]">
      <ChessBoard
        fen={fen}
        orientation={orientation}
        movableColor="none"
        marks={marks}
        arrows={arrowList}
        promotionLabels={promotionLabels}
      />
      {children && (
        <figcaption className="mt-2 text-center text-sm text-muted">{children}</figcaption>
      )}
    </figure>
  );
}
