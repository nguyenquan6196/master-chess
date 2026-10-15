import type { ReactNode } from 'react';

/** Shared vector chess-piece silhouettes (rank emblems, the "minimal"/"outline" piece sets). */
export type PieceKind = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/** Vector piece silhouettes in a ~40px box centred on (0, -2). */
export const PIECE_SHAPES: Record<PieceKind, ReactNode> = {
  p: (
    <>
      <circle cx="0" cy="-12" r="6" />
      <path d="M-7,13 C-7,4 -3,0 -4,-4 L4,-4 C3,0 7,4 7,13 Z" />
      <ellipse cx="0" cy="-4.5" rx="6" ry="2" />
    </>
  ),
  n: (
    <>
      <path d="M-9,13 C-9,4 -4,0 -2,-4 C-6,-3 -10,-1 -12,-4 C-12,-8 -6,-12 -4,-16 C-3,-20 0,-22 2,-22 L3,-25 L5,-21 C10,-18 12,-10 11,0 C10,6 9,10 9,13 Z" />
    </>
  ),
  b: (
    <>
      <circle cx="0" cy="-24" r="2.4" />
      <path d="M-7,13 C-8,4 -6,-2 -3,-6 C-7,-10 -6,-18 0,-22 C6,-18 7,-10 3,-6 C6,-2 8,4 7,13 Z" />
    </>
  ),
  r: (
    <path d="M-9,13 L-8,-2 L-10,-4 L-10,-14 L-6,-14 L-6,-10 L-2,-10 L-2,-14 L2,-14 L2,-10 L6,-10 L6,-14 L10,-14 L10,-4 L8,-2 L9,13 Z" />
  ),
  q: (
    <>
      <path d="M-9,13 L-11,-10 L-6,-2 L-5,-14 L-1,-3 L0,-16 L1,-3 L5,-14 L6,-2 L11,-10 L9,13 Z" />
      {[
        [-11, -11],
        [-5, -15],
        [0, -17.5],
        [5, -15],
        [11, -11],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2" />
      ))}
    </>
  ),
  k: (
    <>
      <path d="M-9,13 C-10,4 -10,-6 -6,-10 L6,-10 C10,-6 10,4 9,13 Z" />
      <rect x="-1.6" y="-24" width="3.2" height="13" rx="0.8" />
      <rect x="-5" y="-20.5" width="10" height="3.2" rx="0.8" />
    </>
  ),
};
export const PIECE_BASE = <path d="M-12,18 L12,18 L10,13 L-10,13 Z" />;
