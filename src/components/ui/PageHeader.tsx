'use client';

import Link from 'next/link';
import {
  createContext,
  use,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

type SlotState = [HTMLElement | null, Dispatch<SetStateAction<HTMLElement | null>>];
const HudSlotContext = createContext<SlotState | null>(null);

/** Lets pages place their header in the shell's HUD row (see `HudSlot`, `PageHeader`). */
export function HudSlotProvider({ children }: { children: ReactNode }) {
  const state = useState<HTMLElement | null>(null);
  return <HudSlotContext value={state}>{children}</HudSlotContext>;
}

/** Where `PageHeader` renders: the HUD row of the shell. Hidden while empty. */
export function HudSlot({ className }: { className?: string }) {
  const ctx = use(HudSlotContext);
  return <div ref={ctx?.[1]} className={cn('empty:hidden', className)} />;
}

const ROUND =
  'mc-press grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-lg shadow-card hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export interface PageBack {
  /** Accessible name / tooltip, e.g. the parent screen ("Practice") or the step ("Topics"). */
  label: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Screen title shown in the HUD next to the home button: an optional round ← button
 * (up to a parent page or one step back inside the screen), a small eyebrow line
 * (usually the parent's name) and the title itself. Without a HUD slot (no shell) it
 * renders in place.
 */
export function PageHeader({
  title,
  eyebrow,
  back,
  aside,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  back?: PageBack;
  /** Small trailing content (counter, badge) shown after the title. */
  aside?: ReactNode;
}) {
  const ctx = use(HudSlotContext);
  const content = (
    <>
      {back &&
        (back.href ? (
          <Link href={back.href} aria-label={back.label} title={back.label} className={ROUND}>
            <span aria-hidden className="text-base">
              ⬅️
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={back.onClick}
            aria-label={back.label}
            title={back.label}
            className={ROUND}
          >
            <span aria-hidden className="text-base">
              ⬅️
            </span>
          </button>
        ))}
      <div className="min-w-0 leading-tight">
        {eyebrow && <p className="truncate text-xs font-semibold text-muted">{eyebrow}</p>}
        <h1 className="flex min-w-0 items-center gap-2 font-display text-xl font-bold">
          <span className="truncate">{title}</span>
          {aside}
        </h1>
      </div>
    </>
  );
  if (!ctx) return <div className="flex min-w-0 items-center gap-2">{content}</div>;
  return ctx[0] ? createPortal(content, ctx[0]) : null;
}
