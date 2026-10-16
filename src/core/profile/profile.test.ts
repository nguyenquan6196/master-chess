import { describe, expect, it } from 'vitest';
import { createClock } from '../game/clock';
import { buildSaveFile, parseSaveFile, SAVE_SCHEMA_VERSION } from './saveFile';
import {
  DEFAULT_PROFILE_SETTINGS,
  migratePieceSetV7,
  migratePieceSetV8,
  DEFAULT_PUZZLE_RATING,
  type GameRecord,
  type Profile,
  type PuzzleAttempt,
} from './schema';
import { PIECE_SETS, resolvePieceSet, THEME_IDS, THEME_PIECE_SET } from './settingsOptions';
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
  xp: 120,
  streak: { lastDay: '2026-10-15', current: 2, best: 4 },
  achievements: { firstWin: 5 },
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
    const v2Only = [
      'puzzleRating',
      'rushBest',
      'quizBest',
      'lessons',
      'gameRating',
      'rankFloor',
      'xp',
      'streak',
      'achievements',
    ];
    const v1Profile = Object.fromEntries(
      Object.entries(profile).filter(([k]) => !v2Only.includes(k)),
    );
    const v1Settings = {
      locale: 'vi',
      theme: 'auto',
      sfxEnabled: true,
      sfxVolume: 0.7,
      showEvalBar: false,
    };
    const v1 = {
      app: 'master-chess',
      schemaVersion: 1,
      exportedAt: 1,
      profile: { ...v1Profile, settings: v1Settings },
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
    expect(parsed.data.profile.settings.pieceSet).toBe('theme');
    expect(parsed.data.profile.settings.musicMode).toBe('auto');
    expect(parsed.data.profile.xp).toBe(0);
    expect(parsed.data.profile.achievements).toEqual({});
  });
});

describe('core/profile piece sets (v7)', () => {
  it('moves the old default "classic" to "theme" and keeps explicit choices', () => {
    const old = { ...profile, settings: { ...profile.settings, pieceSet: 'classic' as const } };
    expect(migratePieceSetV7(old).settings.pieceSet).toBe('theme');
    const chosen = { ...profile, settings: { ...profile.settings, pieceSet: 'wood' as const } };
    expect(migratePieceSetV7(chosen).settings.pieceSet).toBe('wood');
    expect(migratePieceSetV7({ id: 'x' })).toEqual({ id: 'x' });
  });

  it('moves removed sets (minimal, glyph) to "theme" in v8', () => {
    const glyph = { ...profile, settings: { ...profile.settings, pieceSet: 'glyph' } };
    expect(migratePieceSetV8(glyph).settings.pieceSet).toBe('theme');
    const wood = { ...profile, settings: { ...profile.settings, pieceSet: 'wood' as const } };
    expect(migratePieceSetV8(wood).settings.pieceSet).toBe('wood');
    const v7 = { ...buildSaveFile(profile, [], [], 1), schemaVersion: 7, profile: glyph };
    const parsed = parseSaveFile(JSON.stringify(v7));
    expect(parsed.ok && parsed.data.profile.settings.pieceSet).toBe('theme');
  });

  it('upgrades a v6 save file', () => {
    const v6 = {
      ...buildSaveFile(profile, [], [], 1),
      schemaVersion: 6,
      profile: { ...profile, settings: { ...profile.settings, pieceSet: 'classic' } },
    };
    const parsed = parseSaveFile(JSON.stringify(v6));
    expect(parsed.ok && parsed.data.profile.settings.pieceSet).toBe('theme');
  });

  it('resolves "theme" to the own set of the theme, and every theme has one', () => {
    expect(resolvePieceSet('theme', 'wood')).toBe('wood');
    expect(resolvePieceSet('theme', 'arcade')).toBe('pixel');
    expect(resolvePieceSet('sakura', 'wood')).toBe('sakura');
    for (const theme of THEME_IDS) {
      expect(PIECE_SETS).toContain(THEME_PIECE_SET[theme]);
    }
    // Each theme brings a different set.
    expect(new Set(Object.values(THEME_PIECE_SET)).size).toBe(THEME_IDS.length);
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
