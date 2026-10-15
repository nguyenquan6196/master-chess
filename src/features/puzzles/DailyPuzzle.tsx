'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'use-intl';
import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import type { PuzzleSession } from '@/core/puzzle/session';
import type { Puzzle } from '@/core/puzzle/types';
import { puzzleRepo } from '@/services/db/repositories';
import { useSession } from '@/services/profile/session';
import { dailyPuzzle, recordPuzzleAttempt } from '@/services/puzzles/puzzles';
import { PuzzleRunner } from './PuzzleRunner';
import { PuzzleStatus } from './PuzzleStatus';

export function DailyPuzzle() {
  const t = useTranslations('puzzle');
  const tp = useTranslations('practice');
  const tn = useTranslations('nav');
  const format = useFormatter();
  const profileId = useSession((s) => s.profile?.id);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [done, setDone] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'empty'>('loading');
  const [today] = useState(() => new Date());
  const recorded = useRef(false);

  useEffect(() => {
    if (!profileId) return;
    void dailyPuzzle(today)
      .then(async ({ puzzle: p }) => {
        if (!p) return setState('empty');
        const attempt = await puzzleRepo.findAttempt(profileId, p.id);
        setDone(attempt?.mode === 'daily');
        setPuzzle(p);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [profileId, today]);

  async function record(session: PuzzleSession, ms: number) {
    const profile = useSession.getState().profile;
    if (recorded.current || done || !profile) return;
    recorded.current = true;
    await recordPuzzleAttempt(profile, session, 'daily', ms);
  }

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/practice" label={tn('practice')} />
      <h1 className="font-display text-3xl font-bold">{tp('daily')}</h1>
      <p className="text-muted">
        {t('dailyTitle', { date: format.dateTime(today, { dateStyle: 'long' }) })}
      </p>
      {done && <Card className="p-4 text-sm">✅ {t('dailyDone')}</Card>}
      {state !== 'ready' || !puzzle ? (
        <PuzzleStatus state={state} />
      ) : (
        <PuzzleRunner
          key={puzzle.id}
          puzzle={puzzle}
          onSolved={(s, ms) => void record(s, ms)}
          onMistake={(s, ms) => void record(s, ms)}
        />
      )}
    </div>
  );
}
