import type { GameStatus, Move } from './game';

export type MoveSound = 'move' | 'capture' | 'castle' | 'check' | 'promote';

/** Which sound a move should make (check wins over everything else). */
export function moveSound(move: Pick<Move, 'flags'>, statusAfter: GameStatus): MoveSound {
  if (statusAfter.kind === 'playing' && statusAfter.inCheck) return 'check';
  if (move.flags.includes('p')) return 'promote';
  if (move.flags.includes('k') || move.flags.includes('q')) return 'castle';
  if (move.flags.includes('c') || move.flags.includes('e')) return 'capture';
  return 'move';
}
