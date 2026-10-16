'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import type { PuzzleSession } from '@/core/puzzle/session';
import {
  isTrainingTheme,
  TRAINING_THEMES,
  type Puzzle,
  type TrainingTheme,
} from '@/core/puzzle/types';
import { puzzleRepo } from '@/services/db/repositories';
import { useHistoryStep } from '@/services/navigation/historyStep';
import { useLocationHash } from '@/services/navigation/locationHash';
import { useSession } from '@/services/profile/session';
import { nextThemePuzzle, recordPuzzleAttempt } from '@/services/puzzles/puzzles';
import { PuzzleRunner } from './PuzzleRunner';
import { PuzzleStatus } from './PuzzleStatus';

export function ThemeTraining() {
  const t = useTranslations('puzzle');
  const tp = useTranslations('practice');
  const tt = useTranslations('puzzleThemes');
  const tn = useTranslations('nav');
  // A lesson can link straight to a theme: /practice/themes#fork
  const hash = useLocationHash();
  const hashTheme = isTrainingTheme(hash) ? hash : null;
  /** undefined = nothing picked on this screen yet: follow the URL hash. */
  const [picked, setPicked] = useState<TrainingTheme | null | undefined>(undefined);
  const theme = picked === undefined ? hashTheme : picked;
  const setTheme = setPicked;
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const seen = useRef<Set<string> | null>(null);
  useHistoryStep(theme !== null, () => setTheme(null));
  const recorded = useRef(false);

  const fetchPuzzle = useCallback(async (th: TrainingTheme): Promise<Puzzle | null> => {
    const profile = useSession.getState().profile;
    if (!profile) return null;
    seen.current ??= await puzzleRepo.seenIds(profile.id);
    return nextThemePuzzle(th, profile.puzzleRating.rating, seen.current);
  }, []);

  const show = useCallback((p: Puzzle | null) => {
    recorded.current = false;
    setPuzzle(p);
    setState(p ? 'ready' : 'empty');
  }, []);

  const loadNext = useCallback(
    (th: TrainingTheme) => {
      setState('loading');
      fetchPuzzle(th).then(show, () => setState('error'));
    },
    [fetchPuzzle, show],
  );

  // Theme chosen from the URL hash.
  const followsHash = picked === undefined;
  useEffect(() => {
    if (followsHash && hashTheme) fetchPuzzle(hashTheme).then(show, () => setState('error'));
  }, [followsHash, hashTheme, fetchPuzzle, show]);

  const record = useCallback(async (session: PuzzleSession, ms: number) => {
    const profile = useSession.getState().profile;
    if (recorded.current || !profile) return;
    recorded.current = true;
    seen.current?.add(session.puzzle.id);
    await recordPuzzleAttempt(profile, session, 'theme', ms);
  }, []);

  if (!theme) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <BackButton href="/practice" label={tn('practice')} />
          <h1 className="font-display text-2xl font-bold">{tp('themes')}</h1>
        </div>
        <h2 className="text-sm font-semibold text-muted">{t('chooseTheme')}</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TRAINING_THEMES.map((th) => (
            <li key={th}>
              <button
                type="button"
                onClick={() => {
                  setTheme(th);
                  loadNext(th);
                }}
                className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-left text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:border-accent"
              >
                {tt(th)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <BackButton onClick={() => setTheme(null)} label={t('chooseTheme')} />
        <h1 className="font-display text-2xl font-bold">{tt(theme)}</h1>
      </div>
      {state !== 'ready' || !puzzle ? (
        <PuzzleStatus state={state} onRetry={() => loadNext(theme)} />
      ) : (
        <PuzzleRunner
          key={puzzle.id}
          puzzle={puzzle}
          onSolved={(s, ms) => void record(s, ms)}
          onMistake={(s, ms) => void record(s, ms)}
          actions={(solver) =>
            solver.solved && (
              <Button variant="primary" onClick={() => loadNext(theme)}>
                {t('next')} →
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
