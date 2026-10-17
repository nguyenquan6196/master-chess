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
 * Engine evaluation gauge, drawn across: the player's side (board orientation) fills from
 * the left, and the score sits at the leading side's end.
 */
export function EvalBar({ score, orientation, label, size = 'strip', caption }: EvalBarProps) {
  const white = whiteShare(score);
  const whiteLeft = orientation === 'white';
  const whiteLeads = white >= 0.5;
  const atLeft = whiteLeads === whiteLeft;
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
        'relative flex w-full shrink-0 overflow-hidden border border-border',
        panel ? 'h-7 rounded-full shadow-card' : 'h-4 rounded-md',
        whiteLeft ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className="transition-[flex-grow] duration-700 ease-out"
        style={{ flexGrow: 1 - white, backgroundColor: 'var(--mc-side-black)' }}
      />
      <div
        className="transition-[flex-grow] duration-700 ease-out"
        style={{ flexGrow: white, backgroundColor: 'var(--mc-side-white)' }}
      />
      {panel && (
        <>
          {/* Even-game mark and a soft gloss over the tube. */}
          <span
            aria-hidden
            className="absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-accent opacity-60"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-0.5 h-2 rounded-full opacity-40"
            style={{
              background: 'linear-gradient(to bottom, var(--mc-side-white), transparent)',
            }}
          />
        </>
      )}
      <span
        aria-hidden
        className={cn(
          'absolute top-1/2 -translate-y-1/2 font-bold tabular-nums',
          panel ? 'rounded-full px-2 py-0.5 text-xs shadow-card' : 'text-[10px]',
          atLeft ? (panel ? 'left-1' : 'left-1.5') : panel ? 'right-1' : 'right-1.5',
        )}
        style={
          panel
            ? {
                color: whiteLeads ? 'var(--mc-side-black)' : 'var(--mc-side-white)',
                backgroundColor: whiteLeads ? 'var(--mc-side-white)' : 'var(--mc-side-black)',
              }
            : { color: whiteLeads ? 'var(--mc-side-black)' : 'var(--mc-side-white)' }
        }
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
