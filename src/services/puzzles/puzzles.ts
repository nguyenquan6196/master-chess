import { recordProgress } from '../progress/progress';
import { updateRating } from '@/core/rating/glicko2';
import { dailyIndex, dayKey, pickPuzzle } from '@/core/puzzle/select';
import { isCleanSolve, type PuzzleSession } from '@/core/puzzle/session';
import {
  bucketOf,
  decodePuzzle,
  PUZZLE_BUCKET_SIZE,
  PUZZLE_MAX_RATING,
  PUZZLE_MIN_RATING,
  PuzzleFileSchema,
  type Puzzle,
  type TrainingTheme,
} from '@/core/puzzle/types';
import type { Profile, PuzzleMode } from '@/core/profile/schema';
import { profileRepo, puzzleRepo } from '../db/repositories';
import { useSession } from '../profile/session';

/** Puzzle files are static JSON under /public/puzzles (built by scripts/build-puzzles.mjs). */
const BASE = '/puzzles';
const cache = new Map<string, Promise<Puzzle[]>>();

function loadFile(path: string): Promise<Puzzle[]> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(`${BASE}/${path}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${path}`);
        return r.json();
      })
      .then((json) => PuzzleFileSchema.parse(json).map(decodePuzzle));
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p;
}

export const loadBucket = (min: number) => loadFile(`rating/${min}.json`);
export const loadTheme = (theme: TrainingTheme) => loadFile(`theme/${theme}.json`);
export const loadDailySet = () => loadFile('daily.json');

/** An unseen puzzle near `target`, looking at the target bucket and its neighbours. */
export async function nextPuzzleNear(
  target: number,
  seen: ReadonlySet<string>,
): Promise<Puzzle | null> {
  const b = bucketOf(target);
  const buckets = [b, b - PUZZLE_BUCKET_SIZE, b + PUZZLE_BUCKET_SIZE].filter(
    (x) => x >= PUZZLE_MIN_RATING && x < PUZZLE_MAX_RATING,
  );
  const files = await Promise.all(buckets.map((x) => loadBucket(x).catch(() => [] as Puzzle[])));
  return pickPuzzle(files.flat(), target, seen);
}

export async function nextThemePuzzle(
  theme: TrainingTheme,
  target: number,
  seen: ReadonlySet<string>,
): Promise<Puzzle | null> {
  return pickPuzzle(await loadTheme(theme), target, seen);
}

export async function dailyPuzzle(date: Date): Promise<{ day: string; puzzle: Puzzle | null }> {
  const set = await loadDailySet();
  const day = dayKey(date);
  return { day, puzzle: set[dailyIndex(day, set.length)] ?? null };
}

/**
 * Stores the attempt. In rated mode the player's puzzle rating is updated (Glicko-2):
 * a clean solve is a win against the puzzle, anything else a loss.
 */
export async function recordPuzzleAttempt(
  profile: Profile,
  session: PuzzleSession,
  mode: PuzzleMode,
  timeMs: number,
): Promise<{ ratingBefore: number; ratingAfter: number } | null> {
  const solved = isCleanSolve(session);
  const { puzzle } = session;
  let ratingChange: { ratingBefore: number; ratingAfter: number } | null = null;

  if (mode === 'rated') {
    const next = updateRating(profile.puzzleRating, [
      { opponent: { rating: puzzle.rating, rd: puzzle.rd }, score: solved ? 1 : 0 },
    ]);
    ratingChange = { ratingBefore: profile.puzzleRating.rating, ratingAfter: next.rating };
    await profileRepo.update(profile.id, { puzzleRating: next });
    useSession.getState().setProfile({ ...profile, puzzleRating: next });
  }

  await puzzleRepo.add({
    id: puzzleRepo.newId(),
    profileId: profile.id,
    puzzleId: puzzle.id,
    mode,
    solved,
    puzzleRating: puzzle.rating,
    ...(ratingChange ?? {}),
    timeMs,
    at: Date.now(),
  });
  // Rush runs are rewarded once at the end (by score), not per puzzle.
  if (mode !== 'rush') void recordProgress(profile.id, { kind: 'puzzle', solved, mode });
  return ratingChange;
}

/** Saves a new best Puzzle Rush score; returns true when it is a record. */
export async function saveRushScore(
  profile: Profile,
  duration: '3m' | '5m',
  score: number,
): Promise<boolean> {
  if (score <= (profile.rushBest[duration] ?? 0)) return false;
  const rushBest = { ...profile.rushBest, [duration]: score };
  await profileRepo.update(profile.id, { rushBest });
  useSession.getState().setProfile({ ...profile, rushBest });
  return true;
}

/** Saves a new best quiz ratio for `key` (topic or "all"). */
export async function saveQuizScore(
  profile: Profile,
  key: string,
  ratio: number,
): Promise<boolean> {
  if (ratio <= (profile.quizBest[key] ?? -1)) return false;
  const quizBest = { ...profile.quizBest, [key]: ratio };
  await profileRepo.update(profile.id, { quizBest });
  useSession.getState().setProfile({ ...profile, quizBest });
  return true;
}
