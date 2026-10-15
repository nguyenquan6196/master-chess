import { describe, expect, it } from 'vitest';
import vi from '../../../messages/vi.json';
import {
  ACHIEVEMENTS,
  dayKey,
  levelFor,
  liveStreak,
  newAchievements,
  touchStreak,
  xpFor,
  XP,
  type ProgressStats,
} from './progress';

const DAY = 24 * 3600 * 1000;
const noon = new Date(2026, 9, 15, 12).getTime();

const stats = (p: Partial<ProgressStats> = {}): ProgressStats => ({
  level: 1,
  streakBest: 0,
  lessonsDone: 0,
  lessonsTotal: 18,
  perfectQuiz: false,
  puzzlesSolved: 0,
  dailySolved: 0,
  rushBest: 0,
  gamesPlayed: 0,
  botsBeaten: [],
  customWin: false,
  rankFloor: 0,
  reviews: 0,
  ...p,
});

describe('core/progress', () => {
  it('awards XP per event', () => {
    expect(xpFor({ kind: 'lesson', score: 1, firstTime: true })).toBe(
      XP.lessonFirst + XP.lessonPerfectBonus,
    );
    expect(xpFor({ kind: 'quiz', correct: 7 })).toBe(14);
    expect(xpFor({ kind: 'puzzle', solved: false, mode: 'rated' })).toBe(0);
    expect(xpFor({ kind: 'puzzle', solved: true, mode: 'daily' })).toBe(
      XP.puzzleSolved + XP.puzzleDailyBonus,
    );
    expect(xpFor({ kind: 'game', result: 'win', tier: 3 })).toBe(75);
    expect(xpFor({ kind: 'game', result: 'loss', tier: 4 })).toBe(XP.gameLoss);
  });

  it('computes levels with growing steps', () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, needed: 100 });
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100)).toEqual({ level: 2, into: 0, needed: 200 });
    expect(levelFor(350)).toEqual({ level: 3, into: 50, needed: 300 });
  });

  it('extends, keeps or resets the streak by calendar day', () => {
    const s0 = { lastDay: null, current: 0, best: 0 };
    const s1 = touchStreak(s0, noon);
    expect(s1).toEqual({ lastDay: dayKey(noon), current: 1, best: 1 });
    expect(touchStreak(s1, noon + 3600_000)).toBe(s1);
    const s2 = touchStreak(s1, noon + DAY);
    expect(s2.current).toBe(2);
    const s3 = touchStreak(s2, noon + 4 * DAY);
    expect(s3).toMatchObject({ current: 1, best: 2 });
    expect(liveStreak(s2, noon + DAY)).toBe(2);
    expect(liveStreak(s2, noon + 2 * DAY)).toBe(2);
    expect(liveStreak(s2, noon + 3 * DAY)).toBe(0);
  });

  it('unlocks achievements once', () => {
    const got = newAchievements(stats({ lessonsDone: 1, botsBeaten: ['fox'], gamesPlayed: 3 }), {});
    expect(got).toEqual(
      expect.arrayContaining(['firstLesson', 'firstWin', 'beatFox', 'firstGame']),
    );
    expect(newAchievements(stats({ lessonsDone: 1 }), { firstLesson: 1 })).not.toContain(
      'firstLesson',
    );
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('has a name and description for every achievement', () => {
    const names = vi.achievements as Record<string, { name: string; desc: string }>;
    for (const a of ACHIEVEMENTS) expect(names[a.id]?.name, a.id).toBeTruthy();
  });
});
