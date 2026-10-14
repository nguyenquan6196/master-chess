import { describe, expect, it } from 'vitest';
import {
  createClock,
  flaggedColor,
  formatClock,
  pauseClock,
  remainingAt,
  startClock,
  switchClock,
} from './clock';

describe('core/game/clock', () => {
  it('does nothing for untimed games', () => {
    const c = startClock(createClock('none'), 'w', 0);
    expect(c.running).toBeNull();
    expect(flaggedColor(c, 10_000_000)).toBeNull();
  });

  it('charges elapsed time and adds increment on switch', () => {
    let c = startClock(createClock('5+3'), 'w', 0);
    expect(remainingAt(c, 'w', 10_000)).toBe(290_000);
    c = switchClock(c, 'w', 10_000);
    expect(c.remainingMs.w).toBe(293_000);
    expect(c.running).toBe('b');
    expect(remainingAt(c, 'b', 15_000)).toBe(295_000);
  });

  it('pauses and resumes without losing time', () => {
    let c = startClock(createClock('10+0'), 'b', 0);
    c = pauseClock(c, 4_000);
    expect(c.remainingMs.b).toBe(596_000);
    expect(remainingAt(c, 'b', 100_000)).toBe(596_000);
    c = startClock(c, 'b', 100_000);
    expect(remainingAt(c, 'b', 101_000)).toBe(595_000);
  });

  it('detects a fallen flag', () => {
    const c = startClock(createClock('3+2'), 'w', 0);
    expect(flaggedColor(c, 179_999)).toBeNull();
    expect(flaggedColor(c, 180_000)).toBe('w');
    expect(remainingAt(c, 'w', 999_999)).toBe(0);
  });

  it('formats clock times', () => {
    expect(formatClock(600_000)).toBe('10:00');
    expect(formatClock(61_500)).toBe('1:02');
    expect(formatClock(9_450)).toBe('9.4');
  });
});
