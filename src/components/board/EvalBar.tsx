import { scoreToCp, type EngineScore } from '@/core/engine/uci';

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

export function EvalBar({ score, orientation, label }: EvalBarProps) {
  const white = whiteShare(score);
  const whiteOnBottom = orientation === 'white';
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuetext={formatScore(score)}
      aria-valuenow={Math.round(white * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative flex w-5 shrink-0 flex-col overflow-hidden rounded-md border border-border sm:w-6"
      style={{ flexDirection: whiteOnBottom ? 'column' : 'column-reverse' }}
    >
      <div
        className="transition-all duration-500"
        style={{ flexGrow: 1 - white, backgroundColor: 'var(--mc-side-black)' }}
      />
      <div
        className="transition-all duration-500"
        style={{ flexGrow: white, backgroundColor: 'var(--mc-side-white)' }}
      />
      <span
        className="absolute inset-x-0 text-center text-[9px] font-bold tabular-nums sm:text-[10px]"
        style={{
          [white >= 0.5 === whiteOnBottom ? 'bottom' : 'top']: 4,
          color: white >= 0.5 ? 'var(--mc-side-black)' : 'var(--mc-side-white)',
        }}
      >
        {formatScore(score)}
      </span>
    </div>
  );
}
