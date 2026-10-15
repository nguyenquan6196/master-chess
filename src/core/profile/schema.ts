import { z } from 'zod';
import { BOT_IDS } from '../bot/levels';
import { BOT_STYLES } from '../bot/styles';
import { GAME_RATING } from '../rating/rank';
import { GameReviewSchema } from '../review/review';
import { TIME_CONTROL_IDS } from '../game/clock';

/**
 * Persisted data shapes (IndexedDB records and save files). Every change here needs a
 * Dexie version bump + migration and a SAVE_SCHEMA_VERSION bump (CLAUDE.md → Dữ liệu).
 */

export const LOCALE_VALUES = ['vi', 'en', 'ja'] as const;
export const THEME_PREFERENCE_VALUES = ['auto', 'classic', 'midnight'] as const;

export const ProfileSettingsSchema = z.object({
  locale: z.enum(LOCALE_VALUES),
  theme: z.enum(THEME_PREFERENCE_VALUES),
  sfxEnabled: z.boolean(),
  sfxVolume: z.number().min(0).max(1),
  showEvalBar: z.boolean(),
});
export type ProfileSettings = z.infer<typeof ProfileSettingsSchema>;

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  locale: 'vi',
  theme: 'auto',
  sfxEnabled: true,
  sfxVolume: 0.7,
  showEvalBar: false,
};

export const PROFILE_NAME_MAX = 24;
export const PROFILE_AVATARS = [
  '♟️',
  '🦄',
  '🐱',
  '🐶',
  '🐼',
  '🦉',
  '🐸',
  '🚀',
  '⭐',
  '🎩',
  '🌸',
  '🔥',
];

export const RatingSchema = z.object({ rating: z.number(), rd: z.number(), vol: z.number() });

/** Puzzle rating starts low with high uncertainty so it settles quickly. */
export const DEFAULT_PUZZLE_RATING = { rating: 800, rd: 300, vol: 0.06 };

export const RUSH_DURATIONS = ['3m', '5m'] as const;

export const ProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(PROFILE_NAME_MAX),
  avatar: z.string().min(1).max(8),
  createdAt: z.number(),
  lastActiveAt: z.number(),
  settings: ProfileSettingsSchema,
  /** Added in schema v2 (Phase 2). */
  puzzleRating: RatingSchema,
  /** Best Puzzle Rush score per duration. */
  rushBest: z.partialRecord(z.enum(RUSH_DURATIONS), z.number().int().min(0)),
  /** Best quiz result per topic (or "all"), as a 0–1 ratio. */
  quizBest: z.record(z.string(), z.number().min(0).max(1)),
  /** Added in schema v3 (Phase 3): completed lessons with their quiz score (0–1). */
  lessons: z.record(
    z.string(),
    z.object({ completedAt: z.number(), score: z.number().min(0).max(1) }),
  ),
  /** Added in schema v4 (Phase 4): rating from rated bot games (spec §6.7). */
  gameRating: RatingSchema,
  /** Index into RANKS of the highest rank won through a promotion match. */
  rankFloor: z.number().int().min(0),
});
export type Profile = z.infer<typeof ProfileSchema>;

/** Fields added after schema v1, used by IndexedDB upgrades and save-file migrations. */
export function withProfileDefaultsV2<T extends object>(
  p: T,
): Pick<Profile, 'puzzleRating' | 'rushBest' | 'quizBest'> & T {
  const defaults: Pick<Profile, 'puzzleRating' | 'rushBest' | 'quizBest'> = {
    puzzleRating: { ...DEFAULT_PUZZLE_RATING },
    rushBest: {},
    quizBest: {},
  };
  return { ...defaults, ...p };
}

/** Fields added in schema v3. */
export function withProfileDefaultsV3<T extends object>(p: T): Pick<Profile, 'lessons'> & T {
  const defaults: Pick<Profile, 'lessons'> = { lessons: {} };
  return { ...defaults, ...p };
}

/** Fields added in schema v4. */
export function withProfileDefaultsV4<T extends object>(
  p: T,
): Pick<Profile, 'gameRating' | 'rankFloor'> & T {
  const defaults: Pick<Profile, 'gameRating' | 'rankFloor'> = {
    gameRating: { ...GAME_RATING.initial },
    rankFloor: 0,
  };
  return { ...defaults, ...p };
}

/** Game fields added in schema v4 (older games were all against balanced ladder bots). */
export function withGameDefaultsV4<T extends object>(g: T): Pick<GameRecord, 'style'> & T {
  const defaults: Pick<GameRecord, 'style'> = { style: 'balanced' };
  return { ...defaults, ...g };
}

export const PUZZLE_MODES = ['rated', 'theme', 'rush', 'daily'] as const;
export type PuzzleMode = (typeof PUZZLE_MODES)[number];

export const PuzzleAttemptSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  puzzleId: z.string().min(1),
  mode: z.enum(PUZZLE_MODES),
  /** Solved with no mistakes, hints or revealed solution. */
  solved: z.boolean(),
  puzzleRating: z.number(),
  ratingBefore: z.number().optional(),
  ratingAfter: z.number().optional(),
  timeMs: z.number().min(0),
  at: z.number(),
});
export type PuzzleAttempt = z.infer<typeof PuzzleAttemptSchema>;

const ColorSchema = z.enum(['w', 'b']);

export const ClockStateSchema = z.object({
  timeControl: z.enum(TIME_CONTROL_IDS),
  remainingMs: z.object({ w: z.number(), b: z.number() }),
  running: ColorSchema.nullable(),
  runningSince: z.number().nullable(),
});

export const END_REASONS = [
  'checkmate',
  'stalemate',
  'threefold',
  'insufficient',
  'fifty-moves',
  'resign',
  'timeout',
  'agreement',
] as const;
export type EndReason = (typeof END_REASONS)[number];

export const GameRecordSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  mode: z.literal('bot'),
  botId: z.enum([...BOT_IDS, 'custom']),
  /** Strength of the custom bot (only when botId is "custom"). */
  customElo: z.number().optional(),
  /** Added in schema v4. */
  style: z.enum(BOT_STYLES),
  playerColor: ColorSchema,
  startFen: z.string(),
  /** Moves in UCI notation; the position is rebuilt by replaying them. */
  moves: z.array(z.string()),
  clock: ClockStateSchema,
  status: z.enum(['ongoing', 'finished']),
  result: z.enum(['win', 'loss', 'draw']).optional(),
  endReason: z.enum(END_REASONS).optional(),
  pgn: z.string().optional(),
  hintsUsed: z.number().int().min(0),
  undosUsed: z.number().int().min(0),
  /** Set when the game ends: counted for the player's game rating? */
  rated: z.boolean().optional(),
  ratingDelta: z.number().optional(),
  ratingAfter: z.number().optional(),
  /** This game was a promotion match into rank `to` (index into RANKS). */
  promotion: z.object({ to: z.number().int(), passed: z.boolean() }).optional(),
  /** Engine analysis for Game Review (optional, computed on demand). */
  review: GameReviewSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type GameRecord = z.infer<typeof GameRecordSchema>;
export type GameResult = NonNullable<GameRecord['result']>;
