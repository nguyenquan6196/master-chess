import Dexie, { type Table } from 'dexie';
import type { GameRecord, Profile } from '@/core/profile/schema';

/**
 * IndexedDB schema. To change it: add `this.version(N + 1).stores(...).upgrade(...)` below
 * (never edit an existing version) and bump SAVE_SCHEMA_VERSION if save files change.
 */
export class MasterChessDB extends Dexie {
  profiles!: Table<Profile, string>;
  games!: Table<GameRecord, string>;

  constructor() {
    super('master-chess');
    this.version(1).stores({
      profiles: 'id, lastActiveAt',
      games: 'id, profileId, [profileId+status], [profileId+updatedAt]',
    });
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
