import { resolveBotLevel } from '@/core/bot/levels';
import type { GameRecord } from '@/core/profile/schema';
import { applyRatedGame, isRatedGame } from '@/core/rating/rank';
import { getDb } from '../db/db';
import { recordProgress } from '../progress/progress';
import { useSession } from '../profile/session';

/**
 * Settles a finished bot game exactly once: marks it rated or not and, when rated,
 * updates the player's game rating and rank (promotion matches included).
 * Runs in one transaction so a double call (e.g. React strict mode) cannot count twice.
 */
export function settleBotGame(record: GameRecord): Promise<GameRecord> {
  if (record.status !== 'finished' || !record.result || record.rated !== undefined) {
    return Promise.resolve(record);
  }
  let pending = inFlight.get(record.id);
  if (!pending) {
    pending = settle(record).finally(() => inFlight.delete(record.id));
    inFlight.set(record.id, pending);
  }
  return pending;
}

const inFlight = new Map<string, Promise<GameRecord>>();

async function settle(record: GameRecord): Promise<GameRecord> {
  const db = getDb();
  /** `fresh`: this call settled the game (not an earlier one). */
  const { game: settled, fresh } = await db.transaction('rw', db.profiles, db.games, async () => {
    const stored = await db.games.get(record.id);
    if (stored?.rated !== undefined) return { game: stored, fresh: false };
    const profile = await db.profiles.get(record.profileId);
    if (!profile || !record.result) return { game: record, fresh: false };

    if (!isRatedGame(record)) {
      const unrated: GameRecord = { ...record, rated: false };
      await db.games.put(unrated);
      return { game: unrated, fresh: true };
    }
    const level = resolveBotLevel(record.botId, record.customElo);
    const out = applyRatedGame(profile.gameRating, profile.rankFloor, {
      botId: record.botId === 'custom' ? null : record.botId,
      botElo: level.elo,
      result: record.result,
    });
    const rated: GameRecord = {
      ...record,
      rated: true,
      ratingDelta: out.delta,
      ratingAfter: Math.round(out.rating.rating),
      ...(out.promotion ? { promotion: out.promotion } : {}),
    };
    await db.games.put(rated);
    await db.profiles.update(profile.id, { gameRating: out.rating, rankFloor: out.rankFloor });
    return { game: rated, fresh: true };
  });

  // XP once per game: only when this call actually settled it.
  if (fresh && settled.result) {
    const tier = resolveBotLevel(settled.botId, settled.customElo).tier;
    void recordProgress(settled.profileId, { kind: 'game', result: settled.result, tier });
  }

  const active = useSession.getState().profile;
  if (active?.id === record.profileId) {
    const fresh = await db.profiles.get(active.id);
    if (fresh) useSession.getState().setProfile(fresh);
  }
  return settled;
}
