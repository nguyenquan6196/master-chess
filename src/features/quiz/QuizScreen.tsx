'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { QuestionView } from '@/components/board/QuestionView';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Confetti } from '@/components/ui/Confetti';
import { generateRound, type GenText } from '@/core/quiz/generate';
import {
  answerSan,
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
import { useHistoryStep } from '@/services/navigation/historyStep';
import { useSettings } from '@/services/settings/store';

const QUESTIONS_PER_ROUND = 10;
type TopicKey = QuizTopic | 'all';

const TOPIC_ICONS: Record<TopicKey, string> = {
  all: '🎲',
  pieces: '♞',
  rules: '📜',
  notation: '🔤',
  strategy: '🧠',
  tactics: '🗡️',
};

interface RoundItem {
  question: QuizQuestion;
  /** Present for machine-generated questions. */
  gen?: GenText;
}

interface Round {
  mode: 'bank' | 'gen';
  topic: TopicKey;
  items: RoundItem[];
}

/** Score key: "<topic>" for written questions, "gen:<topic>" for generated ones. */
const scoreKey = (r: Pick<Round, 'mode' | 'topic'>) =>
  r.mode === 'gen' ? `gen:${r.topic}` : r.topic;

function TopicCard({
  icon,
  title,
  desc,
  best,
  onClick,
}: {
  icon: string;
  title: string;
  desc?: string;
  best?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-transform hover:-translate-y-0.5 hover:border-accent"
    >
      <span aria-hidden className="text-2xl">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold">{title}</span>
        {desc && <span className="mt-0.5 block text-sm text-muted">{desc}</span>}
      </span>
      {best && <span className="shrink-0 text-xs text-muted">{best}</span>}
    </button>
  );
}

export function QuizScreen() {
  const t = useTranslations('quiz');
  const tt = useTranslations('quizTopics');
  const tgen = useTranslations('quizGen');
  const tg = useTranslations('game');
  const tn = useTranslations('nav');
  const locale = useSettings((s) => s.locale);
  const quizBest = useSession((s) => s.profile?.quizBest ?? {});
  const [texts, setTexts] = useState<Record<string, QuizText> | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [newBest, setNewBest] = useState(false);
  useHistoryStep(round !== null, () => setRound(null));

  useEffect(() => {
    let cancelled = false;
    void loadQuizTexts(locale).then((tx) => !cancelled && setTexts(tx));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  function start(mode: Round['mode'], topic: TopicKey) {
    const items: RoundItem[] =
      mode === 'bank'
        ? pickQuiz(QUIZ_QUESTIONS, topic === 'all' ? null : topic, QUESTIONS_PER_ROUND).map(
            (question) => ({
              question,
            }),
          )
        : generateRound(topic as QuizTopic, QUESTIONS_PER_ROUND).map((g) => ({
            question: g.question,
            gen: g.text,
          }));
    setRound({ mode, topic, items });
    setIndex(0);
    setResults([]);
    setAnswered(null);
    setNewBest(false);
  }

  /** Generated keys are built at runtime (validated by the generator tests + check-i18n). */
  const tDyn = tgen as unknown as (key: string, values?: Record<string, string | number>) => string;

  /** Builds the displayed text of a generated question in the current language. */
  function genText(g: GenText): QuizText {
    const params = { ...g.params };
    if (typeof params.piece === 'string') params.piece = tDyn(`labels.piece.${params.piece}`);
    return {
      prompt: tDyn(`prompt.${g.key}`, params),
      explanation: tDyn(`explain.${g.key}`),
      choices: g.choiceLabels
        ? Object.fromEntries(
            Object.entries(g.choiceLabels).map(([k, l]) => [k, tDyn(`labels.${l.key}`, l.params)]),
          )
        : undefined,
    };
  }

  function onAnswer(correct: boolean) {
    setAnswered(correct);
    playSfx(correct ? 'notify' : 'illegal');
  }

  async function next() {
    if (answered === null || !round) return;
    const all = [...results, answered];
    setResults(all);
    setAnswered(null);
    if (index + 1 < round.items.length) {
      setIndex(index + 1);
      return;
    }
    setIndex(round.items.length);
    const ratio = all.filter(Boolean).length / all.length;
    playSfx(ratio >= 0.7 ? 'win' : 'draw');
    const profile = useSession.getState().profile;
    if (profile) setNewBest(await saveQuizScore(profile, scoreKey(round), ratio));
  }

  const bestLabel = (key: string) =>
    quizBest[key] !== undefined
      ? t('best', { percent: Math.round((quizBest[key] ?? 0) * 100) })
      : undefined;

  if (!round) {
    const bankCount = (k: TopicKey) =>
      k === 'all' ? QUIZ_QUESTIONS.length : QUIZ_QUESTIONS.filter((q) => q.topic === k).length;
    return (
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <BackButton href="/practice" label={tn('practice')} />
          <h1 className="font-display text-3xl font-bold">📝 {t('title')}</h1>
          <h2 className="text-sm font-semibold text-muted">{t('chooseTopic')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(['all', ...QUIZ_TOPICS] as TopicKey[]).map((k) => (
              <li key={k}>
                <TopicCard
                  icon={TOPIC_ICONS[k]}
                  title={tt(k)}
                  desc={t('count', { count: bankCount(k) })}
                  best={bestLabel(k)}
                  onClick={() => start('bank', k)}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <div>
            <h2 className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold">
              {tgen('title')}
              <span className="rounded-full bg-surface-2 px-2 py-0.5 font-sans text-xs font-semibold text-muted">
                {tgen('badge')}
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted">{tgen('subtitle')}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUIZ_TOPICS.map((k) => (
              <li key={k}>
                <TopicCard
                  icon={TOPIC_ICONS[k]}
                  title={tt(k)}
                  desc={tgen(`topicDesc.${k}`)}
                  best={bestLabel(`gen:${k}`)}
                  onClick={() => start('gen', k)}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  const total = round.items.length;

  if (index >= total) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="flex flex-col gap-4">
        <BackButton onClick={() => setRound(null)} label={t('topics')} />
        <Card className="relative mx-auto mt-6 flex max-w-md flex-col items-center gap-3 text-center">
          <Confetti trigger={correct / total >= 0.7 ? correct + 1 : null} />
          <p className="text-5xl" aria-hidden>
            {correct / total >= 0.7 ? '🏆' : '📚'}
          </p>
          <h1 className="font-display text-2xl font-bold">{t('result', { correct, total })}</h1>
          {newBest && <p className="font-semibold text-accent">🏆</p>}
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => start(round.mode, round.topic)}>
              {t('again')}
            </Button>
            <Button onClick={() => setRound(null)}>{t('otherTopic')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const { question: q, gen } = round.items[index];
  const text = gen ? genText(gen) : texts?.[q.id];
  const answerMove = q.kind === 'make-move' && answered === false ? answerSan(q) : null;

  return (
    <div className="flex flex-col gap-4">
      <BackButton onClick={() => setRound(null)} label={t('topics')} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          {tt(round.topic)}
          {round.mode === 'gen' && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-sans text-xs font-semibold text-muted">
              {tgen('badge')}
            </span>
          )}
        </h1>
        <span className="text-sm font-semibold text-muted">
          {t('question', { current: index + 1, total })}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
      {text && (
        <QuestionView
          key={`${round.mode}-${index}-${q.id}`}
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
          {answerMove && <p className="font-semibold">{t('answerWas', { move: answerMove })}</p>}
          {text && <p className="text-sm">{text.explanation}</p>}
          <div>
            <Button variant="primary" onClick={() => void next()}>
              {index + 1 < total ? t('next') : t('finish')} →
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
