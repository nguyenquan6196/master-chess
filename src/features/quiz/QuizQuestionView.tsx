'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard, type SquareMark } from '@/components/board/ChessBoard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { moveToUci, turnOf, type MoveInput } from '@/core/chess/game';
import {
  checkChoice,
  checkMove,
  checkSquares,
  type QuizQuestion,
  type QuizText,
} from '@/core/quiz/quiz';

interface Props {
  question: QuizQuestion;
  text: QuizText;
  /** null while unanswered. */
  answered: boolean | null;
  onAnswer: (correct: boolean) => void;
}

export function QuizQuestionView({ question: q, text, answered, onAnswer }: Props) {
  const t = useTranslations('quiz');
  const tg = useTranslations('game');
  const [choice, setChoice] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [played, setPlayed] = useState<string | null>(null);
  const locked = answered !== null;

  const fen = 'fen' in q ? q.fen : undefined;
  const promotionLabels = {
    title: tg('choosePromotion'),
    cancel: tg('cancel'),
    pieces: { q: tg('pieces.q'), r: tg('pieces.r'), b: tg('pieces.b'), n: tg('pieces.n') },
  };

  // Square marks for select-squares (selection, then the corrected answer).
  const marks: Record<string, SquareMark> = {};
  if (q.kind === 'select-squares') {
    marks[q.square] = 'hint';
    if (!locked) {
      for (const s of selected) marks[s] = 'selected';
    } else {
      const r = checkSquares(q, selected);
      for (const s of r.hits) marks[s] = 'correct';
      for (const s of r.wrong) marks[s] = 'wrong';
      for (const s of r.missed) marks[s] = 'missed';
    }
  }

  function toggleSquare(sq: string) {
    if (locked || q.kind !== 'select-squares' || sq === q.square) return;
    setSelected((cur) => (cur.includes(sq) ? cur.filter((s) => s !== sq) : [...cur, sq]));
  }

  function onMove(input: MoveInput): boolean {
    if (locked || q.kind !== 'make-move') return false;
    const uci = moveToUci(input);
    setPlayed(uci);
    onAnswer(checkMove(q, uci));
    return false;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,480px)_1fr]">
      {fen && (
        <div className="mx-auto w-full max-w-[480px]">
          <ChessBoard
            fen={fen}
            orientation={turnOf(fen) === 'b' && q.kind === 'make-move' ? 'black' : 'white'}
            movableColor={q.kind === 'make-move' && !locked ? turnOf(fen) : 'none'}
            marks={marks}
            arrows={
              played && q.kind === 'make-move'
                ? [{ from: played.slice(0, 2), to: played.slice(2, 4) }]
                : []
            }
            onMove={onMove}
            onSquareSelect={q.kind === 'select-squares' ? toggleSquare : undefined}
            promotionLabels={promotionLabels}
          />
        </div>
      )}

      <div className={cn('flex flex-col gap-4', !fen && 'lg:col-span-2')}>
        <p className="font-display text-xl font-semibold">{text.prompt}</p>

        {q.kind === 'choice' && (
          <ul className="flex flex-col gap-2">
            {q.choices.map((c) => {
              const isAnswer = locked && c === q.answer;
              const isWrongPick = locked && c === choice && c !== q.answer;
              return (
                <li key={c}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setChoice(c);
                      onAnswer(checkChoice(q, c));
                    }}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left font-medium transition-colors',
                      !locked && 'border-border bg-surface hover:border-accent',
                      isAnswer && 'border-accent bg-accent text-accent-fg',
                      isWrongPick && 'border-danger bg-danger text-surface',
                      locked && !isAnswer && !isWrongPick && 'border-border opacity-60',
                    )}
                  >
                    {text.choices?.[c] ?? c}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {q.kind === 'select-squares' && (
          <>
            <p className="text-sm text-muted">{t('selectHint')}</p>
            {!locked && (
              <div>
                <Button
                  variant="primary"
                  onClick={() => onAnswer(checkSquares(q, selected).correct)}
                >
                  {t('check')}
                </Button>
              </div>
            )}
          </>
        )}

        {q.kind === 'make-move' && !locked && <p className="text-sm text-muted">{t('moveHint')}</p>}
      </div>
    </div>
  );
}
