import type { GameReviewData } from '@/core/review/review';
import { GAME_RATING } from '@/core/rating/rank';
import type { SaveFile } from '@/core/profile/saveFile';
import {
  DEFAULT_PROFILE_SETTINGS,
  PROFILE_NAME_MAX,
  DEFAULT_PUZZLE_RATING,
  type GameRecord,
  type Profile,
  type ProfileSettings,
  type PuzzleAttempt,
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
      puzzleRating: { ...DEFAULT_PUZZLE_RATING },
      rushBest: {},
      quizBest: {},
      lessons: {},
      gameRating: { ...GAME_RATING.initial },
      rankFloor: 0,
      xp: 0,
      streak: { lastDay: null, current: 0, best: 0 },
      achievements: {},
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

  async update(
    id: string,
    patch: Partial<Pick<Profile, 'puzzleRating' | 'rushBest' | 'quizBest' | 'lessons'>>,
  ): Promise<void> {
    await getDb().profiles.update(id, patch);
  },

  /** Deletes the profile and all of its games. */
  async remove(id: string): Promise<void> {
    const db = getDb();
    await db.transaction('rw', db.profiles, db.games, db.puzzleAttempts, async () => {
      await db.games.where('profileId').equals(id).delete();
      await db.puzzleAttempts.where('profileId').equals(id).delete();
      await db.profiles.delete(id);
    });
  },

  /** Imports a validated save file, replacing any existing profile with the same id. */
  async importSave(save: SaveFile): Promise<Profile> {
    const db = getDb();
    await db.transaction('rw', db.profiles, db.games, db.puzzleAttempts, async () => {
      await db.games.where('profileId').equals(save.profile.id).delete();
      await db.puzzleAttempts.where('profileId').equals(save.profile.id).delete();
      await db.profiles.put(save.profile);
      await db.games.bulkPut(save.games);
      await db.puzzleAttempts.bulkPut(save.puzzleAttempts);
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

  /** Stores Game Review data without touching updatedAt (keeps history order). */
  async saveReview(id: string, review: GameReviewData): Promise<void> {
    await getDb().games.update(id, { review });
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

export const puzzleRepo = {
  newId,

  async add(attempt: PuzzleAttempt): Promise<void> {
    await getDb().puzzleAttempts.put(attempt);
  },

  /** Ids of every puzzle this player has already seen (to avoid repeats). */
  async seenIds(profileId: string): Promise<Set<string>> {
    const keys = await getDb()
      .puzzleAttempts.where('profileId')
      .equals(profileId)
      .toArray((rows) => rows.map((r) => r.puzzleId));
    return new Set(keys);
  },

  /** Most recent attempts first. */
  listRecent(profileId: string, limit = 100): Promise<PuzzleAttempt[]> {
    return getDb()
      .puzzleAttempts.where('[profileId+at]')
      .between([profileId, -Infinity], [profileId, Infinity])
      .reverse()
      .limit(limit)
      .toArray();
  },

  /** Every attempt of the player (for save files). */
  listAll(profileId: string): Promise<PuzzleAttempt[]> {
    return getDb().puzzleAttempts.where('profileId').equals(profileId).toArray();
  },

  async findAttempt(profileId: string, puzzleId: string): Promise<PuzzleAttempt | undefined> {
    return getDb()
      .puzzleAttempts.where('[profileId+puzzleId]')
      .equals([profileId, puzzleId])
      .first();
  },
};
