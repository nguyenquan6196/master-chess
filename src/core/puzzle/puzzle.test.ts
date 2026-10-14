import { describe, expect, it } from 'vitest';
import { seededRng } from '../bot/choose';
import { rushCheckTime, rushRecord, rushTargetRating, startRush } from './rush';
import { dailyIndex, dayKey, pickPuzzle } from './select';
import {
  expectedMove,
  isCleanSolve,
  playPuzzleMove,
  playReply,
  revealSolution,
  startPuzzle,
  withHint,
} from './session';
import { bucketOf, decodePuzzle, encodePuzzle, type Puzzle } from './types';

const backRank: Puzzle = {
  id: 'test-mate',
  // Black's setup move, then white mates on the back rank.
  fen: '6k1/p4ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1',
  moves: ['a7a6', 'd1d8'],
  rating: 900,
  rd: 80,
  themes: ['mateIn1', 'backRankMate'],
};

const twoMover: Puzzle = {
  id: 'test-two',
  // Scripted 2-move line (not necessarily optimal) to exercise opponent replies.
  fen: '6k1/5ppp/8/8/8/8/1Q3PPP/4R1K1 b - - 0 1',
  moves: ['h7h6', 'e1e8', 'g8h7', 'b2b1'],
  rating: 1200,
  rd: 80,
  themes: ['short'],
};

describe('core/puzzle/session', () => {
  it('plays the setup move and gives the player the other color', () => {
    const s = startPuzzle(backRank);
    expect(s.playerColor).toBe('w');
    expect(s.played).toEqual(['a7a6']);
    expect(expectedMove(s)).toEqual({ from: 'd1', to: 'd8' });
  });

  it('solves on the expected move and counts a clean solve', () => {
    const r = playPuzzleMove(startPuzzle(backRank), 'd1d8');
    expect(r.kind).toBe('solved');
    expect(isCleanSolve(r.session)).toBe(true);
  });

  it('rejects a wrong move without changing the position', () => {
    const s = startPuzzle(backRank);
    const r = playPuzzleMove(s, 'g1f1');
    expect(r.kind).toBe('wrong');
    expect(r.session.fen).toBe(s.fen);
    expect(r.session.mistakes).toBe(1);
  });

  it('walks through a multi-move line with opponent replies', () => {
    let s = startPuzzle(twoMover);
    const r1 = playPuzzleMove(s, 'e1e8');
    expect(r1.kind).toBe('correct');
    s = playReply(r1.session);
    expect(s.played.at(-1)).toBe('g8h7');
    const r2 = playPuzzleMove(s, 'b2b1');
    expect(r2.kind).toBe('solved');
  });

  it('accepts an alternative checkmate', () => {
    // The scripted answer is a quiet rook move, but Rd8# also mates and must be accepted.
    const p: Puzzle = { ...backRank, moves: ['a7a6', 'd1d7'] };
    expect(playPuzzleMove(startPuzzle(p), 'd1d8').kind).toBe('solved');
  });

  it('hints and solutions make the solve not clean', () => {
    const hinted = playPuzzleMove(withHint(startPuzzle(backRank)), 'd1d8');
    expect(isCleanSolve(hinted.session)).toBe(false);
    const revealed = revealSolution(startPuzzle(twoMover));
    expect(revealed.status).toBe('solved');
    expect(revealed.played).toEqual(twoMover.moves);
    expect(isCleanSolve(revealed)).toBe(false);
  });
});

describe('core/puzzle/types', () => {
  it('round-trips the compact format and buckets ratings', () => {
    expect(decodePuzzle(encodePuzzle(backRank))).toEqual(backRank);
    expect(bucketOf(950)).toBe(800);
    expect(bucketOf(150)).toBe(400);
    expect(bucketOf(3000)).toBe(2600);
  });
});

describe('core/puzzle/select', () => {
  const pool: Puzzle[] = [600, 900, 1000, 1500].map((rating, i) => ({
    ...backRank,
    id: `p${i}`,
    rating,
  }));

  it('picks an unseen puzzle near the target', () => {
    const p = pickPuzzle(pool, 950, new Set(['p1']), seededRng(1));
    expect(p?.id).toBe('p2');
  });

  it('widens the search when nothing is close', () => {
    expect(pickPuzzle(pool, 2400, new Set(), seededRng(1))?.id).toBe('p3');
  });

  it('gives a stable daily index', () => {
    const day = dayKey(new Date(2026, 9, 14));
    expect(day).toBe('2026-10-14');
    expect(dailyIndex(day, 500)).toBe(dailyIndex(day, 500));
    expect(dailyIndex(day, 500)).not.toBe(dailyIndex('2026-10-15', 500));
  });
});

describe('core/puzzle/rush', () => {
  it('scores, raises difficulty and ends after 3 mistakes', () => {
    let r = startRush('3m', 0);
    r = rushRecord(r, 'a', true, 1000);
    expect(r.score).toBe(1);
    expect(rushTargetRating(r)).toBeGreaterThan(rushTargetRating({ score: 0 }));
    r = rushRecord(r, 'b', false, 2000);
    r = rushRecord(r, 'c', false, 3000);
    expect(r.over).toBe(false);
    r = rushRecord(r, 'd', false, 4000);
    expect(r.over).toBe(true);
  });

  it('ends when time runs out', () => {
    const r = rushCheckTime(startRush('3m', 0), 180_000);
    expect(r.over).toBe(true);
  });
});
