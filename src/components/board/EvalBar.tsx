import { scoreToCp, type EngineScore } from '@/core/engine/uci';
import { cn } from '../ui/cn';

/** Centipawns at which the bar is ~90% filled. */
const EVAL_SCALE_CP = 400;

/** White's share of the bar in [0, 1] for a White-POV score (logistic, like lichess). */
export function whiteShare(score: EngineScore | null): number {
  if (!score) return 0.5;
  if (score.kind === 'mate') return score.value > 0 || score.value === 0 ? 1 : 0;
  const cp = scoreToCp(score);
  return 1 / (1 + Math.exp((-cp / EVAL_SCALE_CP) * Math.log(9)));
}

export function formatScore(score: EngineScore | null): string {
  if (!score) return '…';
  if (score.kind === 'mate') return `M${Math.abs(score.value)}`;
  const pawns = score.value / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

interface EvalBarProps {
  /** Score from White's point of view (null while unknown). */
  score: EngineScore | null;
  orientation: 'white' | 'black';
  label: string;
}

/**
 * Engine evaluation gauge. On phones it is a thin bar above the board; on wide and
 * sideways screens (`wide:` / `short:`) it stands upright in the gap to the right of the
 * board (the parent is `relative`), so it never takes width from the board.
 */
export function EvalBar({ score, orientation, label }: EvalBarProps) {
  const white = whiteShare(score);
  const whiteOnBottom = orientation === 'white';
  // The score sits at the leading side's end: bottom/left is the player's side.
  const atPlayerEnd = white >= 0.5 === whiteOnBottom;
  const textColor = white >= 0.5 ? 'var(--mc-side-black)' : 'var(--mc-side-white)';
  const text = formatScore(score);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuetext={text}
      aria-valuenow={Math.round(white * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'relative flex h-4 w-full shrink-0 overflow-hidden rounded-md border border-border',
        'short:absolute short:inset-y-0 short:left-full short:ml-0.5 short:h-auto short:w-3',
        'wide:absolute wide:inset-y-0 wide:left-full wide:ml-0.5 wide:h-auto wide:w-3',
        whiteOnBottom
          ? 'flex-row-reverse short:flex-col wide:flex-col'
          : 'flex-row short:flex-col-reverse wide:flex-col-reverse',
      )}
    >
      <div
        className="transition-all duration-500"
        style={{ flexGrow: 1 - white, backgroundColor: 'var(--mc-side-black)' }}
      />
      <div
        className="transition-all duration-500"
        style={{ flexGrow: white, backgroundColor: 'var(--mc-side-white)' }}
      />
      {/* Bar: score along it. Upright gauge: written top to bottom so "+0.5" fits. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 flex items-center text-[10px] font-bold tabular-nums short:hidden wide:hidden',
          atPlayerEnd ? 'left-1.5' : 'right-1.5',
        )}
        style={{ color: textColor }}
      >
        {text}
      </span>
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 hidden justify-center text-[9px] leading-none font-bold tabular-nums [inline-size:max-content] [writing-mode:vertical-rl] short:flex wide:flex',
          atPlayerEnd ? 'bottom-1' : 'top-1',
        )}
        style={{ color: textColor }}
      >
        {text}
      </span>
    </div>
  );
}
