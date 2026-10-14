import type { SaveFile } from '@/core/profile/saveFile';
import {
  DEFAULT_PROFILE_SETTINGS,
  PROFILE_NAME_MAX,
  type GameRecord,
  type Profile,
  type ProfileSettings,
} from '@/core/profile/schema';
import { getDb } from './db';

const newId = () => crypto.randomUUID();

export const profileRepo = {
  list(): Promise<Profile[]> {
    return getDb().profiles.orderBy('lastActiveAt').reverse().toArray();
  },

  get(id: string): Promise<Profile | undefined> {
    return getDb().profiles.get(id);
  },

  async create(name: string, avatar: string, settings: Partial<ProfileSettings>): Promise<Profile> {
    const now = Date.now();
    const profile: Profile = {
      id: newId(),
      name: name.trim().slice(0, PROFILE_NAME_MAX),
      avatar,
      createdAt: now,
      lastActiveAt: now,
      settings: { ...DEFAULT_PROFILE_SETTINGS, ...settings },
    };
    await getDb().profiles.add(profile);
    return profile;
  },

  async touch(id: string): Promise<void> {
    await getDb().profiles.update(id, { lastActiveAt: Date.now() });
  },

  async rename(id: string, name: string, avatar: string): Promise<void> {
    await getDb().profiles.update(id, { name: name.trim().slice(0, PROFILE_NAME_MAX), avatar });
  },

  async updateSettings(id: string, settings: ProfileSettings): Promise<void> {
    await getDb().profiles.update(id, { settings });
  },

  /** Deletes the profile and all of its games. */
  async remove(id: string): Promise<void> {
    const db = getDb();
    await db.transaction('rw', db.profiles, db.games, async () => {
      await db.games.where('profileId').equals(id).delete();
      await db.profiles.delete(id);
    });
  },

  /** Imports a validated save file, replacing any existing profile with the same id. */
  async importSave(save: SaveFile): Promise<Profile> {
    const db = getDb();
    await db.transaction('rw', db.profiles, db.games, async () => {
      await db.games.where('profileId').equals(save.profile.id).delete();
      await db.profiles.put(save.profile);
      await db.games.bulkPut(save.games);
    });
    return save.profile;
  },
};

export const gameRepo = {
  newId,

  get(id: string): Promise<GameRecord | undefined> {
    return getDb().games.get(id);
  },

  async save(game: GameRecord): Promise<void> {
    await getDb().games.put({ ...game, updatedAt: Date.now() });
  },

  /** The profile's unfinished game, if any (at most one is kept). */
  async getOngoing(profileId: string): Promise<GameRecord | undefined> {
    return getDb().games.where('[profileId+status]').equals([profileId, 'ongoing']).last();
  },

  listByProfile(profileId: string): Promise<GameRecord[]> {
    return getDb()
      .games.where('[profileId+updatedAt]')
      .between([profileId, -Infinity], [profileId, Infinity])
      .reverse()
      .toArray();
  },
};
