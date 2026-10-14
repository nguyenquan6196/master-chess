'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { QuestionView } from '@/components/board/QuestionView';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import type { QuizQuestion } from '@/core/quiz/quiz';
import { playSfx } from '@/services/audio/sfx';
import { tokens, usePromotionLabels } from './LessonBoard';

interface ExerciseProps {
  /** "make-move": play the answer; "select-squares": click every square the piece on `square` can reach. */
  kind: 'make-move' | 'select-squares';
  fen: string;
  /** make-move: accepted UCI moves, e.g. "e1g1". */
  answers?: string;
  /** make-move: also accept any checkmating move. */
  mate?: boolean;
  /** select-squares: the piece to study. */
  square?: string;
  /** Shown after answering. */
  explain?: string;
  /** The prompt. */
  children: ReactNode;
}

/** "Try it" exercise inside a lesson; can be retried until correct. */
export function Exercise({ kind, fen, answers, mate, square, explain, children }: ExerciseProps) {
  const t = useTranslations('quiz');
  const tl = useTranslations('learn');
  const promotion = usePromotionLabels();
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState(0);

  const question: QuizQuestion =
    kind === 'make-move'
      ? { id: 'lesson', kind, topic: 'rules', level: 1, fen, answers: tokens(answers), mate }
      : { id: 'lesson', kind, topic: 'pieces', level: 1, fen, square: square ?? '' };

  return (
    <section
      className={cn(
        'not-prose my-6 rounded-2xl border bg-surface p-4',
        answered === true
          ? 'border-accent'
          : answered === false
            ? 'border-danger'
            : 'border-border',
      )}
    >
      <p className="mb-3 text-xs font-bold tracking-wide text-accent uppercase">🎯 {tl('tryIt')}</p>
      <QuestionView
        key={attempt}
        compact
        question={question}
        text={{ prompt: '', explanation: explain ?? '' }}
        answered={answered}
        onAnswer={(ok) => {
          setAnswered(ok);
          playSfx(ok ? 'notify' : 'illegal');
        }}
        labels={{
          selectHint: t('selectHint'),
          moveHint: t('moveHint'),
          check: t('check'),
          promotion,
        }}
        prompt={<div className="text-base font-semibold">{children}</div>}
      />
      {answered !== null && (
        <div className="mt-3 flex flex-col gap-2">
          <p className={cn('font-semibold', answered ? 'text-accent' : 'text-danger')}>
            {answered ? t('correct') : t('wrong')}
          </p>
          {answered && explain && <p className="text-sm">{explain}</p>}
          {!answered && (
            <div>
              <Button
                onClick={() => {
                  setAnswered(null);
                  setAttempt((a) => a + 1);
                }}
              >
                ↺ {tl('tryAgain')}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
