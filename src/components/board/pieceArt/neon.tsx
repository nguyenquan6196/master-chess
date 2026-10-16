import type { PieceKind } from '../pieceShapes';
import type { Art } from './shared';

/**
 * Neon: glowing tube outlines in simple geometry — circle + triangle pawn, straight
 * tower, a curved horse head (muzzle, ear, mane), a round mitre with a ball and slit,
 * a five-point crown, a trapezoid king with a cross — cyan for White, magenta for Black.
 * A blurred halo pulses (`.mc-neon-glow`, staggered per piece kind like real tubes).
 */
const LINES: Record<PieceKind, string[]> = {
  p: ['M-8,16 L0,-1 L8,16 Z', 'M-6,-9 A6,6 0 1 0 6,-9 A6,6 0 1 0 -6,-9'],
  r: [
    'M-9,16 L-9,-14 L-5,-14 L-5,-10 L-1.5,-10 L-1.5,-14 L1.5,-14 L1.5,-10 L5,-10 L5,-14 L9,-14 L9,16 Z',
    'M-9,0 L9,0',
  ],
  n: [
    'M-9,16 L-8,4 C-8,0 -6,-2 -4,-3 L-12,-4 C-14,-5 -14,-9 -12,-11 L-5,-17 L-3,-24 L1,-19 C7,-17 11,-10 11,-2 L10,16 Z',
    'M2,-16 C6,-11 8,-5 8,3',
  ],
  b: [
    'M-7,16 L-4,5 C-9,-1 -7,-13 0,-19 C7,-13 9,-1 4,5 L7,16 Z',
    'M3,-12 L-2,-4',
    'M-4,5 L4,5',
    'M-2.4,-22.5 A2.4,2.4 0 1 0 2.4,-22.5 A2.4,2.4 0 1 0 -2.4,-22.5',
  ],
  q: ['M-10,16 L-12,-12 L-5,-3 L0,-20 L5,-3 L12,-12 L10,16 Z', 'M-11,8 L11,8'],
  k: ['M-10,16 L-7,-10 L7,-10 L10,16 Z', 'M0,-27 L0,-12', 'M-5,-21 L5,-21', 'M-9,4 L9,4'],
};

/** Pulse offsets so the tubes don't all breathe in sync. */
const PULSE_DELAY_S: Record<PieceKind, number> = { p: 0, r: 0.5, n: 1.1, b: 0.8, q: 1.6, k: 0.3 };

export const neonArt: Art = (kind, white) => {
  const color = white ? '#3ff3ff' : '#ff3fd8';
  const tint = white ? 'rgb(63 243 255 / 0.14)' : 'rgb(255 63 216 / 0.14)';
  const [outline, ...details] = LINES[kind];
  const dots =
    kind === 'q'
      ? [-12, 0, 12].map((x) => (
          <circle key={x} cx={x} cy={x === 0 ? -22.5 : -14} r="1.8" fill={color} stroke="none" />
        ))
      : kind === 'n'
        ? [<circle key="eye" cx="-4" cy="-12" r="1.3" fill={color} stroke="none" />]
        : null;
  return (
    <g strokeLinejoin="round" strokeLinecap="round" stroke={color}>
      {/* Halo: a blurred, thicker copy whose brightness pulses. */}
      <g
        className="mc-neon-glow"
        fill="none"
        strokeWidth="5"
        style={{ filter: 'blur(2.4px)', animationDelay: `${PULSE_DELAY_S[kind]}s` }}
      >
        {LINES[kind].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g strokeWidth="2.2" style={{ filter: `drop-shadow(0 0 1.5px ${color})` }}>
        <path d={outline} fill={tint} />
        {details.map((d) => (
          <path key={d} d={d} fill="none" />
        ))}
        {dots}
        {/* White-hot core of the tube. */}
        <path d={outline} fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.8" />
      </g>
    </g>
  );
};
