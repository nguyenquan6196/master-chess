import Dexie, { type Table } from 'dexie';
import {
  withProfileDefaultsV2,
  withProfileDefaultsV3,
  withProfileDefaultsV4,
  withGameDefaultsV4,
  withSettingsDefaultsV5,
  type GameRecord,
  type Profile,
  type PuzzleAttempt,
} from '@/core/profile/schema';

export interface MediaRecord {
  id: string;
  profileId: string;
  blob: Blob;
  updatedAt: number;
}

/**
 * IndexedDB schema. To change it: add `this.version(N + 1).stores(...).upgrade(...)` below
 * (never edit an existing version) and bump SAVE_SCHEMA_VERSION if save files change.
 */
export class MasterChessDB extends Dexie {
  profiles!: Table<Profile, string>;
  games!: Table<GameRecord, string>;
  puzzleAttempts!: Table<PuzzleAttempt, string>;
  /** Player-uploaded images (custom backdrop), not part of save files. */
  media!: Table<MediaRecord, string>;

  constructor() {
    super('master-chess');
    this.version(1).stores({
      profiles: 'id, lastActiveAt',
      games: 'id, profileId, [profileId+status], [profileId+updatedAt]',
    });
    // v2 (Phase 2): puzzle attempts; puzzle rating + rush/quiz bests on profiles.
    this.version(2)
      .stores({ puzzleAttempts: 'id, profileId, [profileId+puzzleId], [profileId+at]' })
      .upgrade((tx) =>
        tx
          .table('profiles')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            Object.assign(p, withProfileDefaultsV2(p));
          }),
      );
    // v3 (Phase 3): lesson progress on profiles.
    this.version(3)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('profiles')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            Object.assign(p, withProfileDefaultsV3(p));
          }),
      );
    // v4 (Phase 4): game rating + rank on profiles; bot style on games.
    this.version(4)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('profiles')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            Object.assign(p, withProfileDefaultsV4(p));
          });
        await tx
          .table('games')
          .toCollection()
          .modify((g: Record<string, unknown>) => {
            Object.assign(g, withGameDefaultsV4(g));
          });
      });
    // v5 (Phase 5): appearance/sound settings; custom backdrop images.
    this.version(5)
      .stores({ media: 'id, profileId' })
      .upgrade((tx) =>
        tx
          .table('profiles')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            Object.assign(p, withSettingsDefaultsV5(p));
          }),
      );
  }
}

let instance: MasterChessDB | null = null;

/** Lazily opened so server rendering never touches IndexedDB. */
export function getDb(): MasterChessDB {
  return (instance ??= new MasterChessDB());
}

/** Asks the browser not to evict our data under storage pressure (spec §8.1). */
export function requestPersistentStorage(): void {
  void navigator.storage?.persist?.().catch(() => undefined);
}
