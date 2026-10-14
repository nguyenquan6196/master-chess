'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { positionsFromSan, START_FEN } from '@/core/chess/game';
import { tokens, usePromotionLabels } from './LessonBoard';

interface MoveSequenceProps {
  /** SAN moves: "e4 e5 Nf3 Nc6 Bc4". */
  moves: string;
  fen?: string;
  orientation?: 'white' | 'black';
  children?: ReactNode;
}

/** Steps through a line of moves with ⏮ ◀ ▶ ⏭: `<MoveSequence moves="e4 e5 Nf3" />`. */
export function MoveSequence({
  moves,
  fen = START_FEN,
  orientation = 'white',
  children,
}: MoveSequenceProps) {
  const tl = useTranslations('learn');
  const promotionLabels = usePromotionLabels();
  const line = positionsFromSan(tokens(moves), fen);
  const [i, setI] = useState(0);
  const pos = line[i];
  const last = line.length - 1;

  return (
    <figure className="not-prose mx-auto my-6 w-full max-w-[360px]">
      <ChessBoard
        fen={pos.fen}
        orientation={orientation}
        movableColor="none"
        lastMove={pos.move}
        promotionLabels={promotionLabels}
      />
      <div className="mt-2 flex items-center justify-center gap-1">
        <Button variant="ghost" onClick={() => setI(0)} disabled={i === 0} aria-label={tl('first')}>
          ⏮
        </Button>
        <Button
          variant="secondary"
          onClick={() => setI(i - 1)}
          disabled={i === 0}
          aria-label={tl('prev')}
        >
          ◀
        </Button>
        <Button
          variant="primary"
          onClick={() => setI(i + 1)}
          disabled={i === last}
          aria-label={tl('next')}
        >
          ▶
        </Button>
        <Button
          variant="ghost"
          onClick={() => setI(last)}
          disabled={i === last}
          aria-label={tl('last')}
        >
          ⏭
        </Button>
      </div>
      <ol className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm tabular-nums">
        {line.slice(1).map((p, k) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => setI(k + 1)}
              className={cn(
                'rounded px-1',
                k + 1 === i ? 'bg-accent font-semibold text-accent-fg' : 'text-muted hover:text-fg',
              )}
            >
              {k % 2 === 0 && <span className="mr-0.5 text-muted">{k / 2 + 1}.</span>}
              {p.move?.san}
            </button>
          </li>
        ))}
      </ol>
      {children && (
        <figcaption className="mt-2 text-center text-sm text-muted">{children}</figcaption>
      )}
    </figure>
  );
}
