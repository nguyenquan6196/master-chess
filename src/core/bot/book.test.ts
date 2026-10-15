import { describe, expect, it } from 'vitest';
import openings from '../../../content/books/openings.json';
import { START_FEN } from '../chess/game';
import { bookKey, bookMove, buildBook, buildBooks } from './book';
import { seededRng } from './choose';
import { BOT_STYLES } from './styles';

describe('core/bot/book', () => {
  const books = buildBooks(openings);

  it('builds a legal book for every style that covers the start position', () => {
    for (const style of BOT_STYLES) {
      expect(books[style].size, style).toBeGreaterThan(0);
      expect(bookMove(books[style], START_FEN, seededRng(1)), style).toMatch(
        /^[a-h][1-8][a-h][1-8]/,
      );
    }
  });

  it('merges shared prefixes and sums their weights', () => {
    const book = buildBook([
      { line: 'e4 e5', weight: 2 },
      { line: 'e4 c5', weight: 1 },
    ]);
    expect(book.get(bookKey(START_FEN))).toEqual([{ uci: 'e2e4', weight: 3 }]);
  });

  it('answers for Black too and is out of book elsewhere', () => {
    const book = buildBook([{ line: 'e4 c5 Nf3 d6' }]);
    const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    expect(bookMove(book, afterE4)).toBe('c7c5');
    expect(bookMove(book, '4k3/8/8/8/8/8/8/4K3 w - - 0 1')).toBeNull();
  });

  it('rejects illegal lines', () => {
    expect(() => buildBook([{ line: 'e4 e4' }])).toThrow();
  });
});
