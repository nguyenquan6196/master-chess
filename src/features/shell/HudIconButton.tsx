import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

/** Round icon button of the game HUD (labelled for screen readers and tooltips). */
export function HudIconButton({
  label,
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'mc-press grid size-10 place-items-center rounded-full border text-lg shadow-card',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-border bg-surface hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}
