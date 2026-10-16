import { allLessons } from '@/core/learn/catalog';
import {
  ACHIEVEMENTS,
  levelFor,
  MINIATURE_MAX_PLIES,
  newAchievements,
  touchStreak,
  xpFor,
  type ProgressStats,
  type XpEvent,
} from '@/core/progress/progress';
import { getDb } from '../db/db';
import { CATALOG } from '../learn/learn';
import { useSession } from '../profile/session';
import { useToasts } from './toasts';

async function gatherStats(
  profileId: string,
  level: number,
  streakBest: number,
): Promise<ProgressStats> {
  const db = getDb();
  const profile = await db.profiles.get(profileId);
  const games = await db.games.where('profileId').equals(profileId).toArray();
  const attempts = await db.puzzleAttempts.where('profileId').equals(profileId).toArray();
  const finished = games.filter((g) => g.status === 'finished');
  const wins = finished.filter((g) => g.result === 'win');
  return {
    level,
    streakBest,
    lessonsDone: Object.keys(profile?.lessons ?? {}).length,
    // Read lazily: learn.ts imports this module too.
    lessonsTotal: allLessons(CATALOG).length,
    perfectQuiz: Object.values(profile?.quizBest ?? {}).some((v) => v >= 1),
    perfectQuizCount: Object.values(profile?.quizBest ?? {}).filter((v) => v >= 1).length,
    quizPlayed: Object.keys(profile?.quizBest ?? {}).length,
    genQuizPlayed: Object.keys(profile?.quizBest ?? {}).filter((k) => k.startsWith('gen:')).length,
    puzzlesSolved: attempts.filter((a) => a.solved).length,
    dailySolved: attempts.filter((a) => a.solved && a.mode === 'daily').length,
    rushBest: Math.max(0, ...Object.values(profile?.rushBest ?? {})),
    puzzleRating: profile?.puzzleRating.rating ?? 0,
    themeSolved: attempts.filter((a) => a.solved && a.mode === 'theme').length,
    gameRating: profile?.gameRating.rating ?? 0,
    gamesPlayed: finished.length,
    wins: wins.length,
    draws: finished.filter((g) => g.result === 'draw').length,
    winsAsBlack: wins.filter((g) => g.playerColor === 'b').length,
    cleanWins: wins.filter((g) => g.hintsUsed === 0 && g.undosUsed === 0).length,
    miniatureWins: wins.filter((g) => g.moves.length <= MINIATURE_MAX_PLIES).length,
    checkmateWins: wins.filter((g) => g.endReason === 'checkmate').length,
    promotionsPassed: finished.filter((g) => g.promotion?.passed).length,
    stylesBeaten: [...new Set(wins.map((g) => g.style))],
    botsBeaten: [...new Set(wins.filter((g) => g.botId !== 'custom').map((g) => g.botId))],
    customWin: wins.some((g) => g.botId === 'custom'),
    rankFloor: profile?.rankFloor ?? 0,
    reviews: games.filter((g) => g.review).length,
  };
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Records progress for the player: adds XP for `event` (if any), counts today for the
 * streak, unlocks achievements, and shows toasts. Calls are serialized so concurrent
 * events cannot overwrite each other.
 */
export function recordProgress(profileId: string, event: XpEvent | null): Promise<void> {
  const run = async () => {
    const db = getDb();
    const profile = await db.profiles.get(profileId);
    if (!profile) return;
    const gained = event ? xpFor(event) : 0;
    const xp = profile.xp + gained;
    const streak = touchStreak(profile.streak, Date.now());
    const before = levelFor(profile.xp).level;
    const level = levelFor(xp).level;
    const stats = await gatherStats(profileId, level, streak.best);
    const unlocked = newAchievements(stats, profile.achievements);
    const now = Date.now();
    const achievements = {
      ...profile.achievements,
      ...Object.fromEntries(unlocked.map((id) => [id, now])),
    };
    await db.profiles.update(profileId, { xp, streak, achievements });

    const active = useSession.getState().profile;
    if (active?.id === profileId) {
      const fresh = await db.profiles.get(profileId);
      if (fresh) useSession.getState().setProfile(fresh);
    }
    const toasts = useToasts.getState();
    if (gained > 0) toasts.push({ kind: 'xp', amount: gained });
    if (level > before) toasts.push({ kind: 'level', level });
    for (const id of unlocked) {
      toasts.push({
        kind: 'achievement',
        id,
        icon: ACHIEVEMENTS.find((a) => a.id === id)?.icon ?? '🏅',
      });
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}
