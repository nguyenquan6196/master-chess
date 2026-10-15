'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DIALOGUE,
  endEvent,
  moveEvent,
  pickLine,
  type Dialogue,
  type DialogueEvent,
} from '@/core/bot/dialogue';
import type { GameSnapshot } from '@/core/chess/game';
import type { GameRecord } from '@/core/profile/schema';
import { loadDialogue } from '@/services/bots/dialogue';
import { useSettings } from '@/services/settings/store';

/**
 * The bot's speech bubble: a line at the start, on some captures/checks and at the end.
 * `bossMatch`: the game is a promotion match (the bot introduces itself as the boss).
 */
export function useBotChat(
  record: GameRecord,
  snapshot: GameSnapshot,
  botColor: 'w' | 'b',
  bossMatch: boolean,
): string | null {
  const locale = useSettings((s) => s.locale);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [line, setLine] = useState<{ text: string; at: number } | null>(null);
  const seen = useRef<{ moves: number; ended: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDialogue(locale).then((d) => !cancelled && setDialogue(d));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const settled = record.status === 'finished' && record.rated !== undefined;
  const last = snapshot.history[snapshot.history.length - 1];

  useEffect(() => {
    if (!dialogue) return;
    const say = (event: DialogueEvent) => {
      const text = pickLine(dialogue, record.botId, event);
      if (text) setLine({ text, at: Date.now() });
    };
    const prev = seen.current;
    seen.current = { moves: record.moves.length, ended: settled };
    if (!prev) {
      // Opening line only for a fresh game, not when resuming a saved one.
      if (record.moves.length <= 1 && record.status === 'ongoing')
        say(bossMatch ? 'bossIntro' : 'start');
      return;
    }
    if (settled && !prev.ended && record.result) {
      say(endEvent(record.result, record.promotion?.passed === true));
      return;
    }
    if (record.moves.length > prev.moves && last && record.status === 'ongoing') {
      const event = moveEvent({
        byBot: last.color === botColor,
        capture: Boolean(last.captured),
        check: last.san.includes('+'),
      });
      if (event && Math.random() < DIALOGUE.chatterRate) say(event);
    }
  }, [
    dialogue,
    record.moves.length,
    record.status,
    record.result,
    record.promotion,
    record.botId,
    settled,
    last,
    botColor,
    bossMatch,
  ]);

  // Hide the bubble after a while (kept at the end of the game).
  useEffect(() => {
    if (!line || record.status === 'finished') return;
    const id = setTimeout(() => setLine(null), DIALOGUE.showMs);
    return () => clearTimeout(id);
  }, [line, record.status]);

  return line?.text ?? null;
}
