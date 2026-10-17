'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '@/components/ui/cn';
import type { GameStatus } from '@/core/chess/game';

/**
 * Whose move it is, with a breathing glow: the accent colour on the turn of the player
 * sitting at the bottom (`mine`), the other side's piece colour on the opponent's turn.
 */
export function GameStatusBanner({ status, mine }: { status: GameStatus; mine: 'w' | 'b' }) {
  const t = useTranslations('game');
  const colorName = (c: 'w' | 'b') => (c === 'w' ? t('white') : t('black'));

  let text: string;
  let detail: string | null = null;
  let tone: 'normal' | 'alert' | 'end' = 'normal';

  switch (status.kind) {
    case 'playing':
      text = t('toMove', { color: colorName(status.turn) });
      if (status.inCheck) {
        detail = t('check');
        tone = 'alert';
      }
      break;
    case 'checkmate':
      text = t('checkmate', { color: colorName(status.winner) });
      tone = 'end';
      break;
    case 'draw':
      text = t('draw');
      detail = t(`drawReason.${status.reason}`);
      tone = 'end';
      break;
  }

  const turnGlow =
    status.kind !== 'playing'
      ? undefined
      : status.turn === mine
        ? 'var(--mc-accent)'
        : // Toned towards the muted text colour so a white side still shows on light themes.
          `color-mix(in srgb, var(--mc-side-${status.turn === 'w' ? 'white' : 'black'}) 60%, var(--mc-muted))`;

  return (
    <div
      style={turnGlow ? ({ '--mc-turn-color': turnGlow } as CSSProperties) : undefined}
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-2xl border px-4 py-3',
        turnGlow && 'mc-turn',
        tone === 'normal' && 'border-border bg-surface',
        tone === 'alert' && 'border-danger bg-surface',
        tone === 'end' && 'border-accent bg-accent text-accent-fg',
      )}
    >
      <p className="flex items-center gap-2 font-display text-lg font-semibold">
        {status.kind === 'playing' && (
          <span
            aria-hidden
            className={cn(
              'inline-block size-4 rounded-full border border-border',
              status.turn === 'w' ? 'bg-side-white' : 'bg-side-black',
            )}
          />
        )}
        {text}
      </p>
      {detail && (
        <p className={cn('text-sm', tone === 'alert' ? 'font-semibold text-danger' : 'opacity-90')}>
          {detail}
        </p>
      )}
    </div>
  );
}
