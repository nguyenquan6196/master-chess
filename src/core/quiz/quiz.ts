import { Chess } from 'chess.js';
import { z } from 'zod';
import type { Rng } from '../bot/choose';
import { legalTargets, moveToUci, uciToMove, type Square } from '../chess/game';

/**
 * Quiz content (spec §5.1). Structure is language-independent (content/quiz/questions.json);
 * texts live per locale (content/quiz/<locale>.json) keyed by question id.
 */
export const QUIZ_TOPICS = ['pieces', 'rules', 'notation', 'strategy', 'tactics'] as const;
export type QuizTopic = (typeof QUIZ_TOPICS)[number];

const Base = {
  id: z.string().min(1),
  topic: z.enum(QUIZ_TOPICS),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
};

export const QuizQuestionSchema = z.discriminatedUnion('kind', [
  z.object({
    ...Base,
    kind: z.literal('choice'),
    fen: z.string().optional(),
    choices: z.array(z.string()).min(2),
    answer: z.string(),
  }),
  /** Click every square the piece on `square` can move to (answer computed from the rules). */
  z.object({ ...Base, kind: z.literal('select-squares'), fen: z.string(), square: z.string() }),
  /** Play the move on the board. `mate`: any checkmating move is also accepted. */
  z.object({
    ...Base,
    kind: z.literal('make-move'),
    fen: z.string(),
    answers: z.array(z.string()).min(1),
    mate: z.boolean().optional(),
  }),
]);
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizQuestionsSchema = z.array(QuizQuestionSchema);

export const QuizTextSchema = z.object({
  prompt: z.string().min(1),
  choices: z.record(z.string(), z.string()).optional(),
  explanation: z.string().min(1),
});
export const QuizTextsSchema = z.record(z.string(), QuizTextSchema);
export type QuizText = z.infer<typeof QuizTextSchema>;

export function correctSquares(q: Extract<QuizQuestion, { kind: 'select-squares' }>): string[] {
  return legalTargets(q.fen, q.square as Square).sort();
}

export interface SquaresCheck {
  correct: boolean;
  /** Right squares the player selected. */
  hits: string[];
  /** Right squares the player missed. */
  missed: string[];
  /** Squares selected that are wrong. */
  wrong: string[];
}

export function checkSquares(
  q: Extract<QuizQuestion, { kind: 'select-squares' }>,
  selected: readonly string[],
): SquaresCheck {
  const answer = new Set(correctSquares(q));
  const picked = new Set(selected);
  const hits = [...picked].filter((s) => answer.has(s));
  const wrong = [...picked].filter((s) => !answer.has(s));
  const missed = [...answer].filter((s) => !picked.has(s));
  return { correct: wrong.length === 0 && missed.length === 0, hits, missed, wrong };
}

export function checkMove(q: Extract<QuizQuestion, { kind: 'make-move' }>, uci: string): boolean {
  const chess = new Chess(q.fen);
  let played: string;
  try {
    played = moveToUci(chess.move(uciToMove(uci)));
  } catch {
    return false;
  }
  if (q.answers.includes(played)) return true;
  return q.mate === true && chess.isCheckmate();
}

export function checkChoice(q: Extract<QuizQuestion, { kind: 'choice' }>, choice: string): boolean {
  return q.answer === choice;
}

/** Random selection of `count` questions (optionally one topic), shuffled. */
export function pickQuiz(
  questions: readonly QuizQuestion[],
  topic: QuizTopic | null,
  count: number,
  rng: Rng = Math.random,
): QuizQuestion[] {
  const pool = questions.filter((q) => topic === null || q.topic === topic);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count).sort((a, b) => a.level - b.level);
}

/** The first accepted answer of a make-move question, in SAN (for "the answer was …"). */
export function answerSan(q: Extract<QuizQuestion, { kind: 'make-move' }>): string | null {
  try {
    return new Chess(q.fen).move(uciToMove(q.answers[0])).san;
  } catch {
    return null;
  }
}
