'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { thinkDelayMs } from '@/core/bot/choose';
import { botAcceptsDraw, getBotLevel } from '@/core/bot/levels';
import { uciToMove, type MoveInput } from '@/core/chess/game';
import { moveSound } from '@/core/chess/moveSound';
import { scoreToCp, type EngineScore } from '@/core/engine/uci';
import {
  botColorOf,
  checkTimeout,
  finishGame,
  pauseGame,
  playMove,
  replayGame,
  resignGame,
  resumeGame,
  undoPlayerMove,
} from '@/core/game/botGame';
import { isTimed } from '@/core/game/clock';
import type { GameRecord } from '@/core/profile/schema';
import { playSfx } from '@/services/audio/sfx';
import { gameRepo } from '@/services/db/repositories';
import { computeBotMove, evaluatePosition } from '@/services/engine/bot';
import { getEngine } from '@/services/engine/StockfishEngine';
import { useSettings } from '@/services/settings/store';

const CLOCK_TICK_MS = 200;
const EVAL_BAR_DEPTH = 10;
const NOTICE_MS = 2500;

export type Notice = 'drawDeclined' | null;

/**
 * Drives a game against a bot: player moves, bot replies (engine in a worker), clock,
 * autosave to IndexedDB, sounds, hints, eval bar, undo, resign and draw offers.
 */
export function useBotGame(initial: GameRecord) {
  const [record, setRecord] = useState(() => resumeGame(initial, Date.now()));
  const snapshot = useMemo(() => replayGame(record), [record]);
  const level = getBotLevel(record.botId);
  const botColor = botColorOf(record);
  const ongoing = record.status === 'ongoing' && snapshot.status.kind === 'playing';
  const isBotTurn =
    ongoing && snapshot.status.kind === 'playing' && snapshot.status.turn === botColor;
  const isPlayerTurn = ongoing && !isBotTurn;

  const [engineError, setEngineError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<Notice>(null);
  const [hint, setHint] = useState<{ fen: string; from: string; to: string } | null>(null);
  const [evaluation, setEvaluation] = useState<{ fen: string; score: EngineScore | null } | null>(
    null,
  );
  const showEvalBar = useSettings((s) => s.showEvalBar);

  // --- Persistence: save every change; pause the clock when leaving the screen.
  const latest = useRef(record);
  useEffect(() => {
    latest.current = record;
    void gameRepo.save(record);
  }, [record]);
  useEffect(() => () => void gameRepo.save(pauseGame(latest.current, Date.now())), []);

  // --- Bot replies.
  useEffect(() => {
    if (!isBotTurn) return;
    let cancelled = false;
    const started = Date.now();
    const delay = thinkDelayMs(level.thinkTimeMs);
    computeBotMove(snapshot.fen, level)
      .then(async (uci) => {
        const wait = delay - (Date.now() - started);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        if (cancelled || !uci) return;
        setRecord((prev) => playMove(prev, uciToMove(uci), Date.now()) ?? prev);
      })
      .catch(() => {
        if (!cancelled) setEngineError(true);
      });
    return () => {
      cancelled = true;
      getEngine('bot').stop();
    };
  }, [isBotTurn, snapshot.fen, level]);

  // --- Sounds for new moves and the end of the game.
  const soundState = useRef({ moves: record.moves.length, status: record.status });
  useEffect(() => {
    const prev = soundState.current;
    const last = snapshot.history[snapshot.history.length - 1];
    if (record.status === 'finished' && prev.status === 'ongoing') {
      playSfx(record.result ?? 'draw');
    } else if (record.moves.length > prev.moves && last) {
      playSfx(moveSound(last, snapshot.status));
    }
    soundState.current = { moves: record.moves.length, status: record.status };
  }, [record.moves.length, record.status, record.result, snapshot]);

  // --- Clock.
  const timed = isTimed(record.clock) && record.status === 'ongoing';
  useEffect(() => {
    if (!timed) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setRecord((prev) => checkTimeout(prev, t));
    }, CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [timed]);

  // --- Eval bar (separate analysis engine).
  useEffect(() => {
    if (!showEvalBar) return;
    let cancelled = false;
    const fen = snapshot.fen;
    evaluatePosition(fen, EVAL_BAR_DEPTH)
      .then((r) => {
        if (!cancelled) setEvaluation({ fen, score: r.score });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [showEvalBar, snapshot.fen]);

  // --- Transient notices.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice]);

  // --- Actions.
  const onPlayerMove = useCallback(
    (input: MoveInput): boolean => {
      if (!isPlayerTurn) return false;
      const next = playMove(record, input, Date.now());
      if (!next) {
        playSfx('illegal');
        return false;
      }
      setRecord(next);
      return true;
    },
    [isPlayerTurn, record],
  );

  const undo = useCallback(() => {
    setRecord((prev) => undoPlayerMove(prev, Date.now()) ?? prev);
  }, []);

  const resign = useCallback(() => setRecord((prev) => resignGame(prev, Date.now())), []);

  const requestHint = useCallback(async () => {
    if (!isPlayerTurn) return;
    const fen = snapshot.fen;
    const r = await evaluatePosition(fen);
    if (!r.bestMove) return;
    const m = uciToMove(r.bestMove);
    setHint({ fen, from: m.from, to: m.to });
    setRecord((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  }, [isPlayerTurn, snapshot.fen]);

  const offerDraw = useCallback(async () => {
    if (!ongoing) return;
    const fen = snapshot.fen;
    const { score } = await evaluatePosition(fen);
    const whiteCp = score ? scoreToCp(score) : 0;
    const botCp = botColor === 'w' ? whiteCp : -whiteCp;
    if (botAcceptsDraw(botCp, record.moves.length)) {
      setRecord((prev) => finishGame(prev, 'draw', 'agreement', Date.now()));
    } else {
      playSfx('notify');
      setNotice('drawDeclined');
    }
  }, [ongoing, snapshot.fen, botColor, record.moves.length]);

  const canUndo = record.status === 'ongoing' && undoPlayerMove(record, now) !== null;

  return {
    record,
    snapshot,
    level,
    botColor,
    isBotTurn,
    isPlayerTurn,
    engineError,
    now,
    notice,
    hint: hint && hint.fen === snapshot.fen ? hint : null,
    evaluation: showEvalBar ? (evaluation?.score ?? null) : null,
    showEvalBar,
    canUndo,
    onPlayerMove,
    undo,
    resign,
    requestHint,
    offerDraw,
  };
}
