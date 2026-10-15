import { describe, expect, it } from 'vitest';
import en from '../../../content/bots/dialogue.en.json';
import ja from '../../../content/bots/dialogue.ja.json';
import vi from '../../../content/bots/dialogue.vi.json';
import { seededRng } from './choose';
import { DIALOGUE_EVENTS, DialogueSchema, endEvent, moveEvent, pickLine } from './dialogue';
import { BOT_IDS } from './levels';

describe('content/bots dialogue', () => {
  it.each(Object.entries({ vi, en, ja }))('%s has every event for every bot', (_, raw) => {
    const d = DialogueSchema.parse(raw);
    for (const bot of [...BOT_IDS, 'default']) {
      for (const e of DIALOGUE_EVENTS)
        expect(d[bot]?.[e]?.length, `${bot}.${e}`).toBeGreaterThan(0);
    }
  });
});

describe('core/bot/dialogue', () => {
  it('maps moves to events, checks first', () => {
    expect(moveEvent({ byBot: true, capture: true, check: true })).toBe('botCheck');
    expect(moveEvent({ byBot: false, capture: true, check: false })).toBe('playerCapture');
    expect(moveEvent({ byBot: false, capture: false, check: false })).toBeNull();
  });

  it('maps results to end events', () => {
    expect(endEvent('loss', false)).toBe('botWin');
    expect(endEvent('win', false)).toBe('botLose');
    expect(endEvent('win', true)).toBe('bossDefeated');
    expect(endEvent('draw', true)).toBe('draw');
  });

  it('falls back to the default lines (custom bot)', () => {
    const d = DialogueSchema.parse(vi);
    expect(pickLine(d, 'custom', 'start', seededRng(3))).toBeTruthy();
    expect(d.default.start).toContain(pickLine(d, 'custom', 'start', seededRng(3)));
  });
});
