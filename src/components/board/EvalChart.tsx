import type { MoveClass } from '@/core/review/review';

const W = 600;
const H = 120;

/**
 * White's winning chance over the game (area chart, White on top). Mistakes are dotted
 * in their class colour; clicking jumps to that position.
 */
export function EvalChart({
  whiteWin,
  current,
  marks,
  onSelect,
  label,
}: {
  /** 0–100 per position. */
  whiteWin: readonly number[];
  current: number;
  /** Position index (after the move) → class, for inaccuracies and worse. */
  marks: ReadonlyMap<number, MoveClass>;
  onSelect: (index: number) => void;
  label: string;
}) {
  const n = Math.max(whiteWin.length - 1, 1);
  const x = (i: number) => (i / n) * W;
  const y = (w: number) => H - (w / 100) * H;
  const line = whiteWin.map((w, i) => `${x(i)},${y(w)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="h-28 w-full cursor-pointer overflow-visible rounded-xl border border-border"
      style={{ background: 'var(--mc-chart-black)' }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSelect(Math.round(((e.clientX - r.left) / r.width) * n));
      }}
    >
      <polygon points={`0,${H} ${line} ${W},${H}`} style={{ fill: 'var(--mc-chart-white)' }} />
      <line
        x1={0}
        x2={W}
        y1={H / 2}
        y2={H / 2}
        stroke="var(--mc-muted)"
        strokeWidth={0.5}
        strokeDasharray="4 4"
      />
      <line
        x1={x(current)}
        x2={x(current)}
        y1={0}
        y2={H}
        stroke="var(--mc-accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {[...marks].map(([i, cls]) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(whiteWin[i] ?? 50)}
          r={4}
          vectorEffect="non-scaling-stroke"
          style={{ fill: `var(--mc-cls-${cls})`, stroke: 'var(--mc-surface)' }}
        />
      ))}
    </svg>
  );
}
