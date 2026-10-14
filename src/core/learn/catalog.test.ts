import { describe, expect, it } from 'vitest';
import {
  completionRatio,
  isUnlocked,
  lessonAfter,
  nextLesson,
  validateCatalog,
  type Catalog,
  type LessonMeta,
} from './catalog';

const t = { vi: 'x', en: 'x', ja: 'x' };
const lesson = (id: string, requires: string[] = []): LessonMeta => ({
  id,
  emoji: '♟',
  minutes: 3,
  requires,
  title: t,
  summary: t,
  quiz: [],
});
const catalog: Catalog = {
  chapters: [
    { id: 'c1', emoji: '1', title: t, lessons: [lesson('a'), lesson('b', ['a'])] },
    { id: 'c2', emoji: '2', title: t, lessons: [lesson('c', ['b'])] },
  ],
};

describe('core/learn/catalog', () => {
  it('unlocks lessons once their prerequisites are done', () => {
    expect(isUnlocked(lesson('b', ['a']), {})).toBe(false);
    expect(isUnlocked(lesson('b', ['a']), { a: { completedAt: 1, score: 1 } })).toBe(true);
  });

  it('finds the next lesson and the lesson after', () => {
    expect(nextLesson(catalog, {})?.id).toBe('a');
    expect(nextLesson(catalog, { a: { completedAt: 1, score: 1 } })?.id).toBe('b');
    const all = {
      a: { completedAt: 1, score: 1 },
      b: { completedAt: 1, score: 1 },
      c: { completedAt: 1, score: 1 },
    };
    expect(nextLesson(catalog, all)).toBeNull();
    expect(lessonAfter(catalog, 'b')?.id).toBe('c');
    expect(lessonAfter(catalog, 'c')).toBeNull();
  });

  it('computes completion', () => {
    expect(
      completionRatio(catalog.chapters[0].lessons, { a: { completedAt: 1, score: 0.5 } }),
    ).toBe(0.5);
  });

  it('reports catalog problems', () => {
    expect(validateCatalog(catalog)).toEqual([]);
    const bad: Catalog = {
      chapters: [{ ...catalog.chapters[0], lessons: [lesson('a', ['zz']), lesson('a')] }],
    };
    expect(validateCatalog(bad)).toEqual(['duplicate lesson id a', 'a requires unknown lesson zz']);
  });
});
