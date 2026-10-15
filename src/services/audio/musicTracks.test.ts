import { describe, expect, it } from 'vitest';
import { MUSIC_TRACKS } from '@/core/profile/settingsOptions';
import { TRACKS, trackForPath } from './musicTracks';

describe('services/audio/musicTracks', () => {
  it.each(MUSIC_TRACKS)('%s is a valid recipe', (id) => {
    const r = TRACKS[id];
    for (const p of [r.bass, r.kick, r.snare, r.hat]) if (p) expect(p).toMatch(/^[x.]{16}$/);
    if (r.arp) expect(r.arp).toHaveLength(16);
    expect(r.scale).toHaveLength(7);
    for (const d of r.progression) expect(d).toBeGreaterThanOrEqual(0);
    expect(r.bpm).toBeGreaterThan(40);
  });

  it('picks a track from the page', () => {
    expect(trackForPath('/')).toBe('menu');
    expect(trackForPath('/learn/pawn')).toBe('learn');
    expect(trackForPath('/practice/rush')).toBe('rush');
    expect(trackForPath('/practice/quiz')).toBe('practice');
    expect(trackForPath('/play/bot')).toBe('bot1');
  });
});
