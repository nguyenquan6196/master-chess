import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import type { Rng } from '../bot/choose';
import { legalTargets, moveToUci, START_FEN } from '../chess/game';
import type { QuizQuestion, QuizTopic } from './quiz';

/**
 * Procedurally generated quiz questions ("extra practice"). Every answer is computed with
 * chess.js, so questions are always correct and practically never repeat. Texts are
 * translation keys + params (`quizGen.<key>` in messages), resolved by the UI.
 */

export interface GenText {
  key: GenKind;
  params?: Record<string, string | number>;
  /** Per-choice label: translation key under `quizGen.labels` + params. */
  choiceLabels?: Record<string, { key: string; params?: Record<string, string | number> }>;
}

export interface GeneratedQuestion {
  question: QuizQuestion;
  text: GenText;
}

export const GEN_KINDS = [
  'pieceMoves',
  'positionStatus',
  'escapeCheck',
  'readMove',
  'sanPiece',
  'freeCapture',
  'mateIn1',
  'materialCount',
  'bestCapture',
] as const;
export type GenKind = (typeof GEN_KINDS)[number];

const FILES = 'abcdefgh';
const ALL_SQUARES: Square[] = [];
for (let r = 1; r <= 8; r++) for (const f of FILES) ALL_SQUARES.push(`${f}${r}` as Square);

export const PIECE_VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Squares on the edge of the board, where most mates and stalemates happen. */
const EDGE_SQUARES = ALL_SQUARES.filter(
  (s) => s[0] === 'a' || s[0] === 'h' || s[1] === '1' || s[1] === '8',
);

const pick = <T>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1));
const opposite = (c: Color): Color => (c === 'w' ? 'b' : 'w');

interface Placement {
  type: PieceSymbol;
  color: Color;
  square?: Square;
}

/**
 * Builds a random legal position with the given pieces (two kings are always added) and
 * side to move. Returns null when the random placement is illegal.
 */
function randomPosition(
  pieces: Placement[],
  turn: Color,
  rng: Rng,
  blackKing?: Square,
): Chess | null {
  const chess = new Chess();
  chess.clear();
  const used = new Set<Square>();
  const all: Placement[] = [
    { type: 'k', color: 'b', square: blackKing },
    { type: 'k', color: 'w' },
    ...pieces,
  ];
  for (const p of all) {
    let sq = p.square;
    if (!sq) {
      const free = ALL_SQUARES.filter(
        (s) => !used.has(s) && !(p.type === 'p' && (s[1] === '1' || s[1] === '8')),
      );
      sq = pick(free, rng);
    }
    if (used.has(sq)) return null;
    used.add(sq);
    chess.put({ type: p.type, color: p.color }, sq);
  }
  const fen = chess
    .fen()
    .replace(/ [wb] /, ` ${turn} `)
    .replace(/ \S+ \S+ (\d+) (\d+)$/, ' - - 0 1');
  let result: Chess;
  try {
    result = new Chess(fen);
  } catch {
    return null;
  }
  // The side NOT to move may not be in check, and kings may not touch.
  const enemyKing = result.findPiece({ type: 'k', color: opposite(turn) })[0];
  if (!enemyKing || result.isAttacked(enemyKing, turn)) return null;
  return result;
}

function retry<T>(fn: () => T | null, tries = 4000): T | null {
  for (let i = 0; i < tries; i++) {
    const r = fn();
    if (r) return r;
  }
  return null;
}

function materialOf(chess: Chess, color: Color): number {
  let sum = 0;
  for (const row of chess.board())
    for (const p of row) if (p?.color === color) sum += PIECE_VALUES[p.type];
  return sum;
}

/** Moves capturing a piece that cannot be recaptured, grouped by target square. */
function freeCaptures(chess: Chess): Map<Square, { value: number; moves: string[] }> {
  const out = new Map<Square, { value: number; moves: string[] }>();
  const me = chess.turn();
  for (const m of chess.moves({ verbose: true })) {
    if (!m.captured || m.isEnPassant()) continue;
    chess.move(m);
    const recapturable = chess.isAttacked(m.to, opposite(me));
    chess.undo();
    if (recapturable) continue;
    const entry = out.get(m.to) ?? { value: PIECE_VALUES[m.captured], moves: [] };
    entry.moves.push(moveToUci(m));
    out.set(m.to, entry);
  }
  return out;
}

function randomGamePosition(rng: Rng, minPly: number, maxPly: number): Chess {
  const chess = new Chess(START_FEN);
  const plies = int(minPly, maxPly, rng);
  for (let i = 0; i < plies; i++) {
    const moves = chess.moves();
    if (moves.length === 0 || chess.isGameOver()) break;
    chess.move(pick(moves, rng));
  }
  if (chess.isGameOver()) chess.undo();
  return chess;
}

const base = (topic: QuizTopic, level: 1 | 2 | 3) => ({ id: 'gen', topic, level });

// ---------------------------------------------------------------------------------------------

const generators: Record<GenKind, (rng: Rng) => GeneratedQuestion | null> = {
  /** Click every square a piece can reach (level 2 adds blockers). */
  pieceMoves: (rng) =>
    retry(() => {
      const type = pick<PieceSymbol>(['n', 'b', 'r', 'q', 'k'], rng);
      const level = rng() < 0.5 ? 1 : 2;
      const extras: Placement[] =
        level === 1
          ? []
          : Array.from({ length: int(2, 4, rng) }, () => ({
              type: pick<PieceSymbol>(['p', 'p', 'n', 'b', 'r'], rng),
              color: pick<Color>(['w', 'b'], rng),
            }));
      const pieces: Placement[] = type === 'k' ? extras : [{ type, color: 'w' }, ...extras];
      const chess = randomPosition(pieces, 'w', rng);
      if (!chess || chess.inCheck()) return null;
      const square =
        type === 'k'
          ? chess.findPiece({ type: 'k', color: 'w' })[0]
          : chess.findPiece({ type, color: 'w' })[0];
      if (!square || legalTargets(chess.fen(), square).length < 2) return null;
      return {
        question: { ...base('pieces', level), kind: 'select-squares', fen: chess.fen(), square },
        text: { key: 'pieceMoves', params: { piece: type, square } },
      };
    }),

  /** Check, checkmate, stalemate or none? */
  positionStatus: (rng) => {
    const target = pick(['check', 'checkmate', 'stalemate', 'none'] as const, rng);
    return retry(() => {
      const attackers: Placement[] = [
        { type: pick<PieceSymbol>(['q', 'r', 'q'], rng), color: 'w' },
      ];
      if (rng() < 0.4)
        attackers.push({ type: pick<PieceSymbol>(['r', 'b', 'n'], rng), color: 'w' });
      const edge = target === 'checkmate' || target === 'stalemate';
      const chess = randomPosition(attackers, 'b', rng, edge ? pick(EDGE_SQUARES, rng) : undefined);
      if (!chess) return null;
      const status = chess.isCheckmate()
        ? 'checkmate'
        : chess.isStalemate()
          ? 'stalemate'
          : chess.inCheck()
            ? 'check'
            : 'none';
      if (status !== target) return null;
      const choices = ['check', 'checkmate', 'stalemate', 'none'];
      return {
        question: {
          ...base('rules', 2),
          kind: 'choice',
          fen: chess.fen(),
          choices,
          answer: status,
        },
        text: {
          key: 'positionStatus',
          choiceLabels: Object.fromEntries(choices.map((c) => [c, { key: `status.${c}` }])),
        },
      };
    }, 20000);
  },

  /** The king is in check: where can it go? */
  escapeCheck: (rng) =>
    retry(() => {
      const attackers: Placement[] = [
        { type: pick<PieceSymbol>(['q', 'r', 'b', 'n'], rng), color: 'b' },
      ];
      if (rng() < 0.5)
        attackers.push({ type: pick<PieceSymbol>(['p', 'n', 'b', 'r'], rng), color: 'b' });
      if (rng() < 0.5) attackers.push({ type: pick<PieceSymbol>(['p', 'n'], rng), color: 'w' });
      const chess = randomPosition(attackers, 'w', rng);
      if (!chess || !chess.inCheck()) return null;
      const king = chess.findPiece({ type: 'k', color: 'w' })[0];
      if (legalTargets(chess.fen(), king).length === 0) return null;
      return {
        question: { ...base('rules', 2), kind: 'select-squares', fen: chess.fen(), square: king },
        text: { key: 'escapeCheck', params: { square: king } },
      };
    }),

  /** Play the move written in notation. */
  readMove: (rng) =>
    retry(() => {
      const chess = randomGamePosition(rng, 2, 14);
      const moves = chess
        .moves({ verbose: true })
        .filter((m) => !m.isKingsideCastle() && !m.isQueensideCastle());
      if (moves.length === 0) return null;
      const m = pick(moves, rng);
      return {
        question: {
          ...base('notation', m.piece === 'p' ? 1 : 2),
          kind: 'make-move',
          fen: chess.fen(),
          answers: [moveToUci(m)],
        },
        text: { key: 'readMove', params: { san: m.san } },
      };
    }),

  /** Which piece moves in this move? */
  sanPiece: (rng) =>
    retry(() => {
      const chess = randomGamePosition(rng, 2, 16);
      const moves = chess
        .moves({ verbose: true })
        .filter((m) => !m.isKingsideCastle() && !m.isQueensideCastle());
      if (moves.length === 0) return null;
      const m = pick(moves, rng);
      const choices = ['k', 'q', 'r', 'b', 'n', 'p'];
      return {
        question: { ...base('notation', 1), kind: 'choice', choices, answer: m.piece },
        text: {
          key: 'sanPiece',
          params: { san: m.san },
          choiceLabels: Object.fromEntries(choices.map((c) => [c, { key: `piece.${c}` }])),
        },
      };
    }),

  /** Exactly one enemy piece can be taken for free. */
  freeCapture: (rng) =>
    retry(() => {
      const pieces: Placement[] = [
        { type: pick<PieceSymbol>(['n', 'b', 'r', 'q'], rng), color: 'w' },
        { type: pick<PieceSymbol>(['n', 'b', 'r', 'p'], rng), color: 'w' },
        { type: pick<PieceSymbol>(['n', 'b', 'r', 'q', 'p'], rng), color: 'b' },
        { type: pick<PieceSymbol>(['n', 'b', 'r', 'p'], rng), color: 'b' },
      ];
      const chess = randomPosition(pieces, 'w', rng);
      if (!chess || chess.inCheck()) return null;
      const free = freeCaptures(chess);
      if (free.size !== 1) return null;
      const [{ moves }] = [...free.values()];
      return {
        question: { ...base('tactics', 1), kind: 'make-move', fen: chess.fen(), answers: moves },
        text: { key: 'freeCapture' },
      };
    }),

  /** White to move mates in one. */
  mateIn1: (rng) =>
    retry(() => {
      const pieces: Placement[] = [{ type: pick<PieceSymbol>(['q', 'r'], rng), color: 'w' }];
      if (rng() < 0.6)
        pieces.push({ type: pick<PieceSymbol>(['r', 'b', 'n', 'q'], rng), color: 'w' });
      if (rng() < 0.5) pieces.push({ type: 'p', color: 'b' });
      const chess = randomPosition(pieces, 'w', rng, pick(EDGE_SQUARES, rng));
      if (!chess || chess.inCheck()) return null;
      // chess.js marks mating moves with '#' in SAN.
      const mates = chess
        .moves({ verbose: true })
        .filter((m) => m.san.endsWith('#'))
        .map(moveToUci);
      if (mates.length === 0 || mates.length > 3) return null;
      return {
        question: {
          ...base('tactics', 2),
          kind: 'make-move',
          fen: chess.fen(),
          answers: mates,
          mate: true,
        },
        text: { key: 'mateIn1' },
      };
    }, 20000),

  /** Who is ahead in material, and by how much? */
  materialCount: (rng) =>
    retry(() => {
      const count = int(3, 7, rng);
      const pieces: Placement[] = Array.from({ length: count }, () => ({
        type: pick<PieceSymbol>(['p', 'p', 'p', 'n', 'b', 'r', 'q'], rng),
        color: pick<Color>(['w', 'b'], rng),
      }));
      const chess = randomPosition(pieces, 'w', rng);
      if (!chess || chess.inCheck()) return null;
      const diff = materialOf(chess, 'w') - materialOf(chess, 'b');
      const keyOf = (d: number) => (d === 0 ? 'equal' : d > 0 ? `w${d}` : `b${-d}`);
      const options = new Set([keyOf(diff)]);
      for (const d of [-diff, diff + 2, diff - 2, diff + 1, diff - 3, 0, 3, -3]) {
        if (options.size >= 4) break;
        options.add(keyOf(d));
      }
      const choices = [...options].sort(() => rng() - 0.5);
      return {
        question: {
          ...base('strategy', 1),
          kind: 'choice',
          fen: chess.fen(),
          choices,
          answer: keyOf(diff),
        },
        text: {
          key: 'materialCount',
          choiceLabels: Object.fromEntries(
            choices.map((c) => [
              c,
              c === 'equal'
                ? { key: 'material.equal' }
                : {
                    key: c[0] === 'w' ? 'material.white' : 'material.black',
                    params: { n: Number(c.slice(1)) },
                  },
            ]),
          ),
        },
      };
    }),

  /** Several free captures: take the most valuable one. */
  bestCapture: (rng) =>
    retry(() => {
      const pieces: Placement[] = [
        { type: pick<PieceSymbol>(['n', 'b', 'r', 'q'], rng), color: 'w' },
        { type: pick<PieceSymbol>(['n', 'b', 'r'], rng), color: 'w' },
        { type: 'p', color: 'b' },
        { type: pick<PieceSymbol>(['n', 'b', 'r', 'q'], rng), color: 'b' },
        { type: pick<PieceSymbol>(['p', 'n', 'b', 'r'], rng), color: 'b' },
      ];
      const chess = randomPosition(pieces, 'w', rng);
      if (!chess || chess.inCheck()) return null;
      const free = [...freeCaptures(chess).values()].sort((a, b) => b.value - a.value);
      if (free.length < 2 || free[0].value === free[1].value) return null;
      return {
        question: {
          ...base('strategy', 2),
          kind: 'make-move',
          fen: chess.fen(),
          answers: free[0].moves,
        },
        text: { key: 'bestCapture' },
      };
    }),
};

export const GENERATOR_TOPICS: Record<QuizTopic, GenKind[]> = {
  pieces: ['pieceMoves'],
  rules: ['positionStatus', 'escapeCheck'],
  notation: ['readMove', 'sanPiece'],
  tactics: ['freeCapture', 'mateIn1'],
  strategy: ['materialCount', 'bestCapture'],
};

export function generateQuestion(kind: GenKind, rng: Rng = Math.random): GeneratedQuestion | null {
  return generators[kind](rng);
}

/** A round of generated questions for a topic (kinds rotate so the round is varied). */
export function generateRound(
  topic: QuizTopic,
  count: number,
  rng: Rng = Math.random,
): GeneratedQuestion[] {
  const kinds = GENERATOR_TOPICS[topic];
  const out: GeneratedQuestion[] = [];
  for (let i = 0; out.length < count && i < count * 3; i++) {
    const q = generateQuestion(kinds[i % kinds.length], rng);
    if (q) out.push({ ...q, question: { ...q.question, id: `gen-${topic}-${out.length}` } });
  }
  return out;
}
