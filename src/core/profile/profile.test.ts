import { describe, expect, it } from 'vitest';
import { createClock } from '../game/clock';
import { buildSaveFile, parseSaveFile, SAVE_SCHEMA_VERSION } from './saveFile';
import { DEFAULT_PROFILE_SETTINGS, type GameRecord, type Profile } from './schema';
import { summarizeResults } from './stats';

const profile: Profile = {
  id: 'p1',
  name: 'Quân',
  avatar: '♟️',
  createdAt: 1,
  lastActiveAt: 2,
  settings: DEFAULT_PROFILE_SETTINGS,
};

function game(id: string, extra: Partial<GameRecord> = {}): GameRecord {
  return {
    id,
    profileId: 'p1',
    mode: 'bot',
    botId: 'fox',
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
    const file = buildSaveFile(profile, [game('g1'), game('g2', { profileId: 'other' })], 99);
    expect(file.games.map((g) => g.id)).toEqual(['g1']);
    const parsed = parseSaveFile(JSON.stringify(file));
    expect(parsed).toEqual({ ok: true, data: file });
  });

  it('rejects broken or foreign files', () => {
    expect(parseSaveFile('{nope')).toEqual({ ok: false, error: 'invalid-json' });
    expect(parseSaveFile('{"hello":1}')).toEqual({ ok: false, error: 'not-a-save-file' });
    const future = { ...buildSaveFile(profile, [], 1), schemaVersion: SAVE_SCHEMA_VERSION + 1 };
    expect(parseSaveFile(JSON.stringify(future))).toEqual({ ok: false, error: 'newer-version' });
    const bad = { ...buildSaveFile(profile, [], 1), profile: { ...profile, name: '' } };
    expect(parseSaveFile(JSON.stringify(bad))).toEqual({ ok: false, error: 'invalid-data' });
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
