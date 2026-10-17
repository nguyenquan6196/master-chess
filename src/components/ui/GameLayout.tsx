'use client';

import { useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from 'react';
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

/** Same screens as the `wide:` and `short:` CSS variants (globals.css). */
const WIDE_QUERY = '(min-width: 64rem) and (orientation: landscape)';
const SHORT_QUERY = '(min-width: 36rem) and (max-width: 63.99rem) and (orientation: landscape)';
function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', l);
      return () => mq.removeEventListener('change', l);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True where GameLayout shows a side column next to the board (wide or sideways screens). */
export function useSideColumn(): boolean {
  const wide = useMedia(WIDE_QUERY);
  const short = useMedia(SHORT_QUERY);
  return wide || short;
}

/**
 * Game-style scene around a board (Phase 5.5, three columns since Phase 6).
 * - Wide landscape screens (`wide:`): actions in a narrow column on the left, the board in
 *   the middle as large as the screen allows (player cards `top`/`bottom` around it),
 *   `side` (moves, analysis) on the right. "Focus" gives the board the full screen
 *   height: the player cards move into the right column next to the moves.
 * - Phones turned sideways (`short:`): two columns — the board on the left as tall as the
 *   screen, the actions bar, player cards and moves on the right.
 * - Phones and portrait tablets: top, board (full width), bottom, side; `actions` become a
 *   dock fixed to the bottom of the screen, like a game's button bar.
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
  const wide = useMedia(WIDE_QUERY);
  const short = useMedia(SHORT_QUERY);
  // Focus on a wide screen, or a sideways phone: the player cards move to the right column.
  const cardsAside = (focus && wide) || short;

  const focusButton = (
    <ActionButton
      icon={focus ? '🔎' : '🔍'}
      label={focus ? labels.unfocus : labels.focus}
      title={focus ? labels.unfocus : labels.focus}
      aria-pressed={focus}
      onClick={() => writeFocus(!focus)}
      className="hidden wide:flex"
    />
  );

  return (
    <div
      className={cn(
        // Phones: the 3D canvas's side bleed is clipped here so the page never scrolls sideways.
        'grid gap-4 overflow-x-clip short:overflow-x-visible wide:items-start wide:justify-center wide:overflow-x-visible',
        actions && 'pb-24 short:pb-0 wide:pb-0',
        // Sideways phone: the whole scene is exactly as tall as the board, no page scroll.
        '[--mc-short-board:min(calc(100dvh-6rem),58vw)] short:h-(--mc-short-board) short:grid-cols-[auto_minmax(0,1fr)] short:grid-rows-[auto_minmax(0,1fr)] short:items-start short:gap-x-4 short:gap-y-2',
        focus
          ? cn(
              // Wider than the page column; the board takes the remaining screen height.
              'wide:w-[calc(100vw-3rem)] wide:max-w-[100rem] wide:self-center',
              // Below xl the action column shows icons only, so the board keeps its room.
              actions
                ? 'wide:grid-cols-[4.5rem_auto_17rem] [--mc-focus-board:min(1200px,calc(100dvh-6.5rem),calc(100vw-27rem))] wide:xl:grid-cols-[12rem_auto_22rem] wide:xl:[--mc-focus-board:min(1200px,calc(100dvh-6.5rem),calc(100vw-39rem))]'
                : 'wide:grid-cols-[auto_17rem] [--mc-focus-board:min(1200px,calc(100dvh-6.5rem),calc(100vw-21rem))] wide:xl:grid-cols-[auto_22rem] wide:xl:[--mc-focus-board:min(1200px,calc(100dvh-6.5rem),calc(100vw-26rem))]',
            )
          : actions
            ? 'wide:grid-cols-[12rem_auto_minmax(15rem,20rem)]'
            : 'wide:grid-cols-[auto_minmax(15rem,22rem)]',
      )}
    >
      {/* Board: limited by width, by the screen height and by the room the side columns leave. */}
      <div
        className={cn(
          'mx-auto flex w-full max-w-[min(640px,calc(100dvh-2rem))] flex-col gap-2 wide:row-start-1 wide:max-w-none',
          actions ? 'wide:col-start-2' : 'wide:col-start-1',
          'short:col-start-1 short:row-span-2 short:row-start-1 short:mx-0 short:w-(--mc-short-board) short:max-w-none',
          focus
            ? 'wide:w-(--mc-focus-board)'
            : actions
              ? 'wide:w-[min(640px,calc(100dvh-18rem),calc(100vw-37rem))]'
              : 'wide:w-[min(640px,calc(100dvh-18rem),calc(100vw-26rem))]',
        )}
      >
        {/* Cards sit above the 3D board, whose canvas spills past its box. */}
        {!cardsAside && top && <div className="relative z-10">{top}</div>}
        {board}
        {!cardsAside && bottom && <div className="relative z-10">{bottom}</div>}
      </div>
      {actions && (
        <div
          data-icons={focus || undefined}
          className={cn(
            'group/actions fixed inset-x-0 bottom-0 z-20 flex justify-around gap-1 border-t border-border bg-surface/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-card backdrop-blur',
            'short:relative short:z-10 short:col-start-2 short:row-start-1 short:rounded-2xl short:border short:p-1',
            'wide:relative wide:z-10 wide:col-start-1 wide:row-start-1 wide:flex-col wide:justify-start wide:gap-1 wide:rounded-2xl wide:border wide:p-2',
          )}
        >
          {actions}
          {focusButton}
        </div>
      )}
      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-[640px] min-w-0 flex-col gap-3 wide:row-start-1 wide:max-w-none',
          actions ? 'wide:col-start-3' : 'wide:col-start-2',
          actions
            ? 'short:col-start-2 short:row-start-2'
            : 'short:col-start-2 short:row-span-2 short:row-start-1',
          'short:mx-0 short:h-full short:max-w-none short:gap-2',
          focus
            ? 'wide:h-(--mc-focus-board)'
            : // Scrolls on its own; the padding (cancelled by the margin) leaves room for
              // the turn glow so the scroll box doesn't clip it.
              'mc-scroll-hidden wide:-m-3 wide:-mb-10 wide:max-h-[calc(100dvh-3.75rem)] wide:overflow-x-hidden wide:overflow-y-auto wide:p-3 wide:pb-10',
        )}
      >
        {!actions && <div className="hidden w-fit wide:flex">{focusButton}</div>}
        {/* Focus: the player cards sit in this column, around the scrolling moves. */}
        {cardsAside && top}
        <div
          className={cn(
            'flex flex-col gap-3',
            'mc-scroll-hidden short:-m-3 short:min-h-0 short:flex-1 short:gap-2 short:overflow-x-hidden short:overflow-y-auto short:p-3',
            focus &&
              'mc-scroll-hidden wide:-m-3 wide:min-h-0 wide:flex-1 wide:overflow-x-hidden wide:overflow-y-auto wide:p-3',
          )}
        >
          {side}
        </div>
        {cardsAside && bottom}
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
        // Sideways phone: one compact row of icon + label buttons.
        'short:flex-row short:justify-center short:gap-1.5 short:py-1 short:text-xs',
        // Desktop: a row in the left column (icon then label).
        'wide:flex-none wide:flex-row wide:gap-2.5 wide:px-3 wide:py-2.5 wide:text-sm',
        'wide:max-xl:group-data-[icons]/actions:justify-center',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-accent',
        primary ? 'bg-accent text-accent-fg hover:bg-accent-hover' : 'text-fg hover:bg-surface-2',
        className,
      )}
      title={label}
      {...props}
    >
      <span aria-hidden className="w-6 text-center text-xl leading-none">
        {icon}
      </span>
      {/* Narrow focus column: icons only (the label stays for screen readers). */}
      <span className="truncate wide:text-left wide:whitespace-normal wide:max-xl:group-data-[icons]/actions:sr-only">
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
