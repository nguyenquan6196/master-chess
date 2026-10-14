import type { Color } from '../chess/game';

export const TIME_CONTROL_IDS = ['none', '10+0', '5+3', '3+2'] as const;
export type TimeControlId = (typeof TIME_CONTROL_IDS)[number];

export const TIME_CONTROLS: readonly { id: TimeControlId; baseMs: number; incrementMs: number }[] =
  [
    { id: 'none', baseMs: 0, incrementMs: 0 },
    { id: '10+0', baseMs: 10 * 60_000, incrementMs: 0 },
    { id: '5+3', baseMs: 5 * 60_000, incrementMs: 3_000 },
    { id: '3+2', baseMs: 3 * 60_000, incrementMs: 2_000 },
  ];

export function getTimeControl(id: TimeControlId) {
  return TIME_CONTROLS.find((t) => t.id === id) ?? TIME_CONTROLS[0];
}

/**
 * Serializable chess clock. `runningSince` is a wall-clock timestamp (ms) for the side to
 * move; null when paused or untimed.
 */
export interface ClockState {
  timeControl: TimeControlId;
  remainingMs: Record<Color, number>;
  running: Color | null;
  runningSince: number | null;
}

export function createClock(timeControl: TimeControlId): ClockState {
  const tc = getTimeControl(timeControl);
  return {
    timeControl,
    remainingMs: { w: tc.baseMs, b: tc.baseMs },
    running: null,
    runningSince: null,
  };
}

export function isTimed(clock: ClockState): boolean {
  return clock.timeControl !== 'none';
}

/** Remaining time for `color` at time `now`, never below zero. */
export function remainingAt(clock: ClockState, color: Color, now: number): number {
  const base = clock.remainingMs[color];
  if (clock.running !== color || clock.runningSince === null) return base;
  return Math.max(0, base - (now - clock.runningSince));
}

/** Starts (or resumes) the clock of `color`. */
export function startClock(clock: ClockState, color: Color, now: number): ClockState {
  if (!isTimed(clock)) return clock;
  return { ...clock, running: color, runningSince: now };
}

/** Stops the running side's clock, charging elapsed time. */
export function pauseClock(clock: ClockState, now: number): ClockState {
  if (!clock.running || clock.runningSince === null) return clock;
  const color = clock.running;
  return {
    ...clock,
    remainingMs: { ...clock.remainingMs, [color]: remainingAt(clock, color, now) },
    running: null,
    runningSince: null,
  };
}

/** The mover finished a move: charge time, add increment, start the opponent's clock. */
export function switchClock(clock: ClockState, mover: Color, now: number): ClockState {
  if (!isTimed(clock)) return clock;
  const paused = pauseClock(clock, now);
  const inc = getTimeControl(clock.timeControl).incrementMs;
  const opponent: Color = mover === 'w' ? 'b' : 'w';
  return startClock(
    { ...paused, remainingMs: { ...paused.remainingMs, [mover]: paused.remainingMs[mover] + inc } },
    opponent,
    now,
  );
}

/** Color whose flag has fallen at `now`, if any. */
export function flaggedColor(clock: ClockState, now: number): Color | null {
  if (!isTimed(clock) || !clock.running) return null;
  return remainingAt(clock, clock.running, now) <= 0 ? clock.running : null;
}

/** "m:ss", or "s.t" under 10 seconds. */
export function formatClock(ms: number): string {
  if (ms < 10_000) return `${Math.floor(ms / 1000)}.${Math.floor((ms % 1000) / 100)}`;
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
