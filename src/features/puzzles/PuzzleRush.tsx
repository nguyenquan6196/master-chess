'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { formatClock } from '@/core/game/clock';
import {
  RUSH,
  rushCheckTime,
  rushRecord,
  rushRemainingMs,
  rushTargetRating,
  startRush,
  type RushDuration,
  type RushState,
} from '@/core/puzzle/rush';
import { isCleanSolve, type PuzzleSession } from '@/core/puzzle/session';
import type { Puzzle } from '@/core/puzzle/types';
import { useMusicScene } from '@/services/audio/musicDirector';
import { playSfx } from '@/services/audio/sfx';
import { useHistoryStep } from '@/services/navigation/historyStep';
import { useSession } from '@/services/profile/session';
import { nextPuzzleNear, recordPuzzleAttempt, saveRushScore } from '@/services/puzzles/puzzles';
import { PuzzleRunner } from './PuzzleRunner';
import { PuzzleStatus } from './PuzzleStatus';

const TICK_MS = 200;
/** Wall clock, read only from event handlers and timers (never during render). */
const wallClock = () => Date.now();
const NEXT_DELAY_MS = 500;
const RUSH_TENSE_MS = 30_000;

export function PuzzleRush() {
  const t = useTranslations('rush');
  const tp = useTranslations('practice');
  const tn = useTranslations('nav');
  const rushBest = useSession((s) => s.profile?.rushBest ?? {});
  const [run, setRun] = useState<RushState | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const [now, setNow] = useState(0);
  const [record, setRecord] = useState(false);
  const runRef = useRef<RushState | null>(null);
  const finished = useRef(false);
  useHistoryStep(run !== null, () => setRun(null));

  const loadNext = useCallback(async (state: RushState) => {
    setLoadState('loading');
    try {
      const p = await nextPuzzleNear(rushTargetRating(state), new Set(state.seen));
      setPuzzle(p);
      setLoadState(p ? 'ready' : 'empty');
    } catch {
      setLoadState('error');
    }
  }, []);

  const update = useCallback((next: RushState) => {
    runRef.current = next;
    setRun(next);
  }, []);

  function begin(duration: RushDuration) {
    const s = startRush(duration, wallClock());
    finished.current = false;
    setRecord(false);
    setNow(wallClock());
    update(s);
    playSfx('gameStart');
    void loadNext(s);
  }

  // Timer.
  const running = !!run && !run.over;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      const cur = runRef.current;
      if (cur) {
        const checked = rushCheckTime(cur, ts);
        if (checked !== cur) update(checked);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, update]);

  // End of run: save best score.
  useEffect(() => {
    if (!run?.over || finished.current) return;
    finished.current = true;
    playSfx('draw');
    const profile = useSession.getState().profile;
    if (profile) void saveRushScore(profile, run.duration, run.score).then(setRecord);
  }, [run]);

  // Music gets tense in the last seconds of a run.
  const tense = !!run && !run.over && rushRemainingMs(run, now || run.startedAt) < RUSH_TENSE_MS;
  useEffect(() => {
    useMusicScene.getState().setScene(tense ? { track: 'rush', intensity: 1 } : null);
  }, [tense]);
  useEffect(() => () => useMusicScene.getState().setScene(null), []);

  const onResult = useCallback(
    (session: PuzzleSession, solved: boolean, ms: number) => {
      const cur = runRef.current;
      if (!cur || cur.over || cur.seen.includes(session.puzzle.id)) return;
      const next = rushRecord(cur, session.puzzle.id, solved, Date.now());
      update(next);
      const profile = useSession.getState().profile;
      if (profile) void recordPuzzleAttempt(profile, session, 'rush', ms);
      if (!next.over) setTimeout(() => void loadNext(next), NEXT_DELAY_MS);
    },
    [loadNext, update],
  );

  if (!run) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton href="/practice" label={tn('practice')} />
        <h1 className="font-display text-3xl font-bold">⚡ {t('title')}</h1>
        <p className="text-muted">{t('intro')}</p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(RUSH.durations) as RushDuration[]).map((d) => (
            <Card key={d} className="flex min-w-48 flex-col items-start gap-2">
              <Button variant="primary" onClick={() => begin(d)}>
                {t('start', { minutes: RUSH.durations[d] / 60_000 })}
              </Button>
              <span className="text-sm text-muted">{tp('best', { score: rushBest[d] ?? 0 })}</span>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const remaining = rushRemainingMs(run, now || run.startedAt);
  const lives = RUSH.maxMistakes - run.mistakes;
  const header = (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <span className="font-display text-2xl font-bold tabular-nums">
        {t('score', { score: run.score })}
      </span>
      <span className="text-lg" aria-label={t('lives', { lives })}>
        {Array.from({ length: RUSH.maxMistakes }, (_, i) => (i < lives ? '❤️' : '🖤')).join(' ')}
      </span>
      <span
        className={cn(
          'rounded-lg px-3 py-1 font-display text-xl font-bold tabular-nums',
          remaining < 20_000 ? 'bg-danger text-surface' : 'bg-fg text-bg',
        )}
      >
        {formatClock(remaining)}
      </span>
    </Card>
  );

  if (run.over) {
    return (
      <Card className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-5xl" aria-hidden>
          ⚡
        </p>
        <h1 className="font-display text-2xl font-bold">{t('over')}</h1>
        <p className="font-display text-xl">{t('final', { score: run.score })}</p>
        {record && <p className="font-semibold text-accent">{t('newRecord')}</p>}
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => begin(run.duration)}>
            {t('again')}
          </Button>
          <Button onClick={() => setRun(null)}>←</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BackButton onClick={() => setRun(null)} label={t('quit')} />
      <h1 className="font-display text-3xl font-bold">⚡ {t('title')}</h1>
      {loadState !== 'ready' || !puzzle ? (
        <>
          {header}
          <PuzzleStatus state={loadState} onRetry={() => void loadNext(run)} />
        </>
      ) : (
        <PuzzleRunner
          key={puzzle.id}
          puzzle={puzzle}
          header={header}
          allowHelp={false}
          showMeta={false}
          onSolved={(s, ms) => onResult(s, isCleanSolve(s), ms)}
          onMistake={(s, ms) => onResult(s, false, ms)}
          actions={(solver) =>
            !solver.solved && (
              <Button
                variant="ghost"
                onClick={() =>
                  solver.session && onResult(solver.session, false, solver.elapsedMs())
                }
              >
                {t('skip')} →
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
