import type { BotId } from '../bot/levels';
import {
  applyMove,
  moveToUci,
  newGame,
  START_FEN,
  toPgn,
  uciToMove,
  type Color,
  type GameSnapshot,
  type GameStatus,
  type MoveInput,
} from '../chess/game';
import type { EndReason, GameRecord, GameResult } from '../profile/schema';
import {
  createClock,
  flaggedColor,
  isTimed,
  pauseClock,
  startClock,
  switchClock,
  type TimeControlId,
} from './clock';

export interface NewBotGame {
  id: string;
  profileId: string;
  botId: BotId;
  playerColor: Color;
  timeControl: TimeControlId;
  now: number;
}

export function createBotGame(p: NewBotGame): GameRecord {
  return {
    id: p.id,
    profileId: p.profileId,
    mode: 'bot',
    botId: p.botId,
    playerColor: p.playerColor,
    startFen: START_FEN,
    moves: [],
    clock: startClock(createClock(p.timeControl), 'w', p.now),
    status: 'ongoing',
    hintsUsed: 0,
    undosUsed: 0,
    createdAt: p.now,
    updatedAt: p.now,
  };
}

export const botColorOf = (g: GameRecord): Color => (g.playerColor === 'w' ? 'b' : 'w');

/** Rebuilds the position from the stored UCI moves (invalid trailing moves are ignored). */
export function replayGame(g: Pick<GameRecord, 'startFen' | 'moves'>): GameSnapshot {
  let snap = newGame(g.startFen);
  for (const uci of g.moves) {
    const next = applyMove(snap, uciToMove(uci));
    if (!next) break;
    snap = next;
  }
  return snap;
}

function resultFor(winner: Color | null, playerColor: Color): GameResult {
  if (winner === null) return 'draw';
  return winner === playerColor ? 'win' : 'loss';
}

/** Result implied by the board (mate/draw), or null while the game goes on. */
export function boardOutcome(
  status: GameStatus,
  playerColor: Color,
): { result: GameResult; endReason: EndReason } | null {
  if (status.kind === 'checkmate') {
    return { result: resultFor(status.winner, playerColor), endReason: 'checkmate' };
  }
  if (status.kind === 'draw') return { result: 'draw', endReason: status.reason };
  return null;
}

export function finishGame(
  g: GameRecord,
  result: GameResult,
  endReason: EndReason,
  now: number,
): GameRecord {
  if (g.status === 'finished') return g;
  const playerName = 'Player';
  const botName = `Bot (${g.botId})`;
  const pgn = toPgn(replayGame(g), {
    Event: 'Master Chess',
    Date: new Date(now).toISOString().slice(0, 10).replaceAll('-', '.'),
    White: g.playerColor === 'w' ? playerName : botName,
    Black: g.playerColor === 'b' ? playerName : botName,
    Result:
      result === 'draw'
        ? '1/2-1/2'
        : (result === 'win') === (g.playerColor === 'w')
          ? '1-0'
          : '0-1',
    Termination: endReason,
  });
  return {
    ...g,
    status: 'finished',
    result,
    endReason,
    pgn,
    clock: pauseClock(g.clock, now),
    updatedAt: now,
  };
}

/** Plays a move for `mover`; returns null when illegal, out of turn or the game is over. */
export function playMove(g: GameRecord, input: MoveInput, now: number): GameRecord | null {
  if (g.status !== 'ongoing') return null;
  const before = replayGame(g);
  if (before.status.kind !== 'playing') return null;
  const mover = before.status.turn;
  const after = applyMove(before, input);
  if (!after) return null;
  const last = after.history[after.history.length - 1];
  const next: GameRecord = {
    ...g,
    moves: [...g.moves, moveToUci(last)],
    clock: switchClock(g.clock, mover, now),
    updatedAt: now,
  };
  const outcome = boardOutcome(after.status, g.playerColor);
  return outcome ? finishGame(next, outcome.result, outcome.endReason, now) : next;
}

export function resignGame(g: GameRecord, now: number): GameRecord {
  return finishGame(g, 'loss', 'resign', now);
}

/** Ends the game if a flag has fallen. */
export function checkTimeout(g: GameRecord, now: number): GameRecord {
  if (g.status !== 'ongoing') return g;
  const flagged = flaggedColor(g.clock, now);
  if (!flagged) return g;
  const winner: Color = flagged === 'w' ? 'b' : 'w';
  return finishGame(g, resultFor(winner, g.playerColor), 'timeout', now);
}

/**
 * Takes back moves until it is the player's turn again and at least one of the player's
 * moves was removed. Returns null when there is nothing to undo.
 */
export function undoPlayerMove(g: GameRecord, now: number): GameRecord | null {
  if (g.status !== 'ongoing') return null;
  const startTurn = newGame(g.startFen).status;
  const firstMover: Color = startTurn.kind === 'playing' ? startTurn.turn : 'w';
  const moverAt = (ply: number): Color =>
    ply % 2 === 0 ? firstMover : firstMover === 'w' ? 'b' : 'w';

  const moves = [...g.moves];
  let removedPlayerMove = false;
  while (moves.length > 0) {
    const mover = moverAt(moves.length - 1);
    moves.pop();
    if (mover === g.playerColor) {
      removedPlayerMove = true;
      break;
    }
  }
  if (!removedPlayerMove) return null;
  const clock = isTimed(g.clock)
    ? startClock(pauseClock(g.clock, now), g.playerColor, now)
    : g.clock;
  return { ...g, moves, clock, undosUsed: g.undosUsed + 1, updatedAt: now };
}

/** On reopening a saved game, restart the clock from now (time away is not charged). */
export function resumeGame(g: GameRecord, now: number): GameRecord {
  if (g.status !== 'ongoing' || !isTimed(g.clock)) return g;
  const snap = replayGame(g);
  if (snap.status.kind !== 'playing') return g;
  return { ...g, clock: { ...g.clock, running: snap.status.turn, runningSince: now } };
}

export function pauseGame(g: GameRecord, now: number): GameRecord {
  return g.status === 'ongoing' ? { ...g, clock: pauseClock(g.clock, now) } : g;
}
