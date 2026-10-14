import { z } from 'zod';
import { BOT_IDS } from '../bot/levels';
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

export const ProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(PROFILE_NAME_MAX),
  avatar: z.string().min(1).max(8),
  createdAt: z.number(),
  lastActiveAt: z.number(),
  settings: ProfileSettingsSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

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
  botId: z.enum(BOT_IDS),
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
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type GameRecord = z.infer<typeof GameRecordSchema>;
export type GameResult = NonNullable<GameRecord['result']>;
