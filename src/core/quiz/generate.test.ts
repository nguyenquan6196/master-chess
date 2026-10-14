import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { seededRng } from '../bot/choose';
import {
  GEN_KINDS,
  GENERATOR_TOPICS,
  generateQuestion,
  generateRound,
  PIECE_VALUES,
} from './generate';
import { checkChoice, checkMove, correctSquares, QUIZ_TOPICS } from './quiz';

const SAMPLES = 40;

describe('core/quiz/generate', () => {
  it.each(GEN_KINDS)('%s produces valid, answerable questions', (kind) => {
    const rng = seededRng(kind.length * 7919);
    let made = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const g = generateQuestion(kind, rng);
      if (!g) continue;
      made++;
      const q = g.question;
      if ('fen' in q && q.fen) expect(() => new Chess(q.fen as string), q.fen).not.toThrow();
      if (q.kind === 'select-squares') {
        expect(correctSquares(q).length).toBeGreaterThan(0);
      } else if (q.kind === 'make-move') {
        expect(q.answers.length).toBeGreaterThan(0);
        for (const a of q.answers) expect(checkMove(q, a), `${kind} ${q.fen} ${a}`).toBe(true);
      } else {
        expect(q.choices).toContain(q.answer);
        expect(new Set(q.choices).size).toBe(q.choices.length);
        expect(checkChoice(q, q.answer)).toBe(true);
        for (const c of q.choices) expect(g.text.choiceLabels?.[c]).toBeDefined();
      }
    }
    expect(made).toBeGreaterThan(SAMPLES * 0.8);
  });

  it('classifies positions correctly', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 30; i++) {
      const g = generateQuestion('positionStatus', rng);
      if (!g || g.question.kind !== 'choice' || !g.question.fen) continue;
      const c = new Chess(g.question.fen);
      const expected = c.isCheckmate()
        ? 'checkmate'
        : c.isStalemate()
          ? 'stalemate'
          : c.inCheck()
            ? 'check'
            : 'none';
      expect(g.question.answer).toBe(expected);
    }
  });

  it('computes material differences', () => {
    const rng = seededRng(5);
    for (let i = 0; i < 30; i++) {
      const g = generateQuestion('materialCount', rng);
      if (!g || g.question.kind !== 'choice' || !g.question.fen) continue;
      let diff = 0;
      for (const row of new Chess(g.question.fen).board())
        for (const p of row) if (p) diff += (p.color === 'w' ? 1 : -1) * PIECE_VALUES[p.type];
      const key = diff === 0 ? 'equal' : diff > 0 ? `w${diff}` : `b${-diff}`;
      expect(g.question.answer).toBe(key);
    }
  });

  it('only accepts mating moves for mate in 1', () => {
    const rng = seededRng(11);
    for (let i = 0; i < 15; i++) {
      const g = generateQuestion('mateIn1', rng);
      if (!g || g.question.kind !== 'make-move') continue;
      for (const a of g.question.answers) {
        const c = new Chess(g.question.fen);
        c.move({ from: a.slice(0, 2), to: a.slice(2, 4), promotion: a[4] });
        expect(c.isCheckmate()).toBe(true);
      }
    }
  });

  it('builds full rounds for every topic', () => {
    for (const topic of QUIZ_TOPICS) {
      const round = generateRound(topic, 10, seededRng(42));
      expect(round.length).toBe(10);
      expect(round.every((g) => GENERATOR_TOPICS[topic].includes(g.text.key))).toBe(true);
      expect(new Set(round.map((g) => g.question.id)).size).toBe(10);
    }
  });
});
