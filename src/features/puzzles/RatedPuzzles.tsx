'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import type { PuzzleSession } from '@/core/puzzle/session';
import type { Puzzle } from '@/core/puzzle/types';
import { puzzleRepo } from '@/services/db/repositories';
import { useSession } from '@/services/profile/session';
import { nextPuzzleNear, recordPuzzleAttempt } from '@/services/puzzles/puzzles';
import { PuzzleRunner } from './PuzzleRunner';
import { PuzzleStatus } from './PuzzleStatus';

export function RatedPuzzles() {
  const t = useTranslations('puzzle');
  const tp = useTranslations('practice');
  const rating = useSession((s) => s.profile?.puzzleRating.rating ?? 0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const [delta, setDelta] = useState<number | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const recorded = useRef(false);

  /** Finds an unseen puzzle near the player's current rating. */
  const fetchPuzzle = useCallback(async (): Promise<Puzzle | null> => {
    const profile = useSession.getState().profile;
    if (!profile) return null;
    seen.current ??= await puzzleRepo.seenIds(profile.id);
    return nextPuzzleNear(profile.puzzleRating.rating, seen.current);
  }, []);

  const show = useCallback((p: Puzzle | null) => {
    recorded.current = false;
    setDelta(null);
    setPuzzle(p);
    setState(p ? 'ready' : 'empty');
  }, []);

  const loadNext = useCallback(() => {
    setState('loading');
    fetchPuzzle().then(show, () => setState('error'));
  }, [fetchPuzzle, show]);

  useEffect(() => {
    fetchPuzzle().then(show, () => setState('error'));
  }, [fetchPuzzle, show]);

  /** The first mistake (or the solve) decides the rating result, like on Lichess. */
  const record = useCallback(async (session: PuzzleSession, elapsedMs: number) => {
    const profile = useSession.getState().profile;
    if (recorded.current || !profile) return;
    recorded.current = true;
    seen.current?.add(session.puzzle.id);
    const change = await recordPuzzleAttempt(profile, session, 'rated', elapsedMs);
    if (change) setDelta(Math.round(change.ratingAfter - change.ratingBefore));
  }, []);

  const header = (
    <Card className="flex items-center justify-between p-4">
      <span className="text-sm text-muted">{tp('yourRating')}</span>
      <span className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums">{Math.round(rating)}</span>
        {delta !== null && (
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              delta >= 0 ? 'text-accent' : 'text-danger',
            )}
          >
            {delta >= 0 ? `+${delta}` : delta}
          </span>
        )}
      </span>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">{tp('rated')}</h1>
      {state !== 'ready' || !puzzle ? (
        <PuzzleStatus state={state} onRetry={loadNext} />
      ) : (
        <PuzzleRunner
          key={puzzle.id}
          puzzle={puzzle}
          header={header}
          onSolved={(s, ms) => void record(s, ms)}
          onMistake={(s, ms) => void record(s, ms)}
          actions={(solver) =>
            solver.solved && (
              <Button variant="primary" onClick={loadNext}>
                {t('next')} →
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
