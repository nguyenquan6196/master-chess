import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';

const STYLES = {
  tip: { icon: '💡', className: 'border-accent' },
  warning: { icon: '⚠️', className: 'border-danger' },
  rule: { icon: '📜', className: 'border-border bg-surface-2' },
  fun: { icon: '🎉', className: 'border-border' },
} as const;

/** `<Callout type="tip">…</Callout>` — tip, warning, rule or fun fact. */
export function Callout({
  type = 'tip',
  children,
}: {
  type?: keyof typeof STYLES;
  children: ReactNode;
}) {
  const s = STYLES[type] ?? STYLES.tip;
  return (
    <aside
      className={cn('not-prose my-5 flex gap-3 rounded-xl border-l-4 bg-surface p-4', s.className)}
    >
      <span aria-hidden className="text-xl">
        {s.icon}
      </span>
      <div className="min-w-0 flex-1 text-[0.95rem] leading-relaxed [&>p]:m-0 [&>p+p]:mt-2">
        {children}
      </div>
    </aside>
  );
}
