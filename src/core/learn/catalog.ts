import { z } from 'zod';

/**
 * Lesson catalog (content/learn/catalog.json). Lesson bodies are MDX files at
 * content/learn/<locale>/<lessonId>.mdx; titles live here so lists don't load every lesson.
 */
const Localized = z.object({ vi: z.string().min(1), en: z.string().min(1), ja: z.string().min(1) });
export type Localized = z.infer<typeof Localized>;

export const LessonMetaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  emoji: z.string().min(1),
  minutes: z.number().int().positive(),
  /** Lessons that must be completed first. */
  requires: z.array(z.string()),
  title: Localized,
  summary: Localized,
  /** Quiz bank ids (content/quiz/questions.json) asked at the end of the lesson. */
  quiz: z.array(z.string()),
  /** Puzzle theme to practise afterwards (Lichess theme key), if any. */
  practiceTheme: z.string().optional(),
});
export type LessonMeta = z.infer<typeof LessonMetaSchema>;

export const ChapterSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  title: Localized,
  lessons: z.array(LessonMetaSchema).min(1),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const CatalogSchema = z.object({ chapters: z.array(ChapterSchema).min(1) });
export type Catalog = z.infer<typeof CatalogSchema>;

/** Progress per lesson id (stored on the profile). */
export type LessonProgress = Record<string, { completedAt: number; score: number }>;

export function allLessons(catalog: Catalog): LessonMeta[] {
  return catalog.chapters.flatMap((c) => c.lessons);
}

export function findLesson(
  catalog: Catalog,
  id: string,
): { lesson: LessonMeta; chapter: Chapter; index: number } | null {
  const list = allLessons(catalog);
  const index = list.findIndex((l) => l.id === id);
  if (index < 0) return null;
  const chapter = catalog.chapters.find((c) => c.lessons.some((l) => l.id === id));
  return chapter ? { lesson: list[index], chapter, index } : null;
}

export function isUnlocked(lesson: LessonMeta, progress: LessonProgress): boolean {
  return lesson.requires.every((r) => progress[r] !== undefined);
}

export function isCompleted(lessonId: string, progress: LessonProgress): boolean {
  return progress[lessonId] !== undefined;
}

/** Share of completed lessons in [0, 1]. */
export function completionRatio(lessons: readonly LessonMeta[], progress: LessonProgress): number {
  if (lessons.length === 0) return 0;
  return lessons.filter((l) => isCompleted(l.id, progress)).length / lessons.length;
}

/** First unlocked lesson that is not completed yet (where "Continue" should go). */
export function nextLesson(catalog: Catalog, progress: LessonProgress): LessonMeta | null {
  return (
    allLessons(catalog).find((l) => !isCompleted(l.id, progress) && isUnlocked(l, progress)) ?? null
  );
}

/** The lesson after `id` in catalog order. */
export function lessonAfter(catalog: Catalog, id: string): LessonMeta | null {
  const list = allLessons(catalog);
  const i = list.findIndex((l) => l.id === id);
  return i >= 0 ? (list[i + 1] ?? null) : null;
}

/** Checks catalog integrity: unique ids, known prerequisites, no prerequisite cycles. */
export function validateCatalog(catalog: Catalog): string[] {
  const errors: string[] = [];
  const list = allLessons(catalog);
  const ids = new Set<string>();
  for (const l of list) {
    if (ids.has(l.id)) errors.push(`duplicate lesson id ${l.id}`);
    ids.add(l.id);
  }
  const seen = new Set<string>();
  for (const l of list) {
    for (const r of l.requires) {
      if (!ids.has(r)) errors.push(`${l.id} requires unknown lesson ${r}`);
      else if (!seen.has(r)) errors.push(`${l.id} requires ${r}, which comes later in the catalog`);
    }
    seen.add(l.id);
  }
  return errors;
}
