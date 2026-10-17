'use client';

import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { RankId } from '@/core/rating/rank';
import { Button } from './Button';
import { Confetti } from './Confetti';
import { RankEmblem } from './RankEmblem';

const SHARDS = 18;

/**
 * Promotion celebration (spec §6.7): the old emblem bursts into shards of light, the
 * new one flies in, spins and settles; confetti on top. Animations: globals.css
 * (`.mc-rankup-*`), skipped under reduced motion.
 */
export function RankUpOverlay({
  from,
  to,
  title,
  subtitle,
  closeLabel,
  onClose,
}: {
  from: RankId;
  to: RankId;
  title: string;
  subtitle?: ReactNode;
  closeLabel: string;
  onClose: () => void;
}) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
        <Confetti trigger={1} />
        <div className="relative grid size-48 place-items-center">
          <div className="mc-rankup-old absolute">
            <RankEmblem rank={from} size={150} animated={false} />
          </div>
          {Array.from({ length: SHARDS }, (_, i) => {
            const a = (i / SHARDS) * Math.PI * 2;
            const style = {
              '--dx': `${Math.cos(a) * 140}px`,
              '--dy': `${Math.sin(a) * 140}px`,
            } as CSSProperties;
            return (
              <span
                key={i}
                className="mc-rankup-shard absolute size-2 rounded-full bg-accent"
                style={style}
              />
            );
          })}
          <div className="mc-rankup-new absolute">
            <RankEmblem rank={to} size={170} className="mc-emblem-spin" />
          </div>
        </div>
        <h2 className="mc-rankup-text font-display text-3xl font-bold text-accent">{title}</h2>
        {subtitle && <p className="mc-rankup-text text-muted">{subtitle}</p>}
        <Button variant="primary" className="mc-rankup-text px-8" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

/** Before a promotion match: the boss steps forward with the rank it guards. */
export function BossIntroOverlay({
  bossEmoji,
  rank,
  title,
  bossName,
  line,
  startLabel,
  onStart,
}: {
  bossEmoji: string;
  rank: RankId;
  title: string;
  bossName: string;
  line: string | null;
  startLabel: string;
  onStart: () => void;
}) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="mc-boss-card flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border-2 border-accent bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-bold tracking-widest text-accent uppercase">⚔️ {title}</p>
        <div className="flex items-end gap-2">
          <span className="mc-boss-emoji text-7xl" aria-hidden>
            {bossEmoji}
          </span>
          <RankEmblem rank={rank} size={90} />
        </div>
        <p className="font-display text-2xl font-bold">{bossName}</p>
        {line && <p className="text-muted italic">“{line}”</p>}
        <Button variant="primary" className="mt-2 px-8 py-3 text-base" onClick={onStart}>
          {startLabel}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
