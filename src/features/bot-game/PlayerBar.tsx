'use client';

import { cn } from '@/components/ui/cn';
import type { Color } from '@/core/chess/game';
import { formatClock, isTimed, remainingAt, type ClockState } from '@/core/game/clock';

const LOW_TIME_MS = 20_000;

interface PlayerBarProps {
  avatar: string;
  name: string;
  subtitle?: string;
  color: Color;
  clock: ClockState;
  now: number;
  active: boolean;
  status?: string | null;
}

export function PlayerBar({
  avatar,
  name,
  subtitle,
  color,
  clock,
  now,
  active,
  status,
}: PlayerBarProps) {
  const timed = isTimed(clock);
  const ms = remainingAt(clock, color, now);
  const low = timed && ms < LOW_TIME_MS;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2 shadow-card">
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-xl border text-2xl',
          active ? 'border-accent bg-surface-2' : 'border-border bg-surface',
        )}
        aria-hidden
      >
        {avatar}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-semibold">
          <span
            aria-hidden
            className={cn(
              'inline-block size-3 shrink-0 rounded-full border border-border',
              color === 'w' ? 'bg-side-white' : 'bg-side-black',
            )}
          />
          <span className="truncate">{name}</span>
          {subtitle && <span className="text-xs font-normal text-muted">{subtitle}</span>}
        </p>
        {status && <p className="animate-pulse truncate text-xs text-muted">{status}</p>}
      </div>
      {timed && (
        <span
          className={cn(
            'rounded-lg px-3 py-1 font-display text-xl font-bold tabular-nums',
            active ? 'bg-fg text-bg' : 'bg-surface-2 text-muted',
            low && active && 'bg-danger text-surface',
          )}
          aria-live="off"
        >
          {formatClock(ms)}
        </span>
      )}
    </div>
  );
}
