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
  /** `strip`: thin bar above the board (phones); `panel`: large gauge in a side column. */
  size?: 'strip' | 'panel';
  /** Plain-words verdict shown under the panel gauge. */
  caption?: string;
}

/**
 * Engine evaluation gauge, drawn across in theme colours: the player's side (the board's
 * orientation) fills from the left in the accent colour, the opponent's share is the
 * neutral surface, and the score sits at the leading side's end.
 */
export function EvalBar({ score, orientation, label, size = 'strip', caption }: EvalBarProps) {
  const white = whiteShare(score);
  const mine = orientation === 'white' ? white : 1 - white;
  const iLead = mine >= 0.5;
  const text = formatScore(score);
  const panel = size === 'panel';
  const meter = (
    <div
      role="meter"
      aria-label={label}
      aria-valuetext={caption ? `${text} · ${caption}` : text}
      aria-valuenow={Math.round(white * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'relative flex w-full shrink-0 overflow-hidden border border-border bg-surface-2',
        panel ? 'h-7 rounded-full' : 'h-4 rounded-md',
      )}
    >
      <div
        className="bg-accent transition-[flex-grow] duration-700 ease-out"
        style={{ flexGrow: mine }}
      />
      <div
        className="transition-[flex-grow] duration-700 ease-out"
        style={{ flexGrow: 1 - mine }}
      />
      {/* Even-game mark. */}
      {panel && (
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-fg opacity-25"
        />
      )}
      <span
        aria-hidden
        className={cn(
          'absolute top-1/2 -translate-y-1/2 font-bold tabular-nums',
          // Panel: the score on its own small plate, readable over either colour.
          panel
            ? 'rounded-full border border-border bg-surface px-2 py-px text-xs text-fg shadow-card'
            : iLead
              ? 'text-[10px] text-accent-fg'
              : 'text-[10px] text-fg',
          iLead ? 'left-1' : 'right-1',
        )}
      >
        {text}
      </span>
    </div>
  );
  if (!panel) return meter;
  return (
    <div className="flex flex-col gap-1.5">
      {meter}
      {caption && <p className="px-1 text-xs font-semibold text-muted">{caption}</p>}
    </div>
  );
}
