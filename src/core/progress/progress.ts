/**
 * Player progression (Phase 5): XP and levels, a daily streak and achievements.
 * Pure rules; persistence lives in services/progress. Names/descriptions are in
 * messages under `achievements.<id>`.
 */

/** What earned XP. */
export type XpEvent =
  | { kind: 'lesson'; score: number; firstTime: boolean }
  | { kind: 'quiz'; correct: number }
  | { kind: 'puzzle'; solved: boolean; mode: 'rated' | 'theme' | 'rush' | 'daily' }
  | { kind: 'rush'; score: number }
  | { kind: 'game'; result: 'win' | 'loss' | 'draw'; tier: 1 | 2 | 3 | 4 }
  | { kind: 'review' };

export const XP = {
  lessonFirst: 50,
  lessonRepeat: 10,
  lessonPerfectBonus: 20,
  quizPerCorrect: 2,
  puzzleSolved: 8,
  puzzleDailyBonus: 20,
  rushPerPoint: 2,
  gameWinPerTier: 25,
  gameDraw: 15,
  gameLoss: 5,
  review: 10,
  /** XP needed to go from level n to n+1 is `levelStep * n`. */
  levelStep: 100,
} as const;

export function xpFor(e: XpEvent): number {
  switch (e.kind) {
    case 'lesson':
      return (
        (e.firstTime ? XP.lessonFirst : XP.lessonRepeat) +
        (e.score >= 1 ? XP.lessonPerfectBonus : 0)
      );
    case 'quiz':
      return e.correct * XP.quizPerCorrect;
    case 'puzzle':
      return e.solved ? XP.puzzleSolved + (e.mode === 'daily' ? XP.puzzleDailyBonus : 0) : 0;
    case 'rush':
      return e.score * XP.rushPerPoint;
    case 'game':
      return e.result === 'win'
        ? XP.gameWinPerTier * e.tier
        : e.result === 'draw'
          ? XP.gameDraw
          : XP.gameLoss;
    case 'review':
      return XP.review;
  }
}

export interface LevelInfo {
  level: number;
  /** XP earned inside the current level and needed for the next one. */
  into: number;
  needed: number;
}

/** Level 1 starts at 0 XP; level n → n+1 costs `levelStep × n`. */
export function levelFor(xp: number): LevelInfo {
  let level = 1;
  let floor = 0;
  while (xp >= floor + XP.levelStep * level) {
    floor += XP.levelStep * level;
    level++;
  }
  return { level, into: xp - floor, needed: XP.levelStep * level };
}

/** Local calendar day "YYYY-MM-DD" (the streak follows the player's own days). */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface Streak {
  lastDay: string | null;
  current: number;
  best: number;
}

/** Counts the day of `now` as active: same day keeps, next day extends, a gap resets. */
export function touchStreak(s: Streak, now: number): Streak {
  const today = dayKey(now);
  if (s.lastDay === today) return s;
  const yesterday = dayKey(now - 24 * 3600 * 1000);
  const current = s.lastDay === yesterday ? s.current + 1 : 1;
  return { lastDay: today, current, best: Math.max(s.best, current) };
}

/** Streak still alive today (played today or yesterday). */
export function liveStreak(s: Streak, now: number): number {
  if (!s.lastDay) return 0;
  return s.lastDay === dayKey(now) || s.lastDay === dayKey(now - 24 * 3600 * 1000) ? s.current : 0;
}

/** Facts achievements are checked against (gathered by the service). */
export interface ProgressStats {
  level: number;
  streakBest: number;
  lessonsDone: number;
  lessonsTotal: number;
  perfectQuiz: boolean;
  puzzlesSolved: number;
  dailySolved: number;
  rushBest: number;
  gamesPlayed: number;
  /** Ladder bots beaten at least once. */
  botsBeaten: readonly string[];
  customWin: boolean;
  rankFloor: number;
  reviews: number;
}

export interface AchievementDef {
  id: string;
  icon: string;
  done: (s: ProgressStats) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'firstLesson', icon: '📖', done: (s) => s.lessonsDone >= 1 },
  { id: 'scholar', icon: '🎓', done: (s) => s.lessonsDone >= 9 },
  {
    id: 'allLessons',
    icon: '🏛️',
    done: (s) => s.lessonsTotal > 0 && s.lessonsDone >= s.lessonsTotal,
  },
  { id: 'perfectQuiz', icon: '💯', done: (s) => s.perfectQuiz },
  { id: 'puzzle10', icon: '🧩', done: (s) => s.puzzlesSolved >= 10 },
  { id: 'puzzle100', icon: '🧠', done: (s) => s.puzzlesSolved >= 100 },
  { id: 'daily7', icon: '📅', done: (s) => s.dailySolved >= 7 },
  { id: 'rush15', icon: '⚡', done: (s) => s.rushBest >= 15 },
  { id: 'rush30', icon: '🌩️', done: (s) => s.rushBest >= 30 },
  { id: 'firstGame', icon: '♟️', done: (s) => s.gamesPlayed >= 1 },
  { id: 'firstWin', icon: '🏁', done: (s) => s.botsBeaten.length >= 1 },
  { id: 'beatFox', icon: '🦊', done: (s) => s.botsBeaten.includes('fox') },
  { id: 'beatLion', icon: '🦁', done: (s) => s.botsBeaten.includes('lion') },
  { id: 'beatDragon', icon: '🐉', done: (s) => s.botsBeaten.includes('dragon') },
  { id: 'beatMaster', icon: '👑', done: (s) => s.botsBeaten.includes('master') },
  { id: 'customWin', icon: '🎛️', done: (s) => s.customWin },
  { id: 'rankSilver', icon: '🥈', done: (s) => s.rankFloor >= 1 },
  { id: 'rankGold', icon: '🥇', done: (s) => s.rankFloor >= 2 },
  { id: 'rankDiamond', icon: '💎', done: (s) => s.rankFloor >= 4 },
  { id: 'reviewer', icon: '🔍', done: (s) => s.reviews >= 1 },
  { id: 'streak3', icon: '🔥', done: (s) => s.streakBest >= 3 },
  { id: 'streak7', icon: '🔥', done: (s) => s.streakBest >= 7 },
  { id: 'streak30', icon: '🌋', done: (s) => s.streakBest >= 30 },
  { id: 'level5', icon: '⭐', done: (s) => s.level >= 5 },
  { id: 'level10', icon: '🌟', done: (s) => s.level >= 10 },
];

/** Achievement ids newly earned (not in `unlocked`). */
export function newAchievements(
  stats: ProgressStats,
  unlocked: Readonly<Record<string, number>>,
): string[] {
  return ACHIEVEMENTS.filter((a) => !(a.id in unlocked) && a.done(stats)).map((a) => a.id);
}
