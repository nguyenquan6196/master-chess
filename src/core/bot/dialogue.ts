import { z } from 'zod';
import type { Rng } from './choose';
import type { BotKey } from './levels';

/**
 * Bot speech bubbles (spec §6.5): short static lines per bot and game event.
 * Content: content/bots/dialogue.<locale>.json — `{ <bot>: { <event>: [lines] } }`
 * with a "default" entry used when a bot has no line for an event.
 */
export const DIALOGUE_EVENTS = [
  'start',
  'bossIntro',
  'botCapture',
  'playerCapture',
  'botCheck',
  'playerCheck',
  'botWin',
  'botLose',
  'draw',
  'bossDefeated',
] as const;
export type DialogueEvent = (typeof DIALOGUE_EVENTS)[number];

export const DialogueSchema = z.record(
  z.string(),
  z.partialRecord(z.enum(DIALOGUE_EVENTS), z.array(z.string().min(1)).min(1)),
);
export type Dialogue = z.infer<typeof DialogueSchema>;

export const DIALOGUE = {
  /** Chance that the bot comments on an ordinary capture/check (ends always speak). */
  chatterRate: 0.6,
  /** Bubble display time. */
  showMs: 4000,
} as const;

export interface MoveFacts {
  /** Who played the move. */
  byBot: boolean;
  capture: boolean;
  check: boolean;
}

/** The event a move triggers, if any (checks win over captures). */
export function moveEvent(m: MoveFacts): DialogueEvent | null {
  if (m.check) return m.byBot ? 'botCheck' : 'playerCheck';
  if (m.capture) return m.byBot ? 'botCapture' : 'playerCapture';
  return null;
}

/** The event for a finished game from the player's result. */
export function endEvent(result: 'win' | 'loss' | 'draw', bossMatch: boolean): DialogueEvent {
  if (result === 'draw') return 'draw';
  if (result === 'loss') return 'botWin';
  return bossMatch ? 'bossDefeated' : 'botLose';
}

/** A random line for `bot` and `event`, falling back to the default bot. */
export function pickLine(
  dialogue: Dialogue,
  bot: BotKey,
  event: DialogueEvent,
  rng: Rng = Math.random,
): string | null {
  const lines = dialogue[bot]?.[event] ?? dialogue.default?.[event];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(rng() * lines.length)];
}
