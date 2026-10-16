import type { ReactNode } from 'react';
import type { PieceKind } from '../pieceShapes';
import { lathe, rings, solid, type Art, type Pt } from './shared';

/**
 * Wood: lathe-turned pieces — wide grooved foot, turned stem and collar, round heads,
 * a carved horse — in light oak and dark walnut with grain lines.
 */
export const STAUNTON_FOOT: Pt[] = [
  [0, 18],
  [13, 18],
  [13, 15.5],
  [11, 14.5],
  [11.5, 12.5],
  [8.5, 11.5],
];

/**
 * Right-half turning profiles (SVG units, y down, ground at y = 18) of the Staunton
 * pieces — drawn flat here and in rank emblems, turned into 3D lathes by the 3D board.
 */
export const STAUNTON_PROFILES: Record<Exclude<PieceKind, 'n'>, Pt[]> = {
  p: [
    ...STAUNTON_FOOT,
    [6, 9],
    [4.5, 4],
    [4.5, 0],
    [7.5, -1],
    [7.5, -3],
    [4, -4],
    [3.5, -6],
    [0, -6],
  ],
  r: [
    [0, 18],
    [14, 18],
    [14, 15.5],
    [12, 14.5],
    [12.5, 12.5],
    [9.5, 11.5],
    [8.5, 8],
    [8, -6],
    [10.5, -7.5],
    [10.5, -18],
    [7, -18],
    [7, -14.5],
    [3, -14.5],
    [3, -18],
    [0, -18],
  ],
  b: [
    ...STAUNTON_FOOT,
    [6, 9],
    [4.5, 3],
    [4, -2],
    [7.5, -3],
    [7.5, -5],
    [4, -6],
    [5.5, -9],
    [7, -13],
    [6, -18],
    [3.5, -21.5],
    [0, -23],
  ],
  q: [
    ...STAUNTON_FOOT,
    [6.5, 9],
    [5, 3],
    [4.5, -4],
    [8, -5],
    [8, -7],
    [5, -8],
    [6, -11],
    [9.5, -18],
    [8, -20.5],
    [6, -18],
    [4, -21],
    [2, -18.5],
    [0, -20],
  ],
  k: [
    ...STAUNTON_FOOT,
    [6.5, 9],
    [5, 3],
    [4.5, -4],
    [8, -5],
    [8, -7],
    [5, -8],
    [6, -11],
    [8, -16],
    [8, -18],
    [4, -19],
    [0, -19],
  ],
};

const BODY = Object.fromEntries(
  Object.entries(STAUNTON_PROFILES).map(([k, profile]) => [k, lathe(profile)]),
) as Record<Exclude<PieceKind, 'n'>, string>;

/** The knight stands on a low turned foot; its head is the `STAUNTON_HORSE` outline. */
export const STAUNTON_KNIGHT_FOOT: Pt[] = [...STAUNTON_FOOT, [0, 11.5]];
const KNIGHT_FOOT = lathe(STAUNTON_KNIGHT_FOOT);
export const STAUNTON_HORSE =
  'M-8,11.5 C-9,5 -5,1 -4,-2 C-8,-1 -12,0 -13,-3 C-13,-7 -7,-11 -5,-15 C-4,-19 -1,-22 2,-22 L3,-26 L6,-21 C11,-18 13,-10 12,-2 C11.5,4 10,8 9,11.5 Z';

/** Groove heights per piece (where the turning tool cut a ring). */
const GROOVES: Record<PieceKind, number[]> = {
  p: [15.5, 12.5, -1, -3],
  r: [15.5, 12.5, 8, -7.5],
  n: [15.5, 12.5],
  b: [15.5, 12.5, -3, -5],
  q: [15.5, 12.5, -5, -7],
  k: [15.5, 12.5, -5, -7, -18],
};

const OAK = { top: '#f6dfae', bottom: '#c48d52', rim: '#6e4520', grain: '#a8733e' };
const WALNUT = { top: '#86553a', bottom: '#3a2010', rim: '#1a0d05', grain: '#24130a' };

/**
 * The turned Staunton silhouette of `kind` (no material): the wood set's shape, also
 * drawn flat inside rank emblems.
 */
export function stauntonShape(kind: PieceKind): ReactNode {
  return kind === 'n' ? (
    <>
      <path d={KNIGHT_FOOT} />
      <path d={STAUNTON_HORSE} />
    </>
  ) : (
    <>
      <path d={BODY[kind]} />
      {kind === 'p' && <circle cx="0" cy="-12.5" r="6.8" />}
      {kind === 'b' && <circle cx="0" cy="-25" r="2.4" />}
      {kind === 'q' && <circle cx="0" cy="-23" r="2.5" />}
      {kind === 'k' && (
        <>
          <rect x="-1.8" y="-28" width="3.6" height="9.5" rx="0.8" />
          <rect x="-4.5" y="-25.5" width="9" height="3.4" rx="0.8" />
        </>
      )}
    </>
  );
}

export const woodArt: Art = (kind, white) => {
  const c = white ? OAK : WALNUT;
  const id = `mc-wood-${white ? 'w' : 'b'}-${kind}`;
  const shape = stauntonShape(kind);
  const inside = (
    <>
      {/* Grain: long wavy lines along the turning axis. */}
      <g fill="none" stroke={c.grain} strokeWidth="0.7" opacity="0.45">
        <path d="M-7,20 C-5,6 -9,-8 -6,-28" />
        <path d="M-1,20 C1,4 -3,-10 0,-28" />
        <path d="M5,20 C7,6 3,-8 6,-28" />
        <path d="M10,20 C11,8 8,-4 10,-20" />
      </g>
      {rings(GROOVES[kind], c.rim, 0.9)}
      {/* Varnish highlight. */}
      <rect x="-6" y="-30" width="3" height="50" fill="#fff" opacity={white ? 0.28 : 0.14} />
    </>
  );
  const over =
    kind === 'n' ? (
      <>
        <path d="M2,-20 C7,-16 9,-8 8,2" fill="none" stroke={c.rim} strokeWidth="1" opacity="0.7" />
        <circle cx="-2" cy="-14" r="1.2" fill={c.rim} />
      </>
    ) : kind === 'b' ? (
      <line x1="1.5" y1="-18" x2="5" y2="-12.5" stroke={c.rim} strokeWidth="1.5" />
    ) : null;
  return solid(id, shape, { top: c.top, bottom: c.bottom, rim: c.rim }, inside, over);
};
