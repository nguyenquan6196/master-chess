import { z } from 'zod';
import {
  GameRecordSchema,
  ProfileSchema,
  PuzzleAttemptSchema,
  withProfileDefaultsV2,
  withProfileDefaultsV3,
  withProfileDefaultsV4,
  withGameDefaultsV4,
  withSettingsDefaultsV5,
  withProfileDefaultsV6,
  migratePieceSetV7,
  migratePieceSetV8,
  type GameRecord,
  type Profile,
  type PuzzleAttempt,
} from './schema';

/** Bump when the save format changes, and add a step to `migrateSaveFile`. */
export const SAVE_SCHEMA_VERSION = 9;
export const SAVE_APP_ID = 'master-chess';

export const SaveFileSchema = z.object({
  app: z.literal(SAVE_APP_ID),
  schemaVersion: z.literal(SAVE_SCHEMA_VERSION),
  exportedAt: z.number(),
  profile: ProfileSchema,
  games: z.array(GameRecordSchema),
  puzzleAttempts: z.array(PuzzleAttemptSchema),
});
export type SaveFile = z.infer<typeof SaveFileSchema>;

export function buildSaveFile(
  profile: Profile,
  games: GameRecord[],
  puzzleAttempts: PuzzleAttempt[],
  now: number,
): SaveFile {
  return {
    app: SAVE_APP_ID,
    schemaVersion: SAVE_SCHEMA_VERSION,
    exportedAt: now,
    profile,
    games: games.filter((g) => g.profileId === profile.id),
    puzzleAttempts: puzzleAttempts.filter((a) => a.profileId === profile.id),
  };
}

export type SaveFileError = 'invalid-json' | 'not-a-save-file' | 'newer-version' | 'invalid-data';

/** Upgrades older save files step by step to the current schema. */
function migrateSaveFile(data: Record<string, unknown>): Record<string, unknown> {
  let d = data;
  if (d.schemaVersion === 1) {
    // v2 (Phase 2): puzzle rating, rush/quiz bests on the profile; puzzle attempts list.
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    d = { ...d, schemaVersion: 2, profile: withProfileDefaultsV2(profile), puzzleAttempts: [] };
  }
  if (d.schemaVersion === 2) {
    // v3 (Phase 3): lesson progress on the profile.
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    d = { ...d, schemaVersion: 3, profile: withProfileDefaultsV3(profile) };
  }
  if (d.schemaVersion === 3) {
    // v4 (Phase 4): game rating + rank on the profile; bot style on games.
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    const games = Array.isArray(d.games)
      ? d.games.map((g: unknown) => (typeof g === 'object' && g ? withGameDefaultsV4(g) : g))
      : [];
    d = { ...d, schemaVersion: 4, profile: withProfileDefaultsV4(profile), games };
  }
  if (d.schemaVersion === 4) {
    // v5 (Phase 5): appearance and sound settings.
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    d = { ...d, schemaVersion: 5, profile: withSettingsDefaultsV5(profile) };
  }
  if (d.schemaVersion === 5) {
    // v6 (Phase 5): XP, streak and achievements.
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    d = { ...d, schemaVersion: 6, profile: withProfileDefaultsV6(profile) };
  }
  if (d.schemaVersion === 6) {
    // v7 (Phase 5.6): piece sets follow the theme by default.
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    d = { ...d, schemaVersion: 7, profile: migratePieceSetV7(profile) };
  }
  if (d.schemaVersion === 7) {
    // v8: the "minimal" and "glyph" piece sets were removed.
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    d = { ...d, schemaVersion: 8, profile: migratePieceSetV8(profile) };
  }
  if (d.schemaVersion === 8) {
    // v9 (Phase 6): board view setting (2D by default).
    const profile = typeof d.profile === 'object' && d.profile ? d.profile : {};
    d = { ...d, schemaVersion: 9, profile: withSettingsDefaultsV5(profile) };
  }
  return d;
}

export function parseSaveFile(
  text: string,
): { ok: true; data: SaveFile } | { ok: false; error: SaveFileError } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid-json' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== SAVE_APP_ID) {
    return { ok: false, error: 'not-a-save-file' };
  }
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version !== 'number' || version > SAVE_SCHEMA_VERSION) {
    return { ok: false, error: 'newer-version' };
  }
  const parsed = SaveFileSchema.safeParse(migrateSaveFile(raw as Record<string, unknown>));
  if (!parsed.success) return { ok: false, error: 'invalid-data' };
  // Never trust cross-profile references inside a file.
  const id = parsed.data.profile.id;
  const games = parsed.data.games.filter((g) => g.profileId === id);
  const puzzleAttempts = parsed.data.puzzleAttempts.filter((a) => a.profileId === id);
  return { ok: true, data: { ...parsed.data, games, puzzleAttempts } };
}
