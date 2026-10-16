import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from './cn';

/** Big game-menu tile (lobby, mode pickers): icon, title, one line of description. */
export function MenuTile({
  href,
  icon,
  title,
  desc,
  primary,
  badge,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc?: string;
  primary?: boolean;
  badge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'mc-lift relative flex h-full items-center gap-4 rounded-3xl border p-4 text-left shadow-card sm:p-5',
        primary
          ? 'border-accent bg-[color-mix(in_srgb,var(--mc-accent)_14%,var(--mc-surface))] ring-1 ring-accent'
          : 'border-border bg-surface hover:border-accent',
      )}
    >
      <span
        aria-hidden
        className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface-2/60 text-4xl"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-xl font-bold">{title}</span>
        {desc && <span className="block text-sm text-muted">{desc}</span>}
      </span>
      {badge && <span className="absolute top-3 right-3">{badge}</span>}
    </Link>
  );
}
