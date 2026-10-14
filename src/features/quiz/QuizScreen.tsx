'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Confetti } from '@/components/ui/Confetti';
import {
  pickQuiz,
  QUIZ_TOPICS,
  type QuizQuestion,
  type QuizText,
  type QuizTopic,
} from '@/core/quiz/quiz';
import { playSfx } from '@/services/audio/sfx';
import { useSession } from '@/services/profile/session';
import { saveQuizScore } from '@/services/puzzles/puzzles';
import { loadQuizTexts, QUIZ_QUESTIONS } from '@/services/quiz/quizContent';
import { useSettings } from '@/services/settings/store';
import { QuestionView } from '@/components/board/QuestionView';

const QUESTIONS_PER_ROUND = 10;
type TopicKey = QuizTopic | 'all';

export function QuizScreen() {
  const t = useTranslations('quiz');
  const tt = useTranslations('quizTopics');
  const tg = useTranslations('game');
  const locale = useSettings((s) => s.locale);
  const quizBest = useSession((s) => s.profile?.quizBest ?? {});
  const [texts, setTexts] = useState<Record<string, QuizText> | null>(null);
  const [topic, setTopic] = useState<TopicKey | null>(null);
  const [round, setRound] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [newBest, setNewBest] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadQuizTexts(locale).then((tx) => !cancelled && setTexts(tx));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  function start(k: TopicKey) {
    setTopic(k);
    setRound(pickQuiz(QUIZ_QUESTIONS, k === 'all' ? null : k, QUESTIONS_PER_ROUND));
    setIndex(0);
    setResults([]);
    setAnswered(null);
    setNewBest(false);
  }

  function onAnswer(correct: boolean) {
    setAnswered(correct);
    playSfx(correct ? 'notify' : 'illegal');
  }

  async function next() {
    if (answered === null || !topic) return;
    const all = [...results, answered];
    setResults(all);
    setAnswered(null);
    if (index + 1 < round.length) {
      setIndex(index + 1);
      return;
    }
    setIndex(round.length);
    const ratio = all.filter(Boolean).length / all.length;
    playSfx(ratio >= 0.7 ? 'win' : 'draw');
    const profile = useSession.getState().profile;
    if (profile) setNewBest(await saveQuizScore(profile, topic, ratio));
  }

  if (!topic) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl font-bold">📝 {t('title')}</h1>
        <h2 className="text-sm font-semibold text-muted">{t('chooseTopic')}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(['all', ...QUIZ_TOPICS] as TopicKey[]).map((k) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => start(k)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left transition-transform hover:-translate-y-0.5 hover:border-accent"
              >
                <span className="font-display text-lg font-semibold">{tt(k)}</span>
                {quizBest[k] !== undefined && (
                  <span className="text-xs text-muted">
                    {t('best', { percent: Math.round((quizBest[k] ?? 0) * 100) })}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (index >= round.length) {
    const correct = results.filter(Boolean).length;
    return (
      <Card className="relative mx-auto mt-6 flex max-w-md flex-col items-center gap-3 text-center">
        <Confetti trigger={correct / round.length >= 0.7 ? correct + 1 : null} />
        <p className="text-5xl" aria-hidden>
          {correct / round.length >= 0.7 ? '🏆' : '📚'}
        </p>
        <h1 className="font-display text-2xl font-bold">
          {t('result', { correct, total: round.length })}
        </h1>
        {newBest && <p className="font-semibold text-accent">🏆</p>}
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => start(topic)}>
            {t('again')}
          </Button>
          <Button onClick={() => setTopic(null)}>{t('otherTopic')}</Button>
        </div>
      </Card>
    );
  }

  const q = round[index];
  const text = texts?.[q.id];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">{tt(topic)}</h1>
        <span className="text-sm font-semibold text-muted">
          {t('question', { current: index + 1, total: round.length })}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${(index / round.length) * 100}%` }}
        />
      </div>
      {text && (
        <QuestionView
          key={q.id}
          question={q}
          text={text}
          answered={answered}
          onAnswer={onAnswer}
          labels={{
            selectHint: t('selectHint'),
            moveHint: t('moveHint'),
            check: t('check'),
            promotion: {
              title: tg('choosePromotion'),
              cancel: tg('cancel'),
              pieces: {
                q: tg('pieces.q'),
                r: tg('pieces.r'),
                b: tg('pieces.b'),
                n: tg('pieces.n'),
              },
            },
          }}
        />
      )}
      {answered !== null && (
        <Card className={cn('flex flex-col gap-2', answered ? 'border-accent' : 'border-danger')}>
          <p
            className={cn(
              'font-display text-lg font-bold',
              answered ? 'text-accent' : 'text-danger',
            )}
          >
            {answered ? t('correct') : t('wrong')}
          </p>
          {text && <p className="text-sm">{text.explanation}</p>}
          <div>
            <Button variant="primary" onClick={() => void next()}>
              {index + 1 < round.length ? t('next') : t('finish')} →
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
