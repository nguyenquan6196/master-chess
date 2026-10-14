import { existsSync, readFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import catalogJson from '../../../content/learn/catalog.json';
import questionsJson from '../../../content/quiz/questions.json';
import { positionsFromSan, START_FEN } from '../chess/game';
import { checkMove, correctSquares, QuizQuestionsSchema } from '../quiz/quiz';
import { allLessons, CatalogSchema, validateCatalog } from './catalog';

/**
 * Validates every lesson: catalog integrity, an MDX file per language, and every board,
 * exercise and move sequence used inside the MDX.
 */
const catalog = CatalogSchema.parse(catalogJson);
const questions = QuizQuestionsSchema.parse(questionsJson);
const LOCALES = ['vi', 'en', 'ja'] as const;
const path = (locale: string, id: string) => `content/learn/${locale}/${id}.mdx`;

/** Attributes of every `<Tag …>` occurrence (string attributes and bare booleans). */
function tags(src: string, tag: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>`, 'g');
  for (const m of src.matchAll(re)) {
    const attrs: Record<string, string> = {};
    for (const a of m[1].matchAll(/(\w+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? 'true';
    out.push(attrs);
  }
  return out;
}

describe('content/learn catalog', () => {
  it('is consistent', () => {
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it('only references existing quiz questions', () => {
    const ids = new Set(questions.map((q) => q.id));
    for (const l of allLessons(catalog)) {
      for (const q of l.quiz) expect(ids.has(q), `${l.id}: ${q}`).toBe(true);
    }
  });
});

describe.each(LOCALES)('content/learn/%s', (locale) => {
  const lessons = allLessons(catalog);

  it.each(lessons.map((l) => l.id))('%s exists and its boards/exercises are valid', (id) => {
    const file = path(locale, id);
    expect(existsSync(file), file).toBe(true);
    const src = readFileSync(file, 'utf8');

    for (const b of tags(src, 'Board')) {
      const fen = b.fen ?? START_FEN;
      expect(() => new Chess(fen, { skipValidation: true }), `${file} Board ${fen}`).not.toThrow();
    }

    for (const s of tags(src, 'MoveSequence')) {
      const sans = (s.moves ?? '').split(/\s+/).filter(Boolean);
      const line = positionsFromSan(sans, s.fen ?? START_FEN);
      expect(line.length - 1, `${file} MoveSequence "${s.moves}"`).toBe(sans.length);
    }

    for (const e of tags(src, 'Exercise')) {
      const label = `${file} Exercise ${e.fen}`;
      expect(() => new Chess(e.fen), label).not.toThrow();
      if (e.kind === 'make-move') {
        const answers = (e.answers ?? '').split(/[\s,]+/).filter(Boolean);
        expect(answers.length, label).toBeGreaterThan(0);
        const q = {
          id: 'x',
          kind: 'make-move' as const,
          topic: 'rules' as const,
          level: 1 as const,
          fen: e.fen,
          answers,
          mate: e.mate === 'true',
        };
        for (const a of answers) expect(checkMove(q, a), `${label} ${a}`).toBe(true);
      } else {
        expect(e.kind, label).toBe('select-squares');
        const q = {
          id: 'x',
          kind: 'select-squares' as const,
          topic: 'pieces' as const,
          level: 1 as const,
          fen: e.fen,
          square: e.square,
        };
        expect(new Chess(e.fen).get(e.square as never), label).toBeTruthy();
        expect(correctSquares(q).length, label).toBeGreaterThan(0);
      }
    }
  });
});
