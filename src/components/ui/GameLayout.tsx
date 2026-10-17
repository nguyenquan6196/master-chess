'use client';

import { useState, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useBoardPrefs } from '../board/BoardPrefs';
import { cn } from './cn';

/** Remembered per browser: does the player like the big "focus" board? */
const FOCUS_KEY = 'mc-board-focus';
const focusListeners = new Set<() => void>();
function readFocus(): boolean {
  try {
    return localStorage.getItem(FOCUS_KEY) === '1';
  } catch {
    return false;
  }
}
function writeFocus(on: boolean) {
  try {
    localStorage.setItem(FOCUS_KEY, on ? '1' : '0');
  } catch {
    // Private mode: the choice just isn't remembered.
  }
  focusListeners.forEach((l) => l());
}
function subscribeFocus(l: () => void) {
  focusListeners.add(l);
  return () => focusListeners.delete(l);
}

/**
 * Game-style scene around a board (Phase 5.5, three columns since Phase 6).
 * - Desktop: actions in a narrow column on the left, the board in the middle as large
 *   as the screen allows (player cards `top`/`bottom` around it), `side` (moves,
 *   analysis) on the right. "Focus" makes the board as big as the screen: actions shrink
 *   to an icon bar under it and the side panel becomes a drawer.
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
  const labels = useBoardPrefs().layoutLabels;
  const focus = useSyncExternalStore(subscribeFocus, readFocus, () => false);
  const [drawer, setDrawer] = useState(false);

  const focusButton = (
    <ActionButton
      icon={focus ? '🗗' : '⛶'}
      label={focus ? labels.unfocus : labels.focus}
      title={focus ? labels.unfocus : labels.focus}
      aria-pressed={focus}
      onClick={() => {
        setDrawer(false);
        writeFocus(!focus);
      }}
      className="hidden lg:flex"
    />
  );
  const drawerButton = side ? (
    <ActionButton
      icon="📜"
      label={labels.side}
      title={labels.side}
      aria-expanded={drawer}
      onClick={() => setDrawer((v) => !v)}
      className="hidden lg:flex"
    />
  ) : null;

  return (
    <div
      className={cn(
        'grid gap-4 lg:items-start lg:justify-center',
        actions && 'pb-24 lg:pb-0',
        focus
          ? 'lg:grid-cols-[auto]'
          : actions
            ? 'lg:grid-cols-[12rem_auto_minmax(15rem,20rem)]'
            : 'lg:grid-cols-[auto_minmax(15rem,22rem)]',
      )}
    >
      {/* Board: limited by width, by the screen height and by the room the side columns leave. */}
      <div
        className={cn(
          'mx-auto flex w-full max-w-[640px] flex-col gap-2 lg:row-start-1',
          focus
            ? 'lg:col-start-1 lg:w-[min(1000px,calc(100dvh-15rem),calc(100vw-6rem))] lg:max-w-none'
            : actions
              ? 'lg:col-start-2 lg:w-[min(640px,calc(100dvh-18rem),calc(100vw-37rem))]'
              : 'lg:col-start-1 lg:w-[min(640px,calc(100dvh-18rem),calc(100vw-26rem))]',
        )}
      >
        {top}
        {board}
        {bottom}
      </div>
      {(actions || focus) && (
        <div
          data-compact={focus || undefined}
          className={cn(
            'group/actions',
            actions
              ? 'fixed inset-x-0 bottom-0 z-20 flex justify-around gap-1 border-t border-border bg-surface/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-card backdrop-blur'
              : 'hidden',
            'lg:static lg:flex lg:rounded-2xl lg:border lg:p-2',
            focus
              ? 'lg:col-start-1 lg:row-start-2 lg:mx-auto lg:flex-row lg:justify-center lg:gap-1'
              : 'lg:col-start-1 lg:row-start-1 lg:flex-col lg:justify-start lg:gap-1',
          )}
        >
          {actions}
          {focus && drawerButton}
          {focusButton}
        </div>
      )}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-3',
          focus
            ? drawer
              ? 'lg:fixed lg:top-20 lg:right-4 lg:bottom-6 lg:z-30 lg:w-80 lg:overflow-y-auto mc-pop'
              : 'lg:hidden'
            : cn(
                'lg:row-start-1 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto',
                actions ? 'lg:col-start-3' : 'lg:col-start-2',
              ),
        )}
      >
        {!actions && !focus && <div className="hidden w-fit lg:flex">{focusButton}</div>}
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
      {/* In the compact focus bar only the icon shows (the label stays for screen readers). */}
      <span className="truncate lg:text-left lg:whitespace-normal lg:group-data-[compact]/actions:sr-only">
        {label}
      </span>
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
