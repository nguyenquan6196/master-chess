import { describe, expect, it } from 'vitest';
import { uciToMove } from '../chess/game';
import type { GameRecord } from '../profile/schema';
import {
  checkTimeout,
  createBotGame,
  playMove,
  replayGame,
  resignGame,
  resumeGame,
  undoPlayerMove,
} from './botGame';
import { remainingAt } from './clock';

function game(playerColor: 'w' | 'b' = 'w', timeControl: '5+3' | 'none' = 'none') {
  return createBotGame({
    id: 'g',
    profileId: 'p',
    botId: 'fox',
    style: 'balanced',
    playerColor,
    timeControl,
    now: 0,
  });
}

function play(g: GameRecord, ...moves: string[]): GameRecord {
  return moves.reduce((acc, m, i) => {
    const next = playMove(acc, uciToMove(m), (i + 1) * 1000);
    if (!next) throw new Error(`illegal ${m}`);
    return next;
  }, g);
}

describe('core/game/botGame', () => {
  it('records moves and replays the position', () => {
    const g = play(game(), 'e2e4', 'e7e5');
    expect(g.moves).toEqual(['e2e4', 'e7e5']);
    expect(replayGame(g).history.map((m) => m.san)).toEqual(['e4', 'e5']);
  });

  it('finishes on checkmate with the right result and a PGN', () => {
    const g = play(game('b'), 'f2f3', 'e7e5', 'g2g4', 'd8h4');
    expect(g.status).toBe('finished');
    expect(g.result).toBe('win');
    expect(g.endReason).toBe('checkmate');
    expect(g.pgn).toContain('Qh4#');
    expect(g.pgn).toContain('[Result "0-1"]');
    expect(playMove(g, uciToMove('a2a3'), 99)).toBeNull();
  });

  it('records resignation as a loss', () => {
    const g = resignGame(play(game(), 'e2e4'), 5000);
    expect(g).toMatchObject({ status: 'finished', result: 'loss', endReason: 'resign' });
  });

  it('undoes back to the player turn', () => {
    const g = play(game('w'), 'e2e4', 'e7e5', 'g1f3', 'b8c6');
    const u = undoPlayerMove(g, 9000);
    expect(u?.moves).toEqual(['e2e4', 'e7e5']);
    expect(u?.undosUsed).toBe(1);
    // Bot (white) moved first: black player cannot undo the bot's opening move.
    expect(undoPlayerMove(play(game('b'), 'e2e4'), 9000)).toBeNull();
    // Player just moved and the bot is thinking: undo only the player's move.
    expect(undoPlayerMove(play(game('b'), 'e2e4', 'e7e5'), 9000)?.moves).toEqual(['e2e4']);
  });

  it('runs the clock and detects timeouts', () => {
    let g = game('w', '5+3');
    expect(g.clock.running).toBe('w');
    g = playMove(g, uciToMove('e2e4'), 10_000)!;
    expect(g.clock.remainingMs.w).toBe(293_000);
    expect(g.clock.running).toBe('b');
    const timedOut = checkTimeout(g, 10_000 + 300_000);
    expect(timedOut).toMatchObject({ status: 'finished', result: 'win', endReason: 'timeout' });
  });

  it('does not charge time spent away when resuming', () => {
    const g = playMove(game('w', '5+3'), uciToMove('e2e4'), 10_000)!;
    const resumed = resumeGame(g, 1_000_000);
    expect(remainingAt(resumed.clock, 'b', 1_000_000)).toBe(300_000 - 0);
    expect(resumed.clock.running).toBe('b');
  });
});
