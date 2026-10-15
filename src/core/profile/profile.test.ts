import { describe, expect, it } from 'vitest';
import { createClock } from '../game/clock';
import { buildSaveFile, parseSaveFile, SAVE_SCHEMA_VERSION } from './saveFile';
import {
  DEFAULT_PROFILE_SETTINGS,
  DEFAULT_PUZZLE_RATING,
  type GameRecord,
  type Profile,
  type PuzzleAttempt,
} from './schema';
import { summarizeResults } from './stats';

const profile: Profile = {
  id: 'p1',
  name: 'Quân',
  avatar: '♟️',
  createdAt: 1,
  lastActiveAt: 2,
  settings: DEFAULT_PROFILE_SETTINGS,
  puzzleRating: DEFAULT_PUZZLE_RATING,
  rushBest: { '3m': 12 },
  quizBest: { all: 0.8 },
  lessons: { pawn: { completedAt: 3, score: 1 } },
  gameRating: { rating: 650, rd: 120, vol: 0.06 },
  rankFloor: 1,
};

const attempt: PuzzleAttempt = {
  id: 'a1',
  profileId: 'p1',
  puzzleId: 'abc',
  mode: 'rated',
  solved: true,
  puzzleRating: 900,
  ratingBefore: 800,
  ratingAfter: 850,
  timeMs: 12000,
  at: 5,
};

function game(id: string, extra: Partial<GameRecord> = {}): GameRecord {
  return {
    id,
    profileId: 'p1',
    mode: 'bot',
    botId: 'fox',
    style: 'balanced',
    playerColor: 'w',
    startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'e7e5'],
    clock: createClock('5+3'),
    status: 'finished',
    result: 'win',
    endReason: 'checkmate',
    hintsUsed: 0,
    undosUsed: 0,
    createdAt: 1,
    updatedAt: 2,
    ...extra,
  };
}

describe('core/profile/saveFile', () => {
  it('round-trips a save file', () => {
    const file = buildSaveFile(
      profile,
      [game('g1'), game('g2', { profileId: 'other' })],
      [attempt, { ...attempt, id: 'a2', profileId: 'other' }],
      99,
    );
    expect(file.games.map((g) => g.id)).toEqual(['g1']);
    expect(file.puzzleAttempts.map((a) => a.id)).toEqual(['a1']);
    const parsed = parseSaveFile(JSON.stringify(file));
    expect(parsed).toEqual({ ok: true, data: file });
  });

  it('rejects broken or foreign files', () => {
    expect(parseSaveFile('{nope')).toEqual({ ok: false, error: 'invalid-json' });
    expect(parseSaveFile('{"hello":1}')).toEqual({ ok: false, error: 'not-a-save-file' });
    const future = { ...buildSaveFile(profile, [], [], 1), schemaVersion: SAVE_SCHEMA_VERSION + 1 };
    expect(parseSaveFile(JSON.stringify(future))).toEqual({ ok: false, error: 'newer-version' });
    const bad = { ...buildSaveFile(profile, [], [], 1), profile: { ...profile, name: '' } };
    expect(parseSaveFile(JSON.stringify(bad))).toEqual({ ok: false, error: 'invalid-data' });
  });
});

describe('core/profile/saveFile migration', () => {
  it('upgrades a v1 file (no puzzle or lesson data) to the current version', () => {
    const v2Only = ['puzzleRating', 'rushBest', 'quizBest', 'lessons', 'gameRating', 'rankFloor'];
    const v1Profile = Object.fromEntries(
      Object.entries(profile).filter(([k]) => !v2Only.includes(k)),
    );
    const v1 = {
      app: 'master-chess',
      schemaVersion: 1,
      exportedAt: 1,
      profile: v1Profile,
      games: [{ ...game('g1'), style: undefined }],
    };
    const parsed = parseSaveFile(JSON.stringify(v1));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(parsed.data.profile.lessons).toEqual({});
    expect(parsed.data.profile.puzzleRating).toEqual(DEFAULT_PUZZLE_RATING);
    expect(parsed.data.profile.rushBest).toEqual({});
    expect(parsed.data.puzzleAttempts).toEqual([]);
    expect(parsed.data.games).toHaveLength(1);
    expect(parsed.data.profile.gameRating.rating).toBe(400);
    expect(parsed.data.profile.rankFloor).toBe(0);
    expect(parsed.data.games[0].style).toBe('balanced');
  });
});

describe('core/profile/stats', () => {
  it('counts results of finished games only', () => {
    const s = summarizeResults([
      game('a'),
      game('b', { result: 'loss' }),
      game('c', { result: 'draw' }),
      game('d', { status: 'ongoing', result: undefined }),
    ]);
    expect(s).toEqual({ played: 3, win: 1, loss: 1, draw: 1 });
  });
});
