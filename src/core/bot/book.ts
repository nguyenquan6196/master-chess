import { Chess } from 'chess.js';
import { z } from 'zod';
import { moveToUci } from '../chess/game';
import type { Rng } from './choose';
import { BOT_STYLES, type BotStyle } from './styles';

/**
 * Opening books per style (spec §6.4). Content: content/books/openings.json — lines of
 * SAN moves from the start position with a weight. Every position along a line offers
 * the next move, for either colour, so the bot follows its repertoire as White or Black.
 */
export const BookLineSchema = z.object({
  line: z.string().min(1),
  weight: z.number().int().min(1).default(1),
});
export const OpeningBooksSchema = z.record(z.enum(BOT_STYLES), z.array(BookLineSchema));
export type OpeningBooksJson = z.input<typeof OpeningBooksSchema>;

export const BOOK = {
  /** The book is only used while the game is this young (plies). */
  maxPly: 24,
  /** Weaker bots skip the book: their charm is in their own (odd) moves. */
  minBotElo: 700,
} as const;

/** Position key without move counters, so transpositions share entries. */
export const bookKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');

export type OpeningBook = Map<string, { uci: string; weight: number }[]>;

/** Builds the position → moves map. Throws on an illegal line (caught by tests). */
export function buildBook(lines: readonly { line: string; weight?: number }[]): OpeningBook {
  const book: OpeningBook = new Map();
  for (const { line, weight = 1 } of lines) {
    const chess = new Chess();
    for (const san of line.trim().split(/\s+/)) {
      const key = bookKey(chess.fen());
      const move = chess.move(san);
      const uci = moveToUci(move);
      const entries = book.get(key) ?? [];
      const existing = entries.find((e) => e.uci === uci);
      if (existing) existing.weight += weight;
      else entries.push({ uci, weight });
      book.set(key, entries);
    }
  }
  return book;
}

export function buildBooks(json: OpeningBooksJson): Record<BotStyle, OpeningBook> {
  const parsed = OpeningBooksSchema.parse(json);
  return Object.fromEntries(BOT_STYLES.map((s) => [s, buildBook(parsed[s] ?? [])])) as Record<
    BotStyle,
    OpeningBook
  >;
}

/** A weighted-random book move for this position, or null when out of book. */
export function bookMove(book: OpeningBook, fen: string, rng: Rng = Math.random): string | null {
  const entries = book.get(bookKey(fen));
  if (!entries || entries.length === 0) return null;
  const total = entries.reduce((a, e) => a + e.weight, 0);
  let r = rng() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r < 0) return e.uci;
  }
  return entries[entries.length - 1].uci;
}
