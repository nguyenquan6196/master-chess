import Link from 'next/link';
import { cn } from './cn';

const CLASS =
  'inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent';

/** "← Label": a link up to a parent page (`href`) or one step back inside a screen (`onClick`). */
export function BackButton({
  label,
  href,
  onClick,
  className,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <span aria-hidden>←</span>
      {label}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn(CLASS, className)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(CLASS, className)}>
      {content}
    </button>
  );
}
