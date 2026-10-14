import Dexie, { type Table } from 'dexie';
import {
  withProfileDefaultsV2,
  withProfileDefaultsV3,
  type GameRecord,
  type Profile,
  type PuzzleAttempt,
} from '@/core/profile/schema';

/**
 * IndexedDB schema. To change it: add `this.version(N + 1).stores(...).upgrade(...)` below
 * (never edit an existing version) and bump SAVE_SCHEMA_VERSION if save files change.
 */
export class MasterChessDB extends Dexie {
  profiles!: Table<Profile, string>;
  games!: Table<GameRecord, string>;
  puzzleAttempts!: Table<PuzzleAttempt, string>;

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
