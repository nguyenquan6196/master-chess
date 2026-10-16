import { describe, expect, it } from 'vitest';
import {
  ALL_SQUARES,
  easeInOut,
  isForwardSlide,
  isLightSquare,
  moveSlides,
  piecesFromFen,
  slidePosition,
  squareToWorld,
  worldToSquare,
} from './board3d';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('core/board3d', () => {
  it('maps squares to world and back', () => {
    expect(squareToWorld('a1')).toEqual({ x: -3.5, z: 3.5 });
    expect(squareToWorld('h8')).toEqual({ x: 3.5, z: -3.5 });
    for (const sq of ALL_SQUARES) {
      const { x, z } = squareToWorld(sq);
      expect(worldToSquare(x, z)).toBe(sq);
      expect(worldToSquare(x + 0.45, z - 0.45)).toBe(sq);
    }
    expect(worldToSquare(4.2, 0)).toBeNull();
    expect(ALL_SQUARES).toHaveLength(64);
  });

  it('colours squares like a real board', () => {
    expect(isLightSquare('a1')).toBe(false);
    expect(isLightSquare('h1')).toBe(true);
    expect(isLightSquare('d1')).toBe(true);
  });

  it('reads pieces from a FEN', () => {
    const pieces = piecesFromFen(START);
    expect(pieces).toHaveLength(32);
    expect(pieces).toContainEqual({ square: 'e1', type: 'k', color: 'w' });
    expect(pieces).toContainEqual({ square: 'd8', type: 'q', color: 'b' });
    expect(piecesFromFen('8/8/8/8/8/8/8/4K3 w - - 0 1')).toEqual([
      { square: 'e1', type: 'k', color: 'w' },
    ]);
  });

  it('slides the rook too when castling', () => {
    const after = piecesFromFen('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1');
    expect(moveSlides({ from: 'e1', to: 'g1' }, after)).toEqual([
      { from: 'e1', to: 'g1' },
      { from: 'h1', to: 'f1' },
    ]);
    const long = piecesFromFen('2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2');
    expect(moveSlides({ from: 'e8', to: 'c8' }, long)).toEqual([
      { from: 'e8', to: 'c8' },
      { from: 'a8', to: 'd8' },
    ]);
    expect(moveSlides({ from: 'e2', to: 'e4' }, piecesFromFen(START))).toHaveLength(1);
    expect(moveSlides(null, [])).toEqual([]);
  });

  it('animates only moves that just happened', () => {
    const before = piecesFromFen(START);
    const after = piecesFromFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    const slide = { from: 'e2', to: 'e4' };
    expect(isForwardSlide(before, after, slide)).toBe(true);
    // Undo: going back to the start position must not replay e2-e4 backwards.
    expect(isForwardSlide(after, before, slide)).toBe(false);
    // Promotion: a pawn becomes a queen.
    const pre = piecesFromFen('8/4P3/8/8/8/8/8/k6K w - - 0 1');
    const post = piecesFromFen('4Q3/8/8/8/8/8/8/k6K b - - 0 1');
    expect(isForwardSlide(pre, post, { from: 'e7', to: 'e8' })).toBe(true);
  });

  it('moves along an eased arc that lands exactly', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    const s = { from: 'g1', to: 'f3' };
    const start = slidePosition(s, 0, true);
    const mid = slidePosition(s, 0.5, true);
    const end = slidePosition(s, 1, true);
    expect(start).toMatchObject({ ...squareToWorld('g1'), y: 0 });
    expect(end.x).toBeCloseTo(squareToWorld('f3').x);
    expect(end.z).toBeCloseTo(squareToWorld('f3').z);
    expect(end.y).toBeCloseTo(0);
    expect(mid.y).toBeGreaterThan(slidePosition(s, 0.5, false).y);
  });
});
