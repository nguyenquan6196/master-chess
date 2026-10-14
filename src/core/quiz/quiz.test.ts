import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import en from '../../../content/quiz/en.json';
import ja from '../../../content/quiz/ja.json';
import questionsJson from '../../../content/quiz/questions.json';
import vi from '../../../content/quiz/vi.json';
import { seededRng } from '../bot/choose';
import { uciToMove } from '../chess/game';
import {
  checkChoice,
  checkMove,
  checkSquares,
  correctSquares,
  pickQuiz,
  QuizQuestionsSchema,
  QuizTextsSchema,
  type QuizQuestion,
} from './quiz';

const questions = QuizQuestionsSchema.parse(questionsJson);
const texts = { vi, en, ja };

describe('content/quiz (data validation)', () => {
  it('has unique ids', () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(Object.entries(texts))('%s texts cover every question and choice', (_, raw) => {
    const t = QuizTextsSchema.parse(raw);
    expect(Object.keys(t).sort()).toEqual(questions.map((q) => q.id).sort());
    for (const q of questions) {
      if (q.kind === 'choice') {
        expect(Object.keys(t[q.id].choices ?? {}).sort(), q.id).toEqual([...q.choices].sort());
        expect(q.choices, q.id).toContain(q.answer);
      }
    }
  });

  it('uses valid positions and legal answers', () => {
    for (const q of questions) {
      if (!('fen' in q) || !q.fen) continue;
      const chess = new Chess(q.fen);
      // The side that just moved can never be left in check.
      const idle = chess.turn() === 'w' ? 'b' : 'w';
      const idleKing = chess.findPiece({ type: 'k', color: idle })[0];
      expect(chess.isAttacked(idleKing, chess.turn()), `${q.id} illegal check`).toBe(false);
      if (q.kind === 'select-squares') {
        expect(chess.get(q.square as never), q.id).toBeTruthy();
        expect(correctSquares(q).length, q.id).toBeGreaterThan(0);
      }
      if (q.kind === 'make-move') {
        for (const a of q.answers) expect(checkMove(q, a), `${q.id} ${a}`).toBe(true);
        if (q.mate) {
          const c = new Chess(q.fen);
          c.move(uciToMove(q.answers[0]));
          expect(c.isCheckmate(), q.id).toBe(true);
        }
      }
    }
  });
});

describe('core/quiz', () => {
  const knight = questions.find((q) => q.id === 'sq-knight-corner') as Extract<
    QuizQuestion,
    { kind: 'select-squares' }
  >;

  it('checks square selections', () => {
    expect(correctSquares(knight)).toEqual(['b3', 'c2']);
    expect(checkSquares(knight, ['b3', 'c2']).correct).toBe(true);
    const partial = checkSquares(knight, ['b3', 'a3']);
    expect(partial).toMatchObject({ correct: false, hits: ['b3'], missed: ['c2'], wrong: ['a3'] });
  });

  it('checks moves and choices', () => {
    const castle = questions.find((q) => q.id === 'mv-castle-short') as Extract<
      QuizQuestion,
      { kind: 'make-move' }
    >;
    expect(checkMove(castle, 'e1g1')).toBe(true);
    expect(checkMove(castle, 'e1f1')).toBe(false);
    const value = questions.find((q) => q.id === 'value-queen') as Extract<
      QuizQuestion,
      { kind: 'choice' }
    >;
    expect(checkChoice(value, '9')).toBe(true);
    expect(checkChoice(value, '5')).toBe(false);
  });

  it('picks a topic subset sorted by level', () => {
    const picked = pickQuiz(questions, 'tactics', 5, seededRng(3));
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.every((q) => q.topic === 'tactics')).toBe(true);
    expect(picked.map((q) => q.level)).toEqual([...picked.map((q) => q.level)].sort());
  });
});
