import { useId } from 'react';
import { cn } from './cn';

/**
 * Small inline SVG flags (emoji flags don't render on Windows). Flag colors are fixed
 * artwork, not theme colors.
 */
export type FlagCode = 'vi' | 'en' | 'ja';

function Vietnam() {
  return (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" className="size-full">
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        fill="#FFFF00"
        points="15,4 16.43,8.04 20.71,8.15 17.31,10.75 18.53,14.85 15,12.43 11.47,14.85 12.69,10.75 9.29,8.15 13.57,8.04"
      />
    </svg>
  );
}

function UnitedKingdom() {
  const clip = useId();
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="size-full">
      <clipPath id={clip}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath={`url(#${clip})`}
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function Japan() {
  return (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" className="size-full">
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  );
}

const FLAGS: Record<FlagCode, () => React.JSX.Element> = {
  vi: Vietnam,
  en: UnitedKingdom,
  ja: Japan,
};

export function Flag({ code, className }: { code: FlagCode; className?: string }) {
  const F = FLAGS[code];
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-[14px] w-5 shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.15)]',
        className,
      )}
    >
      <F />
    </span>
  );
}
