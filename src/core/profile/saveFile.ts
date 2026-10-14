import { z } from 'zod';
import { GameRecordSchema, ProfileSchema, type GameRecord, type Profile } from './schema';

/** Bump when the save format changes, and add a step to `migrateSaveFile`. */
export const SAVE_SCHEMA_VERSION = 1;
export const SAVE_APP_ID = 'master-chess';

export const SaveFileSchema = z.object({
  app: z.literal(SAVE_APP_ID),
  schemaVersion: z.literal(SAVE_SCHEMA_VERSION),
  exportedAt: z.number(),
  profile: ProfileSchema,
  games: z.array(GameRecordSchema),
});
export type SaveFile = z.infer<typeof SaveFileSchema>;

export function buildSaveFile(profile: Profile, games: GameRecord[], now: number): SaveFile {
  return {
    app: SAVE_APP_ID,
    schemaVersion: SAVE_SCHEMA_VERSION,
    exportedAt: now,
    profile,
    games: games.filter((g) => g.profileId === profile.id),
  };
}

export type SaveFileError = 'invalid-json' | 'not-a-save-file' | 'newer-version' | 'invalid-data';

/** Upgrades older save files step by step to the current schema. */
function migrateSaveFile(data: Record<string, unknown>): Record<string, unknown> {
  // No older versions yet. Example for the future:
  // if (data.schemaVersion === 1) data = { ...data, schemaVersion: 2, ... };
  return data;
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
  const games = parsed.data.games.filter((g) => g.profileId === parsed.data.profile.id);
  return { ok: true, data: { ...parsed.data, games } };
}
