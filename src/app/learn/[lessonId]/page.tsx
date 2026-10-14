import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { allLessons, findLesson } from '@/core/learn/catalog';
import { LessonScreen } from '@/features/learn/LessonScreen';
import { LOCALES, type Locale } from '@/services/i18n/config';
import { CATALOG } from '@/services/learn/learn';

export function generateStaticParams() {
  return allLessons(CATALOG).map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({
  params,
}: PageProps<'/learn/[lessonId]'>): Promise<Metadata> {
  const { lessonId } = await params;
  const found = findLesson(CATALOG, lessonId);
  return { title: found ? found.lesson.title.en : 'Lesson' };
}

/** Renders every available translation; the client shows the player's language. */
async function loadContent(lessonId: string): Promise<Partial<Record<Locale, ReactNode>>> {
  const entries = await Promise.all(
    LOCALES.map(async (locale) => {
      try {
        const mod = await import(`../../../../content/learn/${locale}/${lessonId}.mdx`);
        const Lesson = mod.default as () => ReactNode;
        return [locale, <Lesson key={locale} />] as const;
      } catch {
        return [locale, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export default async function LessonPage({ params }: PageProps<'/learn/[lessonId]'>) {
  const { lessonId } = await params;
  if (!findLesson(CATALOG, lessonId)) notFound();
  return <LessonScreen lessonId={lessonId} content={await loadContent(lessonId)} />;
}
