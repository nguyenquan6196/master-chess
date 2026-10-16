import type { ReactNode } from 'react';
import type { PieceKind } from '../pieceShapes';
import { drawEls, shade, solid, type Art, type ShapeEl } from './shared';

/**
 * Fantasy: little characters on round pedestals — a shield-bearing footsoldier, a
 * castle turret with a pennant, a dragon, a wizard with hat and staff, a winged queen
 * and a crowned sorcerer-king with a sceptre. Ivory & gold vs amethyst & gold.
 */
const PEDESTAL = 'M-12,18 L12,18 L11,14.5 C7,12.5 -7,12.5 -11,14.5 Z';

/** Silhouettes as data (also extruded into the 3D pieces). */
export const FANTASY_SHAPES: Record<PieceKind, ShapeEl[]> = {
  p: [
    { d: PEDESTAL },
    { d: 'M-6,13.5 L-5,-1 L5,-1 L6,13.5 Z' },
    { d: 'M-5.5,-2.5 C-6,-12 6,-12 5.5,-2.5 Z' },
    { d: 'M-1,-10.5 C0,-15 3,-17 6,-16 C4,-14 2,-12 1,-10.5 Z' },
    { circle: [-4, 5, 5.6] },
  ],
  r: [
    { d: PEDESTAL },
    { d: 'M-8,13.5 L-8,-8 L8,-8 L8,13.5 Z' },
    { d: 'M-10.5,-7.5 L0,-24 L10.5,-7.5 Z' },
    { d: 'M-0.6,-29 L0.6,-29 L0.6,-23 L-0.6,-23 Z' },
    { d: 'M0.6,-29 L7,-27 L0.6,-25 Z' },
  ],
  n: [
    { d: PEDESTAL },
    { d: 'M10,-8 L15,-10 L11.5,-4 Z' },
    { d: 'M11,0 L15.5,-1.5 L11.5,4.5 Z' },
    {
      d: 'M-9,13.5 C-10,5 -6,1 -6,-3 C-11,-3 -14,-5 -13,-9 C-10,-11 -6,-11 -4,-14 L-7,-22 L-1,-17 L1,-25 L4,-16 C10,-13 12,-6 11,2 C10,7 9,10 9,13.5 Z',
    },
  ],
  b: [
    { d: PEDESTAL },
    { d: 'M-10.2,13.5 L-10.2,-13 L-8.4,-13 L-8.4,13.5 Z' },
    { circle: [-9.3, -15.5, 2.6] },
    { d: 'M-8,13.5 L-4,-6 L4,-6 L8,13.5 Z' },
    { circle: [0, -8.5, 3.6] },
    { ellipse: [0, -11.5, 7.5, 1.9] },
    { d: 'M-5,-12 L3,-28 L1.5,-22 L5.5,-12 Z' },
  ],
  q: [
    { d: PEDESTAL },
    { d: 'M-3,-5 C-10,-14 -17,-12 -17,-3 C-14,-5 -12,-3 -13,1 C-10,-2 -6,-1 -3,0 Z' },
    { d: 'M3,-5 C10,-14 17,-12 17,-3 C14,-5 12,-3 13,1 C10,-2 6,-1 3,0 Z' },
    { d: 'M-9,13.5 C-8,4 -4,0 -3,-6 L3,-6 C4,0 8,4 9,13.5 Z' },
    { circle: [0, -10, 3.6] },
    { d: 'M-4,-13 L-3,-17.5 L-1.5,-14.5 L0,-19 L1.5,-14.5 L3,-17.5 L4,-13 Z' },
  ],
  k: [
    { d: PEDESTAL },
    { d: 'M8.5,13.5 L8.5,-12 L10.1,-12 L10.1,13.5 Z' },
    { circle: [9.3, -14.2, 2.5] },
    { d: 'M-10,13.5 C-9,4 -7,-2 -6,-6 L6,-6 C7,-2 9,4 10,13.5 Z' },
    { circle: [0, -10, 3.8] },
    { d: 'M-5,-12.5 L-6,-19.5 L-3,-16.5 L0,-21.5 L3,-16.5 L6,-19.5 L5,-12.5 Z' },
    {
      d: 'M-1,-28 L1,-28 L1,-26 L3,-26 L3,-24 L1,-24 L1,-21.5 L-1,-21.5 L-1,-24 L-3,-24 L-3,-26 L-1,-26 Z',
    },
  ],
};

const IVORY = {
  top: '#fff8e2',
  bottom: '#dcae52',
  rim: '#6e4a0e',
  gem: '#8a4bd8',
  trim: '#c9921c',
};
const AMETHYST = {
  top: '#a786e6',
  bottom: '#2c1356',
  rim: '#12062a',
  gem: '#ffd24a',
  trim: '#ffcf5a',
};

export const fantasyArt: Art = (kind, white) => {
  const c = white ? IVORY : AMETHYST;
  const id = `mc-fantasy-${white ? 'w' : 'b'}-${kind}`;
  const inside = (
    <>
      {shade(white ? 0.1 : 0.2)}
      <path d="M-11,15.3 C-7,13.8 7,13.8 11,15.3" fill="none" stroke={c.trim} strokeWidth="1.4" />
      <rect x="-5" y="-30" width="2.5" height="48" fill="#fff" opacity={white ? 0.3 : 0.15} />
    </>
  );
  const ink = c.rim;
  const details: Record<PieceKind, ReactNode> = {
    p: (
      <>
        <line x1="-4" y1="-5.5" x2="4" y2="-5.5" stroke={ink} strokeWidth="1.2" />
        <circle cx="-4" cy="5" r="1.8" fill={c.gem} stroke={ink} strokeWidth="0.6" />
        <circle cx="-4" cy="5" r="3.8" fill="none" stroke={c.trim} strokeWidth="0.9" />
      </>
    ),
    r: (
      <>
        <path d="M-2,1 L-2,-2 A2,2 0 0 1 2,-2 L2,1 Z" fill={ink} />
        <path d="M-3,13.5 L-3,9 A3,3 0 0 1 3,9 L3,13.5 Z" fill={ink} />
        <path d="M-8,5 L8,5 M-8,-3 L8,-3" stroke={ink} strokeWidth="0.6" opacity="0.5" />
        <path d="M2,-27 L5.5,-27" stroke={c.gem} strokeWidth="1.2" />
      </>
    ),
    n: (
      <>
        <ellipse cx="-3" cy="-10" rx="1.6" ry="1" fill={c.gem} stroke={ink} strokeWidth="0.5" />
        <circle cx="-11" cy="-7" r="0.8" fill={ink} />
        <path
          d="M-13,-5.5 L-11.5,-4.2 L-10,-5.5 L-8.5,-4.2"
          fill="none"
          stroke={ink}
          strokeWidth="0.8"
        />
        <path
          d="M1,-22 C6,-16 9,-8 8,4"
          fill="none"
          stroke={c.trim}
          strokeWidth="1"
          opacity="0.8"
        />
      </>
    ),
    b: (
      <>
        <path d="M-2.4,-7.5 C-2,-2 2,-2 2.4,-7.5" fill="#f4f1ea" stroke={ink} strokeWidth="0.6" />
        <circle cx="-1.2" cy="-9" r="0.5" fill={ink} />
        <circle cx="1.2" cy="-9" r="0.5" fill={ink} />
        <circle cx="-9.3" cy="-15.5" r="1.3" fill={c.gem} />
        <path
          d="M1,-19 l0.6,1.4 1.5,0.1 -1.2,0.9 0.4,1.5 -1.3,-0.8 -1.3,0.8 0.4,-1.5 -1.2,-0.9 1.5,-0.1 Z"
          fill={c.trim}
        />
      </>
    ),
    q: (
      <>
        <circle cx="0" cy="-16.5" r="1" fill={c.gem} />
        <path d="M-6,4 C-2,6 2,6 6,4" fill="none" stroke={c.trim} strokeWidth="1" />
        <circle cx="-1.2" cy="-10.3" r="0.5" fill={ink} />
        <circle cx="1.2" cy="-10.3" r="0.5" fill={ink} />
      </>
    ),
    k: (
      <>
        <circle cx="0" cy="-15.5" r="1.1" fill={c.gem} />
        <circle cx="9.3" cy="-14.2" r="1.2" fill={c.gem} />
        <path d="M-2.6,-8 C-2,-3.5 2,-3.5 2.6,-8" fill="#f4f1ea" stroke={ink} strokeWidth="0.6" />
        <line x1="-7" y1="2" x2="7" y2="2" stroke={c.trim} strokeWidth="1.4" />
      </>
    ),
  };
  return solid(
    id,
    drawEls(FANTASY_SHAPES[kind]),
    { top: c.top, bottom: c.bottom, rim: c.rim, rimWidth: 1.1 },
    inside,
    details[kind],
  );
};
