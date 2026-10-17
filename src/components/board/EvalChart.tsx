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

  // Dots stay round (HTML on top of the stretched svg) and clear of the rounded edges.
  const DOT_INSET = 'clamp(6px, POS, calc(100% - 6px))';
  return (
    <div
      role="img"
      aria-label={label}
      className="relative h-28 w-full cursor-pointer overflow-hidden rounded-xl border border-border"
      style={{ background: 'var(--mc-chart-black)' }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSelect(Math.round(((e.clientX - r.left) / r.width) * n));
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden
        className="absolute inset-0 size-full"
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
      </svg>
      {[...marks].map(([i, cls]) => (
        <span
          key={i}
          aria-hidden
          className="absolute size-2.5 -translate-1/2 rounded-full border-[1.5px] border-surface"
          style={{
            left: DOT_INSET.replace('POS', `${(x(i) / W) * 100}%`),
            top: DOT_INSET.replace('POS', `${(y(whiteWin[i] ?? 50) / H) * 100}%`),
            background: `var(--mc-cls-${cls})`,
          }}
        />
      ))}
    </div>
  );
}
