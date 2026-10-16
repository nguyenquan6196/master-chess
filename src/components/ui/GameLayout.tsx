import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/**
 * Game-style scene around a board (Phase 5.5).
 * - Desktop: the board takes as much height as the screen allows, with `top`/`bottom`
 *   (player cards) above and below it; `side` is a panel on the right and `actions`
 *   a grid of big icon buttons inside it.
 * - Phone: top, board (full width), bottom, side; `actions` become a dock fixed to the
 *   bottom of the screen, like a game's button bar.
 */
export function GameLayout({
  top,
  board,
  bottom,
  side,
  actions,
}: {
  top?: ReactNode;
  board: ReactNode;
  bottom?: ReactNode;
  side?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-4 lg:grid-cols-[auto_minmax(16rem,1fr)] lg:items-start',
        actions && 'pb-24 lg:pb-0',
      )}
    >
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-2 lg:w-[min(640px,calc(100dvh-18rem))]">
        {top}
        {board}
        {bottom}
      </div>
      <div className="flex min-w-0 flex-col gap-3 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
        {actions && (
          <div
            className={cn(
              'fixed inset-x-0 bottom-0 z-20 flex justify-around gap-1 border-t border-border bg-surface/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-card backdrop-blur',
              'lg:static lg:grid lg:grid-cols-4 lg:gap-2 lg:rounded-2xl lg:border lg:p-2',
            )}
          >
            {actions}
          </div>
        )}
        {side}
      </div>
    </div>
  );
}

/** Icon + label button for the GameLayout action bar. */
export function ActionButton({
  icon,
  label,
  primary,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'mc-press flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition-colors lg:py-2.5 lg:text-xs',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-accent',
        primary ? 'bg-accent text-accent-fg hover:bg-accent-hover' : 'text-fg hover:bg-surface-2',
        className,
      )}
      {...props}
    >
      <span aria-hidden className="text-xl leading-none lg:text-2xl">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Rounded card wrapper used for player cards and side widgets in game scenes. */
export function HudCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface px-3 shadow-card', className)}>
      {children}
    </div>
  );
}
