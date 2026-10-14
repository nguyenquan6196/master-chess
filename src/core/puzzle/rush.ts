/**
 * Puzzle Rush (spec §5.2): solve as many puzzles as possible before time runs out;
 * the run ends after MAX_MISTAKES wrong puzzles. Difficulty rises with the score.
 */
export const RUSH = {
  durations: { '3m': 3 * 60_000, '5m': 5 * 60_000 },
  maxMistakes: 3,
  startRating: 600,
  ratingStep: 60,
  maxRating: 2600,
} as const;

export type RushDuration = keyof typeof RUSH.durations;

export interface RushState {
  duration: RushDuration;
  startedAt: number;
  score: number;
  mistakes: number;
  /** Puzzle ids already shown in this run. */
  seen: string[];
  over: boolean;
}

export function startRush(duration: RushDuration, now: number): RushState {
  return { duration, startedAt: now, score: 0, mistakes: 0, seen: [], over: false };
}

export function rushTargetRating(state: Pick<RushState, 'score'>): number {
  return Math.min(RUSH.maxRating, RUSH.startRating + state.score * RUSH.ratingStep);
}

export function rushRemainingMs(state: RushState, now: number): number {
  return Math.max(0, RUSH.durations[state.duration] - (now - state.startedAt));
}

export function rushRecord(
  state: RushState,
  puzzleId: string,
  solved: boolean,
  now: number,
): RushState {
  const score = state.score + (solved ? 1 : 0);
  const mistakes = state.mistakes + (solved ? 0 : 1);
  const next = { ...state, score, mistakes, seen: [...state.seen, puzzleId] };
  return { ...next, over: mistakes >= RUSH.maxMistakes || rushRemainingMs(next, now) === 0 };
}

export function rushCheckTime(state: RushState, now: number): RushState {
  if (state.over || rushRemainingMs(state, now) > 0) return state;
  return { ...state, over: true };
}
