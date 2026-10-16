import type { PieceKind } from '../pieceShapes';
import type { Art } from './shared';

/**
 * Neon: glowing tube outlines in pure geometry — circle + triangle pawn, straight
 * tower, zig-zag horse, diamond bishop, five-point crown, trapezoid king with a cross —
 * cyan for White, magenta for Black, with a faint inner tint.
 */
const LINES: Record<PieceKind, string[]> = {
  p: ['M-8,16 L0,-1 L8,16 Z', 'M-6,-9 A6,6 0 1 0 6,-9 A6,6 0 1 0 -6,-9'],
  r: [
    'M-9,16 L-9,-14 L-5,-14 L-5,-10 L-1.5,-10 L-1.5,-14 L1.5,-14 L1.5,-10 L5,-10 L5,-14 L9,-14 L9,16 Z',
    'M-9,0 L9,0',
  ],
  n: ['M-8,16 L-8,4 L-13,-1 L-5,-13 L-1,-24 L3,-16 L10,-9 L9,16 Z', 'M-4,-9 L-2,-9'],
  b: ['M0,-25 L8,-9 L4,7 L9,16 L-9,16 L-4,7 L-8,-9 Z', 'M2,-15 L-3,-5', 'M-4,7 L4,7'],
  q: ['M-10,16 L-12,-12 L-5,-3 L0,-20 L5,-3 L12,-12 L10,16 Z', 'M-11,8 L11,8'],
  k: ['M-10,16 L-7,-10 L7,-10 L10,16 Z', 'M0,-27 L0,-12', 'M-5,-21 L5,-21', 'M-9,4 L9,4'],
};

export const neonArt: Art = (kind, white) => {
  const color = white ? '#3ff3ff' : '#ff3fd8';
  const tint = white ? 'rgb(63 243 255 / 0.14)' : 'rgb(255 63 216 / 0.14)';
  const [outline, ...details] = LINES[kind];
  return (
    <g
      stroke={color}
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 5px ${color})` }}
    >
      <path d={outline} fill={tint} />
      {details.map((d) => (
        <path key={d} d={d} fill="none" />
      ))}
      {kind === 'q' &&
        [-12, 0, 12].map((x) => (
          <circle key={x} cx={x} cy={x === 0 ? -22.5 : -14} r="1.8" fill={color} stroke="none" />
        ))}
      {/* White-hot core of the tube. */}
      <path d={outline} fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.8" />
    </g>
  );
};
