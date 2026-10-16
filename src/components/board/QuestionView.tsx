'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { ChessBoard, type SquareMark } from './ChessBoard';
import type { PromotionLabels } from './PromotionPicker';
import { moveToUci, turnOf, type MoveInput } from '@/core/chess/game';
import {
  checkChoice,
  checkMove,
  checkSquares,
  type QuizQuestion,
  type QuizText,
} from '@/core/quiz/quiz';

export interface QuestionLabels {
  selectHint: string;
  moveHint: string;
  check: string;
  promotion: PromotionLabels;
}

interface Props {
  question: QuizQuestion;
  text: QuizText;
  /** null while unanswered. */
  answered: boolean | null;
  onAnswer: (correct: boolean) => void;
  labels: QuestionLabels;
  /** Narrower layout (board above the text) for use inside lessons. */
  compact?: boolean;
  /** Custom prompt (e.g. rich text from a lesson) instead of `text.prompt`. */
  prompt?: ReactNode;
}

/** One quiz question (choice / select-squares / make-move); shared by Quiz and lessons. */
export function QuestionView({
  question: q,
  text,
  answered,
  onAnswer,
  labels,
  compact,
  prompt,
}: Props) {
  const [choice, setChoice] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [played, setPlayed] = useState<string | null>(null);
  const locked = answered !== null;

  const fen = 'fen' in q ? q.fen : undefined;

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
    <div className={cn('grid gap-6', !compact && 'lg:grid-cols-[minmax(0,480px)_1fr]')}>
      {fen && (
        <div
          className={cn(
            'mx-auto w-full',
            compact ? 'max-w-[360px]' : 'max-w-[480px] lg:w-[min(480px,calc(100dvh-14rem))]',
          )}
        >
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
            promotionLabels={labels.promotion}
          />
        </div>
      )}

      <div className={cn('flex flex-col gap-4', !fen && !compact && 'lg:col-span-2')}>
        {prompt ?? <p className="font-display text-xl font-semibold">{text.prompt}</p>}

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
                      'mc-press w-full rounded-xl border px-4 py-3 text-left font-medium shadow-card',
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
            <p className="text-sm text-muted">{labels.selectHint}</p>
            {!locked && (
              <div>
                <Button
                  variant="primary"
                  onClick={() => onAnswer(checkSquares(q, selected).correct)}
                >
                  {labels.check}
                </Button>
              </div>
            )}
          </>
        )}

        {q.kind === 'make-move' && !locked && (
          <p className="text-sm text-muted">{labels.moveHint}</p>
        )}
      </div>
    </div>
  );
}
