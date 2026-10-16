import type { JSX, ReactNode } from 'react';
import type { PieceKind } from '../pieceShapes';

/**
 * Building blocks for the self-drawn piece sets (Phase 5.6). Every set draws in the
 * same box (viewBox -24 -29 48 48, ground line at y = 18) but with its own shapes.
 */

/** Inner SVG content of one piece. */
export type Art = (kind: PieceKind, white: boolean) => JSX.Element;
export type Pt = readonly [number, number];

/**
 * A turned (lathe) silhouette: the right-half profile from the bottom centre up to the
 * top centre, mirrored into a closed symmetric path.
 */
export function lathe(right: readonly Pt[]): string {
  const left = [...right].reverse().map(([x, y]) => [-x, y] as const);
  return `M${[...right, ...left].map(([x, y]) => `${x},${y}`).join(' L')} Z`;
}

/** Closed polygon path. */
export function poly(points: readonly Pt[]): string {
  return `M${points.map(([x, y]) => `${x},${y}`).join(' L')} Z`;
}

export interface Material {
  /** Body gradient, top → bottom. */
  top: string;
  bottom: string;
  rim: string;
  rimWidth?: number;
  bodyOpacity?: number;
}

/**
 * A filled piece: gradient body, `inside` decorations clipped to the silhouette (grain,
 * veins, gloss, facets), a rim, then `over` details drawn on top (eyes, slits…).
 */
export function solid(
  id: string,
  shape: ReactNode,
  m: Material,
  inside?: ReactNode,
  over?: ReactNode,
  under?: ReactNode,
): JSX.Element {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={m.top} />
          <stop offset="1" stopColor={m.bottom} />
        </linearGradient>
        <clipPath id={`${id}-c`}>{shape}</clipPath>
      </defs>
      {under}
      <g fill={`url(#${id}-g)`} fillOpacity={m.bodyOpacity ?? 1}>
        {shape}
      </g>
      {inside && <g clipPath={`url(#${id}-c)`}>{inside}</g>}
      <g
        fill="none"
        stroke={m.rim}
        strokeWidth={m.rimWidth ?? 1.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {shape}
      </g>
      {over}
    </>
  );
}

/** Horizontal lines across the piece (lathe grooves), clipped by the caller. */
export function rings(ys: readonly number[], color: string, width = 0.9): ReactNode {
  return (
    <g stroke={color} strokeWidth={width}>
      {ys.map((y) => (
        <line key={y} x1="-16" y1={y} x2="16" y2={y} />
      ))}
    </g>
  );
}

/** Darkens the right half: a cheap facet / side-light effect. */
export function shade(opacity: number, color = '#000'): ReactNode {
  return <rect x="0" y="-30" width="20" height="50" fill={color} opacity={opacity} />;
}

/** One element of a silhouette, as data (drawn flat here, extruded by the 3D board). */
export type ShapeEl =
  | { d: string }
  | { circle: readonly [cx: number, cy: number, r: number] }
  | { ellipse: readonly [cx: number, cy: number, rx: number, ry: number] };

/** SVG elements for a silhouette. */
export function drawEls(els: readonly ShapeEl[]): ReactNode {
  return (
    <>
      {els.map((e, i) =>
        'd' in e ? (
          <path key={i} d={e.d} />
        ) : 'circle' in e ? (
          <circle key={i} cx={e.circle[0]} cy={e.circle[1]} r={e.circle[2]} />
        ) : (
          <ellipse
            key={i}
            cx={e.ellipse[0]}
            cy={e.ellipse[1]}
            rx={e.ellipse[2]}
            ry={e.ellipse[3]}
          />
        ),
      )}
    </>
  );
}
