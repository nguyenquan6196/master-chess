'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { applyMove, newGame, uciToMove, type GameSnapshot } from '@/core/chess/game';

/** Italian Game opening, replayed in a loop on the welcome screen. */
const DEMO_MOVES = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'c2c3', 'g8f6', 'd2d4', 'e5d4'];
const DEMO_STEP_MS = 1400;
/** Extra pause on the final position before the loop restarts. */
const DEMO_HOLD_STEPS = 3;

function demoFrames(): GameSnapshot[] {
  const frames = [newGame()];
  for (const uci of DEMO_MOVES) {
    const next = applyMove(frames[frames.length - 1], uciToMove(uci));
    if (!next) break;
    frames.push(next);
  }
  return frames;
}

const FEATURES = [
  { icon: '📚', title: 'learn', desc: 'learnDesc' },
  { icon: '🧩', title: 'practice', desc: 'practiceDesc' },
  { icon: '🤖', title: 'play', desc: 'playDesc' },
] as const;

/** Left side of the "who's playing?" screen: what the app is, with a live demo board. */
export function WelcomeHero() {
  const t = useTranslations('home');
  const tn = useTranslations('nav');
  const ta = useTranslations('app');
  const tg = useTranslations('game');
  const frames = useMemo(() => demoFrames(), []);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(
      () => setStep((s) => (s + 1) % (frames.length + DEMO_HOLD_STEPS)),
      DEMO_STEP_MS,
    );
    return () => clearInterval(id);
  }, [frames.length]);

  const frame = frames[Math.min(step, frames.length - 1)];
  const last = frame.history.at(-1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent text-3xl text-accent-fg shadow-card">
          ♞
        </span>
        <span className="font-display text-2xl font-bold">{ta('name')}</span>
      </div>
      <p className="max-w-md text-lg text-muted">{t('subtitle')}</p>

      <div className="mx-auto w-full max-w-72 -rotate-2 rounded-2xl bg-surface p-2 shadow-card transition-transform hover:rotate-0 sm:mx-0 sm:max-w-sm">
        <ChessBoard
          fen={frame.fen}
          movableColor="none"
          lastMove={last ? { from: last.from, to: last.to } : null}
          promotionLabels={{
            title: tg('choosePromotion'),
            cancel: tg('cancel'),
            pieces: { q: tg('pieces.q'), r: tg('pieces.r'), b: tg('pieces.b'), n: tg('pieces.n') },
          }}
        />
      </div>

      <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {FEATURES.map((f) => (
          <li
            key={f.title}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface/70 p-3"
          >
            <span className="text-2xl" aria-hidden>
              {f.icon}
            </span>
            <span>
              <span className="block font-semibold">{tn(f.title)}</span>
              <span className="block text-xs text-muted">{t(f.desc)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
