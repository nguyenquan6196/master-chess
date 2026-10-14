import { describe, expect, it } from 'vitest';
import {
  applyMove,
  checkedKingSquare,
  isPromotionMove,
  legalTargets,
  legalUciMoves,
  moveToUci,
  newGame,
  undoMove,
  uciToMove,
  type GameSnapshot,
  type MoveInput,
} from './game';
import { moveSound } from './moveSound';

function play(moves: string[], game: GameSnapshot = newGame()): GameSnapshot {
  return moves.reduce((g, m) => {
    const input: MoveInput = {
      from: m.slice(0, 2) as MoveInput['from'],
      to: m.slice(2, 4) as MoveInput['to'],
      promotion: (m[4] as MoveInput['promotion']) || undefined,
    };
    const next = applyMove(g, input);
    if (!next) throw new Error(`illegal move ${m}`);
    return next;
  }, game);
}

describe('core/chess/game', () => {
  it('starts with white to move and not in check', () => {
    expect(newGame().status).toEqual({ kind: 'playing', turn: 'w', inCheck: false });
  });

  it('rejects illegal moves', () => {
    expect(applyMove(newGame(), { from: 'e2', to: 'e5' })).toBeNull();
  });

  it('lists legal targets for a knight', () => {
    expect(legalTargets(newGame().fen, 'g1').sort()).toEqual(['f3', 'h3']);
  });

  it("detects fool's mate as checkmate for black", () => {
    const g = play(['f2f3', 'e7e5', 'g2g4', 'd8h4']);
    expect(g.status).toEqual({ kind: 'checkmate', winner: 'b' });
    expect(checkedKingSquare(g.fen)).toBe('e1');
    expect(applyMove(g, { from: 'a2', to: 'a3' })).toBeNull();
  });

  it('detects stalemate', () => {
    const g = newGame('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(g.status).toEqual({ kind: 'draw', reason: 'stalemate' });
  });

  it('detects insufficient material', () => {
    expect(newGame('8/8/4k3/8/8/4K3/8/8 w - - 0 1').status).toEqual({
      kind: 'draw',
      reason: 'insufficient',
    });
  });

  it('detects threefold repetition', () => {
    const g = play(['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8']);
    expect(g.status).toEqual({ kind: 'draw', reason: 'threefold' });
  });

  it('supports castling and en passant', () => {
    const castled = play(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'e1g1']);
    expect(castled.history.at(-1)?.san).toBe('O-O');

    const ep = play(['e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6']);
    expect(ep.history.at(-1)?.flags).toContain('e');
  });

  it('requires a promotion choice and applies it', () => {
    const fen = '8/P6k/8/8/8/8/8/K7 w - - 0 1';
    expect(isPromotionMove(fen, 'a7', 'a8')).toBe(true);
    const g = applyMove(newGame(fen), { from: 'a7', to: 'a8', promotion: 'n' });
    expect(g?.history.at(-1)?.san).toBe('a8=N');
  });

  it('undoes the last move', () => {
    const g = play(['e2e4', 'e7e5']);
    const back = undoMove(g);
    expect(back.history.map((m) => m.san)).toEqual(['e4']);
    expect(back.status).toMatchObject({ turn: 'b' });
  });
});

describe('core/chess/game uci helpers', () => {
  it('converts between UCI strings and moves', () => {
    expect(uciToMove('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
    expect(uciToMove('g1f3')).toEqual({ from: 'g1', to: 'f3' });
    expect(moveToUci({ from: 'a7', to: 'a8', promotion: 'n' })).toBe('a7a8n');
  });

  it('lists 20 legal moves from the start position', () => {
    const moves = legalUciMoves(newGame().fen);
    expect(moves).toHaveLength(20);
    expect(moves).toContain('g1f3');
  });
});

describe('core/chess/moveSound', () => {
  const playing = { kind: 'playing', turn: 'w', inCheck: false } as const;
  it('maps move flags to sounds', () => {
    expect(moveSound({ flags: 'n' }, playing)).toBe('move');
    expect(moveSound({ flags: 'c' }, playing)).toBe('capture');
    expect(moveSound({ flags: 'e' }, playing)).toBe('capture');
    expect(moveSound({ flags: 'k' }, playing)).toBe('castle');
    expect(moveSound({ flags: 'cp' }, playing)).toBe('promote');
    expect(moveSound({ flags: 'c' }, { ...playing, inCheck: true })).toBe('check');
  });
});
