'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import type { PuzzleSession } from '@/core/puzzle/session';
import { TRAINING_THEMES, type Puzzle, type TrainingTheme } from '@/core/puzzle/types';
import { puzzleRepo } from '@/services/db/repositories';
import { useSession } from '@/services/profile/session';
import { nextThemePuzzle, recordPuzzleAttempt } from '@/services/puzzles/puzzles';
import { PuzzleRunner } from './PuzzleRunner';
import { PuzzleStatus } from './PuzzleStatus';

export function ThemeTraining() {
  const t = useTranslations('puzzle');
  const tp = useTranslations('practice');
  const tt = useTranslations('puzzleThemes');
  const [theme, setTheme] = useState<TrainingTheme | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const seen = useRef<Set<string> | null>(null);
  const recorded = useRef(false);

  const loadNext = useCallback(async (th: TrainingTheme) => {
    const profile = useSession.getState().profile;
    if (!profile) return;
    setState('loading');
    try {
      seen.current ??= await puzzleRepo.seenIds(profile.id);
      const p = await nextThemePuzzle(th, profile.puzzleRating.rating, seen.current);
      recorded.current = false;
      setPuzzle(p);
      setState(p ? 'ready' : 'empty');
    } catch {
      setState('error');
    }
  }, []);

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
        <h1 className="font-display text-3xl font-bold">{tp('themes')}</h1>
        <h2 className="text-sm font-semibold text-muted">{t('chooseTheme')}</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TRAINING_THEMES.map((th) => (
            <li key={th}>
              <button
                type="button"
                onClick={() => {
                  setTheme(th);
                  void loadNext(th);
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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">{tt(theme)}</h1>
        <Button variant="ghost" onClick={() => setTheme(null)}>
          ← {t('chooseTheme')}
        </Button>
      </div>
      {state !== 'ready' || !puzzle ? (
        <PuzzleStatus state={state} onRetry={() => void loadNext(theme)} />
      ) : (
        <PuzzleRunner
          key={puzzle.id}
          puzzle={puzzle}
          onSolved={(s, ms) => void record(s, ms)}
          onMistake={(s, ms) => void record(s, ms)}
          actions={(solver) =>
            solver.solved && (
              <Button variant="primary" onClick={() => void loadNext(theme)}>
                {t('next')} →
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
