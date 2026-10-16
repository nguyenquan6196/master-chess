import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/**
 * Game-style scene around a board (Phase 5.5, three columns since Phase 6).
 * - Desktop: actions in a narrow column on the left, the board in the middle as large
 *   as the screen allows (player cards `top`/`bottom` around it), `side` (moves,
 *   analysis) on the right.
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
        'grid gap-4 lg:items-start lg:justify-center',
        actions
          ? 'pb-24 lg:grid-cols-[12rem_auto_minmax(15rem,20rem)] lg:pb-0'
          : 'lg:grid-cols-[auto_minmax(15rem,22rem)]',
      )}
    >
      {/* Board: limited by width, by the screen height and by the room the side columns leave. */}
      <div
        className={cn(
          'mx-auto flex w-full max-w-[640px] flex-col gap-2 lg:row-start-1',
          actions
            ? 'lg:col-start-2 lg:w-[min(640px,calc(100dvh-18rem),calc(100vw-37rem))]'
            : 'lg:col-start-1 lg:w-[min(640px,calc(100dvh-18rem),calc(100vw-26rem))]',
        )}
      >
        {top}
        {board}
        {bottom}
      </div>
      {actions && (
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-20 flex justify-around gap-1 border-t border-border bg-surface/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-card backdrop-blur',
            'lg:static lg:col-start-1 lg:row-start-1 lg:flex-col lg:justify-start lg:gap-1 lg:rounded-2xl lg:border lg:p-2',
          )}
        >
          {actions}
        </div>
      )}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-3 lg:row-start-1 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto',
          actions ? 'lg:col-start-3' : 'lg:col-start-2',
        )}
      >
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
        'mc-press flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold',
        // Desktop: a row in the left column (icon then label).
        'lg:flex-none lg:flex-row lg:gap-2.5 lg:px-3 lg:py-2.5 lg:text-sm',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-accent',
        primary ? 'bg-accent text-accent-fg hover:bg-accent-hover' : 'text-fg hover:bg-surface-2',
        className,
      )}
      {...props}
    >
      <span aria-hidden className="text-xl leading-none">
        {icon}
      </span>
      <span className="truncate lg:text-left lg:whitespace-normal">{label}</span>
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
