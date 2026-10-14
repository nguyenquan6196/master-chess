'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { QuestionView } from '@/components/board/QuestionView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Confetti } from '@/components/ui/Confetti';
import { findLesson, isUnlocked, lessonAfter, type LessonProgress } from '@/core/learn/catalog';
import type { QuizText } from '@/core/quiz/quiz';
import { playSfx } from '@/services/audio/sfx';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/services/i18n/config';
import { CATALOG, completeLesson } from '@/services/learn/learn';
import { useSession } from '@/services/profile/session';
import { loadQuizTexts, QUIZ_QUESTIONS } from '@/services/quiz/quizContent';
import { useSettings } from '@/services/settings/store';
import { usePromotionLabels } from './mdx/LessonBoard';

const EMPTY: LessonProgress = {};
/** Fallback order when a lesson has no translation for the current language. */
const FALLBACK: readonly Locale[] = ['en', 'vi', 'ja'];

interface LessonScreenProps {
  lessonId: string;
  /** Rendered MDX per language (null when that translation doesn't exist). */
  content: Partial<Record<Locale, ReactNode>>;
}

export function LessonScreen({ lessonId, content }: LessonScreenProps) {
  const t = useTranslations('learn');
  const tq = useTranslations('quiz');
  const tt = useTranslations('puzzleThemes');
  const promotion = usePromotionLabels();
  const locale = useSettings((s) => s.locale);
  const progress = useSession((s) => s.profile?.lessons ?? EMPTY);
  const [texts, setTexts] = useState<Record<string, QuizText> | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadQuizTexts(locale).then((tx) => !cancelled && setTexts(tx));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const found = findLesson(CATALOG, lessonId);
  if (!found) return null;
  const { lesson, chapter } = found;

  if (!isUnlocked(lesson, progress)) {
    const missing = lesson.requires.find((r) => !progress[r]);
    const missingLesson = missing ? findLesson(CATALOG, missing)?.lesson : null;
    return (
      <Card className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-5xl" aria-hidden>
          🔒
        </p>
        <h1 className="font-display text-2xl font-bold">{lesson.title[locale]}</h1>
        {missingLesson && (
          <>
            <p className="text-muted">{t('locked', { lesson: missingLesson.title[locale] })}</p>
            <Link
              href={`/learn/${missingLesson.id}`}
              className="font-semibold text-accent underline"
            >
              {missingLesson.emoji} {t('goToLesson')}
            </Link>
          </>
        )}
      </Card>
    );
  }

  const shownLocale: Locale = content[locale]
    ? locale
    : (FALLBACK.find((l) => content[l]) ?? (LOCALES.find((l) => content[l]) as Locale));
  const questions = lesson.quiz
    .map((id) => QUIZ_QUESTIONS.find((q) => q.id === id))
    .filter((q) => q !== undefined);
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const score = questions.length
    ? questions.filter((q) => answers[q.id]).length / questions.length
    : 1;
  const next = lessonAfter(CATALOG, lesson.id);
  const wasCompleted = progress[lesson.id] !== undefined;

  async function finish() {
    const profile = useSession.getState().profile;
    if (!profile) return;
    await completeLesson(profile, lesson.id, score);
    setFinished(true);
    playSfx('win');
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/learn" className="text-sm font-semibold text-muted hover:text-fg">
          ← {chapter.emoji} {chapter.title[locale]}
        </Link>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          <span aria-hidden className="mr-2">
            {lesson.emoji}
          </span>
          {lesson.title[locale]}
        </h1>
        <p className="flex flex-wrap gap-3 text-sm text-muted">
          <span>⏱ {t('minutes', { minutes: lesson.minutes })}</span>
          {wasCompleted && <span className="font-semibold text-accent">✓ {t('completed')}</span>}
        </p>
      </header>

      {shownLocale !== locale && (
        <Card className="p-3 text-sm">
          🌐 {t('noTranslation', { language: LOCALE_LABELS[shownLocale] })}
        </Card>
      )}

      <div className="lesson-content" lang={shownLocale}>
        {content[shownLocale]}
      </div>

      {questions.length > 0 && texts && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold">✅ {t('quizTitle')}</h2>
          {questions.map((q, i) => {
            const text = texts[q.id];
            const answered = answers[q.id] ?? null;
            if (!text) return null;
            return (
              <Card
                key={q.id}
                className={cn(
                  'flex flex-col gap-3',
                  answered === true && 'border-accent',
                  answered === false && 'border-danger',
                )}
              >
                <p className="text-xs font-bold text-muted">
                  {i + 1}/{questions.length}
                </p>
                <QuestionView
                  compact
                  question={q}
                  text={text}
                  answered={answered}
                  onAnswer={(ok) => {
                    setAnswers((a) => ({ ...a, [q.id]: ok }));
                    playSfx(ok ? 'notify' : 'illegal');
                  }}
                  labels={{
                    selectHint: tq('selectHint'),
                    moveHint: tq('moveHint'),
                    check: tq('check'),
                    promotion,
                  }}
                />
                {answered !== null && (
                  <p className="text-sm">
                    <span className={cn('font-semibold', answered ? 'text-accent' : 'text-danger')}>
                      {answered ? tq('correct') : tq('wrong')}
                    </span>{' '}
                    {text.explanation}
                  </p>
                )}
              </Card>
            );
          })}
        </section>
      )}

      <Card className="relative flex flex-col items-start gap-3">
        <Confetti trigger={finished ? 1 : null} />
        {finished ? (
          <>
            <p className="font-display text-2xl font-bold">{t('finished')}</p>
            {questions.length > 0 && (
              <p className="text-muted">{t('score', { percent: Math.round(score * 100) })}</p>
            )}
          </>
        ) : (
          <>
            {!allAnswered && <p className="text-sm text-muted">{t('answerAll')}</p>}
            <Button variant="primary" disabled={!allAnswered} onClick={() => void finish()}>
              🎓 {t('finish')}
            </Button>
          </>
        )}
        {(finished || wasCompleted) && (
          <div className="flex flex-wrap gap-2">
            {next && (
              <Link
                href={`/learn/${next.id}`}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
              >
                {t('nextLesson')}: {next.emoji} {next.title[locale]} →
              </Link>
            )}
            {lesson.practiceTheme && tt.has(lesson.practiceTheme as never) && (
              <Link
                href={`/practice/themes#${lesson.practiceTheme}`}
                className="rounded-lg bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-border"
              >
                🎯 {t('practiceMore', { theme: tt(lesson.practiceTheme as never) })}
              </Link>
            )}
            <Link
              href="/learn"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-muted hover:text-fg"
            >
              {t('backToLessons')}
            </Link>
          </div>
        )}
      </Card>
    </article>
  );
}
