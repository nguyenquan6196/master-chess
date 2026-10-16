'use client';

import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import {
  allLessons,
  completionRatio,
  isCompleted,
  isUnlocked,
  nextLesson,
  type LessonProgress,
} from '@/core/learn/catalog';
import { CATALOG } from '@/services/learn/learn';
import { useSession } from '@/services/profile/session';
import { useSettings } from '@/services/settings/store';

const EMPTY: LessonProgress = {};

export function LearnHub() {
  const t = useTranslations('learn');
  const locale = useSettings((s) => s.locale);
  const progress = useSession((s) => s.profile?.lessons ?? EMPTY);
  const lessons = allLessons(CATALOG);
  const done = lessons.filter((l) => isCompleted(l.id, progress)).length;
  const next = nextLesson(CATALOG, progress);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold">📖 {t('title')}</h1>
        <p className="max-w-2xl text-muted">{t('subtitle')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-3 w-64 max-w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${completionRatio(lessons, progress) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {t('progress', { done, total: lessons.length })}
          </span>
          {next ? (
            <Link
              href={`/learn/${next.id}`}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
            >
              {done === 0 ? t('start') : t('continue')}: {next.emoji} {next.title[locale]} →
            </Link>
          ) : (
            <span className="font-semibold text-accent">{t('allDone')}</span>
          )}
        </div>
      </section>

      {CATALOG.chapters.map((chapter) => {
        const chapterDone = chapter.lessons.filter((l) => isCompleted(l.id, progress)).length;
        return (
          <section key={chapter.id} className="flex flex-col gap-3">
            <h2 className="flex items-baseline gap-3 font-display text-2xl font-bold">
              <span aria-hidden>{chapter.emoji}</span>
              {chapter.title[locale]}
              <span className="text-sm font-normal text-muted tabular-nums">
                {t('progress', { done: chapterDone, total: chapter.lessons.length })}
              </span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chapter.lessons.map((lesson) => {
                const completed = isCompleted(lesson.id, progress);
                const unlocked = isUnlocked(lesson, progress);
                const body = (
                  <Card
                    className={cn(
                      'flex h-full items-start gap-3 p-4',
                      unlocked && 'mc-lift',
                      completed && 'border-accent',
                      !unlocked && 'opacity-55',
                    )}
                  >
                    <span className="text-3xl" aria-hidden>
                      {unlocked ? lesson.emoji : '🔒'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg font-semibold">
                        {lesson.title[locale]}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {lesson.summary[locale]}
                      </span>
                      <span className="mt-2 flex gap-2 text-xs font-semibold">
                        <span className="text-muted">
                          ⏱ {t('minutes', { minutes: lesson.minutes })}
                        </span>
                        {completed && <span className="text-accent">✓ {t('completed')}</span>}
                      </span>
                    </span>
                  </Card>
                );
                return (
                  <li key={lesson.id}>
                    {unlocked ? (
                      <Link href={`/learn/${lesson.id}`} className="group block h-full">
                        {body}
                      </Link>
                    ) : (
                      <div aria-disabled className="h-full cursor-not-allowed">
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
