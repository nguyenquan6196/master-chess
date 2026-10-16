/**
 * Player progression (Phase 5): XP and levels, a daily streak and achievements.
 * Pure rules; persistence lives in services/progress. Names/descriptions are in
 * messages under `achievements.<id>`.
 */

import { BOT_IDS } from '../bot/levels';
import { STYLE_ICONS } from '../bot/styles';

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
  /** Quiz sets (bank topics and generated topics) with a perfect best score. */
  perfectQuizCount: number;
  /** Quiz sets finished at least once, and how many of them were generated topics. */
  quizPlayed: number;
  genQuizPlayed: number;
  puzzlesSolved: number;
  dailySolved: number;
  rushBest: number;
  puzzleRating: number;
  /** Theme-training puzzles solved. */
  themeSolved: number;
  gameRating: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  winsAsBlack: number;
  /** Wins without hints or take-backs. */
  cleanWins: number;
  /** Wins finished within `MINIATURE_MAX_PLIES` half-moves. */
  miniatureWins: number;
  checkmateWins: number;
  promotionsPassed: number;
  /** Bot styles beaten at least once. */
  stylesBeaten: readonly string[];
  /** Ladder bots beaten at least once. */
  botsBeaten: readonly string[];
  customWin: boolean;
  rankFloor: number;
  reviews: number;
}

/** A "miniature": a won game of at most this many half-moves (25 moves each). */
export const MINIATURE_MAX_PLIES = 50;

export const ACHIEVEMENT_GROUPS = ['learn', 'puzzles', 'games', 'ranks', 'habits'] as const;
export type AchievementGroup = (typeof ACHIEVEMENT_GROUPS)[number];

export interface AchievementDef {
  id: string;
  icon: string;
  group: AchievementGroup;
  done: (s: ProgressStats) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // learn
  { id: 'firstLesson', icon: '📖', group: 'learn', done: (s) => s.lessonsDone >= 1 },
  { id: 'lessons3', icon: '📗', group: 'learn', done: (s) => s.lessonsDone >= 3 },
  { id: 'lessons5', icon: '📘', group: 'learn', done: (s) => s.lessonsDone >= 5 },
  { id: 'scholar', icon: '🎓', group: 'learn', done: (s) => s.lessonsDone >= 9 },
  { id: 'lessons12', icon: '📚', group: 'learn', done: (s) => s.lessonsDone >= 12 },
  {
    id: 'allLessons',
    icon: '🏛️',
    group: 'learn',
    done: (s) => s.lessonsTotal > 0 && s.lessonsDone >= s.lessonsTotal,
  },
  { id: 'quizFirst', icon: '📝', group: 'learn', done: (s) => s.quizPlayed >= 1 },
  { id: 'quizTopics5', icon: '🗂️', group: 'learn', done: (s) => s.quizPlayed >= 5 },
  { id: 'perfectQuiz', icon: '💯', group: 'learn', done: (s) => s.perfectQuiz },
  { id: 'perfectQuiz3', icon: '🏅', group: 'learn', done: (s) => s.perfectQuizCount >= 3 },
  { id: 'perfectQuiz6', icon: '🌈', group: 'learn', done: (s) => s.perfectQuizCount >= 6 },
  { id: 'genQuiz', icon: '🎰', group: 'learn', done: (s) => s.genQuizPlayed >= 1 },
  { id: 'genQuizAll', icon: '🧪', group: 'learn', done: (s) => s.genQuizPlayed >= 5 },
  { id: 'reviewer', icon: '🔍', group: 'learn', done: (s) => s.reviews >= 1 },
  { id: 'reviewer10', icon: '🔬', group: 'learn', done: (s) => s.reviews >= 10 },
  { id: 'reviewer25', icon: '🧐', group: 'learn', done: (s) => s.reviews >= 25 },
  { id: 'reviewer50', icon: '📜', group: 'learn', done: (s) => s.reviews >= 50 },
  // puzzles
  { id: 'puzzle1', icon: '🔰', group: 'puzzles', done: (s) => s.puzzlesSolved >= 1 },
  { id: 'puzzle10', icon: '🧩', group: 'puzzles', done: (s) => s.puzzlesSolved >= 10 },
  { id: 'puzzle50', icon: '🪄', group: 'puzzles', done: (s) => s.puzzlesSolved >= 50 },
  { id: 'puzzle100', icon: '🧠', group: 'puzzles', done: (s) => s.puzzlesSolved >= 100 },
  { id: 'puzzle250', icon: '🦉', group: 'puzzles', done: (s) => s.puzzlesSolved >= 250 },
  { id: 'puzzle500', icon: '🧙', group: 'puzzles', done: (s) => s.puzzlesSolved >= 500 },
  { id: 'puzzle1000', icon: '🏯', group: 'puzzles', done: (s) => s.puzzlesSolved >= 1000 },
  { id: 'daily1', icon: '☀️', group: 'puzzles', done: (s) => s.dailySolved >= 1 },
  { id: 'daily7', icon: '📅', group: 'puzzles', done: (s) => s.dailySolved >= 7 },
  { id: 'daily30', icon: '🗓️', group: 'puzzles', done: (s) => s.dailySolved >= 30 },
  { id: 'daily100', icon: '🌅', group: 'puzzles', done: (s) => s.dailySolved >= 100 },
  { id: 'rush10', icon: '💨', group: 'puzzles', done: (s) => s.rushBest >= 10 },
  { id: 'rush15', icon: '⚡', group: 'puzzles', done: (s) => s.rushBest >= 15 },
  { id: 'rush20', icon: '🌪️', group: 'puzzles', done: (s) => s.rushBest >= 20 },
  { id: 'rush30', icon: '🌩️', group: 'puzzles', done: (s) => s.rushBest >= 30 },
  { id: 'rush40', icon: '☄️', group: 'puzzles', done: (s) => s.rushBest >= 40 },
  { id: 'puzzleRating1200', icon: '📊', group: 'puzzles', done: (s) => s.puzzleRating >= 1200 },
  { id: 'puzzleRating1500', icon: '📈', group: 'puzzles', done: (s) => s.puzzleRating >= 1500 },
  { id: 'puzzleRating1800', icon: '🧗', group: 'puzzles', done: (s) => s.puzzleRating >= 1800 },
  { id: 'puzzleRating2000', icon: '🚀', group: 'puzzles', done: (s) => s.puzzleRating >= 2000 },
  { id: 'puzzleRating2200', icon: '🛰️', group: 'puzzles', done: (s) => s.puzzleRating >= 2200 },
  { id: 'theme10', icon: '🏷️', group: 'puzzles', done: (s) => s.themeSolved >= 10 },
  { id: 'theme50', icon: '🎨', group: 'puzzles', done: (s) => s.themeSolved >= 50 },
  // games
  { id: 'firstGame', icon: '♟️', group: 'games', done: (s) => s.gamesPlayed >= 1 },
  { id: 'games10', icon: '🎲', group: 'games', done: (s) => s.gamesPlayed >= 10 },
  { id: 'games25', icon: '🎮', group: 'games', done: (s) => s.gamesPlayed >= 25 },
  { id: 'games50', icon: '🏟️', group: 'games', done: (s) => s.gamesPlayed >= 50 },
  { id: 'games100', icon: '🛡️', group: 'games', done: (s) => s.gamesPlayed >= 100 },
  { id: 'games250', icon: '🏰', group: 'games', done: (s) => s.gamesPlayed >= 250 },
  { id: 'firstWin', icon: '🏁', group: 'games', done: (s) => s.wins >= 1 },
  { id: 'wins10', icon: '🏆', group: 'games', done: (s) => s.wins >= 10 },
  { id: 'wins25', icon: '🎉', group: 'games', done: (s) => s.wins >= 25 },
  { id: 'wins50', icon: '🎖️', group: 'games', done: (s) => s.wins >= 50 },
  { id: 'wins100', icon: '🦾', group: 'games', done: (s) => s.wins >= 100 },
  { id: 'firstDraw', icon: '🤝', group: 'games', done: (s) => s.draws >= 1 },
  { id: 'draws10', icon: '⚖️', group: 'games', done: (s) => s.draws >= 10 },
  { id: 'blackWin', icon: '♚', group: 'games', done: (s) => s.winsAsBlack >= 1 },
  { id: 'blackWins10', icon: '🌑', group: 'games', done: (s) => s.winsAsBlack >= 10 },
  { id: 'cleanWin', icon: '✋', group: 'games', done: (s) => s.cleanWins >= 1 },
  { id: 'cleanWins10', icon: '💪', group: 'games', done: (s) => s.cleanWins >= 10 },
  { id: 'miniature', icon: '🗡️', group: 'games', done: (s) => s.miniatureWins >= 1 },
  { id: 'miniatures5', icon: '🏹', group: 'games', done: (s) => s.miniatureWins >= 5 },
  { id: 'firstMate', icon: '🪤', group: 'games', done: (s) => s.checkmateWins >= 1 },
  { id: 'mate10', icon: '🎯', group: 'games', done: (s) => s.checkmateWins >= 10 },
  { id: 'mate50', icon: '💀', group: 'games', done: (s) => s.checkmateWins >= 50 },
  { id: 'beatChick', icon: '🐣', group: 'games', done: (s) => s.botsBeaten.includes('chick') },
  { id: 'beatTurtle', icon: '🐢', group: 'games', done: (s) => s.botsBeaten.includes('turtle') },
  { id: 'beatFox', icon: '🦊', group: 'games', done: (s) => s.botsBeaten.includes('fox') },
  { id: 'beatWolf', icon: '🐺', group: 'games', done: (s) => s.botsBeaten.includes('wolf') },
  { id: 'beatLion', icon: '🦁', group: 'games', done: (s) => s.botsBeaten.includes('lion') },
  { id: 'beatEagle', icon: '🦅', group: 'games', done: (s) => s.botsBeaten.includes('eagle') },
  { id: 'beatDragon', icon: '🐉', group: 'games', done: (s) => s.botsBeaten.includes('dragon') },
  { id: 'beatMaster', icon: '👑', group: 'games', done: (s) => s.botsBeaten.includes('master') },
  {
    id: 'bossSlayer',
    icon: '🎇',
    group: 'games',
    done: (s) => BOT_IDS.every((b) => s.botsBeaten.includes(b)),
  },
  { id: 'customWin', icon: '🎛️', group: 'games', done: (s) => s.customWin },
  {
    id: 'styleAggressive',
    icon: STYLE_ICONS.aggressive,
    group: 'games',
    done: (s) => s.stylesBeaten.includes('aggressive'),
  },
  {
    id: 'styleDefensive',
    icon: STYLE_ICONS.defensive,
    group: 'games',
    done: (s) => s.stylesBeaten.includes('defensive'),
  },
  {
    id: 'stylePositional',
    icon: STYLE_ICONS.positional,
    group: 'games',
    done: (s) => s.stylesBeaten.includes('positional'),
  },
  {
    id: 'styleChaotic',
    icon: STYLE_ICONS.chaotic,
    group: 'games',
    done: (s) => s.stylesBeaten.includes('chaotic'),
  },
  // ranks
  { id: 'promotionWin', icon: '⚔️', group: 'ranks', done: (s) => s.promotionsPassed >= 1 },
  { id: 'promotions3', icon: '🪜', group: 'ranks', done: (s) => s.promotionsPassed >= 3 },
  { id: 'rankSilver', icon: '🥈', group: 'ranks', done: (s) => s.rankFloor >= 1 },
  { id: 'rankGold', icon: '🥇', group: 'ranks', done: (s) => s.rankFloor >= 2 },
  { id: 'rankPlatinum', icon: '💠', group: 'ranks', done: (s) => s.rankFloor >= 3 },
  { id: 'rankDiamond', icon: '💎', group: 'ranks', done: (s) => s.rankFloor >= 4 },
  { id: 'rankElite', icon: '🔮', group: 'ranks', done: (s) => s.rankFloor >= 5 },
  { id: 'rankGrandmaster', icon: '🏵️', group: 'ranks', done: (s) => s.rankFloor >= 6 },
  { id: 'rankChallenger', icon: '🌠', group: 'ranks', done: (s) => s.rankFloor >= 7 },
  { id: 'gameRating1000', icon: '📶', group: 'ranks', done: (s) => s.gameRating >= 1000 },
  { id: 'gameRating1500', icon: '🔝', group: 'ranks', done: (s) => s.gameRating >= 1500 },
  { id: 'gameRating2000', icon: '🌌', group: 'ranks', done: (s) => s.gameRating >= 2000 },
  // habits
  { id: 'streak3', icon: '🔥', group: 'habits', done: (s) => s.streakBest >= 3 },
  { id: 'streak7', icon: '🔥', group: 'habits', done: (s) => s.streakBest >= 7 },
  { id: 'streak14', icon: '♨️', group: 'habits', done: (s) => s.streakBest >= 14 },
  { id: 'streak30', icon: '🌋', group: 'habits', done: (s) => s.streakBest >= 30 },
  { id: 'streak100', icon: '🏔️', group: 'habits', done: (s) => s.streakBest >= 100 },
  { id: 'level5', icon: '⭐', group: 'habits', done: (s) => s.level >= 5 },
  { id: 'level10', icon: '🌟', group: 'habits', done: (s) => s.level >= 10 },
  { id: 'level15', icon: '✨', group: 'habits', done: (s) => s.level >= 15 },
  { id: 'level20', icon: '💫', group: 'habits', done: (s) => s.level >= 20 },
  { id: 'level30', icon: '🌙', group: 'habits', done: (s) => s.level >= 30 },
  { id: 'level50', icon: '🌞', group: 'habits', done: (s) => s.level >= 50 },
  {
    id: 'allRounder',
    icon: '🧭',
    group: 'habits',
    done: (s) =>
      s.lessonsDone >= 1 && s.quizPlayed >= 1 && s.puzzlesSolved >= 1 && s.gamesPlayed >= 1,
  },
];

/** Achievement ids newly earned (not in `unlocked`). */
export function newAchievements(
  stats: ProgressStats,
  unlocked: Readonly<Record<string, number>>,
): string[] {
  return ACHIEVEMENTS.filter((a) => !(a.id in unlocked) && a.done(stats)).map((a) => a.id);
}
