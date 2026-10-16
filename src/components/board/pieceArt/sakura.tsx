import type { ReactNode } from 'react';
import type { PieceKind } from '../pieceShapes';
import { drawEls, solid, type Art, type ShapeEl } from './shared';

/**
 * Sakura: Japanese figures on low lacquer stands — a kokeshi doll pawn, a pagoda rook,
 * a horse with a red tassel, a stone-lantern (tōrō) bishop, a kimono lady with
 * kanzashi hairpins and a lord with wide kamishimo shoulders and a tall eboshi hat.
 * Pink-blossom porcelain vs black lacquer.
 */
const STAND = 'M-11,18 L11,18 L10,15 L-10,15 Z';

/** Pagoda roof with upturned eaves; `y` is the eave line, `w` the half width. */
const roof = (y: number, w: number) =>
  `M${-w},${y} Q${-w + 3},${y - 1} ${-w + 4},${y - 3.5} L${w - 4},${y - 3.5} Q${w - 3},${y - 1} ${w},${y} L${w - 3},${y + 1} L${-(w - 3)},${y + 1} Z`;

/** Silhouettes as data (also extruded into the 3D pieces). */
export const SAKURA_SHAPES: Record<PieceKind, ShapeEl[]> = {
  p: [
    { d: STAND },
    { d: 'M-6,15 C-7,8 -6,0 -4,-3 L4,-3 C6,0 7,8 6,15 Z' },
    { circle: [0, -9.5, 6.2] },
  ],
  r: [
    { d: STAND },
    { d: 'M-6,15 L-6,-14 L6,-14 L6,15 Z' },
    { d: roof(3, 11) },
    { d: roof(-6.5, 10) },
    { d: roof(-15.5, 8.5) },
    { d: 'M-0.8,-27 L0.8,-27 L0.8,-18.5 L-0.8,-18.5 Z' },
    { circle: [0, -27.2, 1.6] },
  ],
  n: [
    { d: STAND },
    { d: 'M1,-19 L3.5,-26 L5.5,-18.5 Z' },
    {
      d: 'M-8,15 C-9,6 -6,1 -6,-3 C-10,-3 -12,-6 -11,-9 C-8,-14 -3,-19 2,-20 C8,-20 12,-13 11,-4 C10,4 9,10 9,15 Z',
    },
  ],
  b: [
    { d: STAND },
    { d: 'M-3,15 L-3,2 L3,2 L3,15 Z' },
    { d: 'M-8,2.5 L8,2.5 L6,-1 L-6,-1 Z' },
    { d: 'M-5.5,-1 L-5.5,-11 L5.5,-11 L5.5,-1 Z' },
    { d: 'M-11,-10.5 Q-6,-12 -3,-17 L3,-17 Q6,-12 11,-10.5 Z' },
    { circle: [0, -19.5, 2.6] },
    { d: 'M-0.8,-24.5 L0.8,-24.5 L0.8,-21.5 L-0.8,-21.5 Z' },
  ],
  q: [
    { d: STAND },
    { d: 'M-9,15 C-8,6 -6,0 -4,-4 L4,-4 C6,0 8,6 9,15 Z' },
    { circle: [0, -9, 4.2] },
    { circle: [0, -15, 3.3] },
    { circle: [-4.3, -13, 2] },
    { circle: [4.3, -13, 2] },
  ],
  k: [
    { d: STAND },
    { d: 'M-6,15 L-6,-1 L-12.5,-4 L-11.5,-6.5 L-4,-5 L4,-5 L11.5,-6.5 L12.5,-4 L6,-1 L6,15 Z' },
    { circle: [0, -9.5, 3.8] },
    { d: 'M-3.5,-12 C-4,-20 0,-27 3.5,-28.5 C3,-22 4,-16 3.5,-12 Z' },
  ],
};

const PORCELAIN = {
  top: '#fffbfa',
  bottom: '#f0d6dc',
  rim: '#a06c78',
  ink: '#2a1418',
  bloom: '#e8798f',
  accent: '#c8323c',
};
const LACQUER = {
  top: '#4a2226',
  bottom: '#0e0405',
  rim: '#000000',
  ink: '#f6e7ea',
  bloom: '#f39bb0',
  accent: '#e6b450',
};

/** Five-petal blossom. */
function bloom(x: number, y: number, r: number, color: string, centre: string): ReactNode {
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={Math.round((x + Math.cos(a) * r) * 100) / 100}
            cy={Math.round((y + Math.sin(a) * r) * 100) / 100}
            r={r * 0.75}
            fill={color}
          />
        );
      })}
      <circle cx={x} cy={y} r={r * 0.45} fill={centre} />
    </g>
  );
}

export const sakuraArt: Art = (kind, white) => {
  const c = white ? PORCELAIN : LACQUER;
  const id = `mc-sakura-${white ? 'w' : 'b'}-${kind}`;
  const hair = white ? '#1f0d10' : '#f2dfe3';
  const details: Record<PieceKind, ReactNode> = {
    p: (
      <>
        <path d="M-6.2,-9.5 C-6,-16.5 6,-16.5 6.2,-9.5 C4,-12.5 -4,-12.5 -6.2,-9.5 Z" fill={hair} />
        <path
          d="M-3,-7.5 q1,0.8 2,0 M1,-7.5 q1,0.8 2,0"
          fill="none"
          stroke={c.ink}
          strokeWidth="0.6"
        />
        {bloom(0, 6, 1.6, c.bloom, c.accent)}
        <path d="M-5.5,1 C-2,2.5 2,2.5 5.5,1" fill="none" stroke={c.accent} strokeWidth="1.2" />
      </>
    ),
    r: (
      <>
        <rect x="-2" y="7" width="4" height="8" fill={c.accent} opacity="0.85" />
        <rect x="-1.6" y="-3" width="3.2" height="4" fill={c.accent} opacity="0.7" />
      </>
    ),
    n: (
      <>
        <circle cx="-2" cy="-12.5" r="1" fill={c.ink} />
        <path
          d="M3,-19 C8,-15 10,-8 9,0"
          fill="none"
          stroke={c.ink}
          strokeWidth="1.1"
          opacity="0.7"
        />
        <line x1="6" y1="-8" x2="6" y2="-2" stroke={c.accent} strokeWidth="1" />
        <circle cx="6" cy="-1" r="1.6" fill={c.accent} />
        {bloom(3, -15, 1.3, c.bloom, c.accent)}
      </>
    ),
    b: (
      <>
        <rect x="-3" y="-8.5" width="6" height="5" fill="#ffcf6a" opacity="0.9" />
        <line x1="0" y1="-8.5" x2="0" y2="-3.5" stroke={c.rim} strokeWidth="0.6" />
        {bloom(0, 9, 1.3, c.bloom, c.accent)}
      </>
    ),
    q: (
      <>
        <path d="M-4.2,-9 C-4.5,-14 4.5,-14 4.2,-9 C2.5,-11 -2.5,-11 -4.2,-9 Z" fill={hair} />
        <circle cx="0" cy="-15" r="3.3" fill={hair} />
        <circle cx="-4.3" cy="-13" r="2" fill={hair} />
        <circle cx="4.3" cy="-13" r="2" fill={hair} />
        <line x1="2" y1="-16" x2="7.5" y2="-19.5" stroke={c.accent} strokeWidth="0.8" />
        {bloom(7.8, -20, 1.4, c.bloom, c.accent)}
        <rect x="-5" y="1" width="10" height="3" fill={c.accent} />
        <path d="M-3,-4 L0,0 L3,-4" fill="none" stroke={c.rim} strokeWidth="0.8" />
        {bloom(-4, 9, 1.5, c.bloom, c.accent)}
        {bloom(4, 11, 1.2, c.bloom, c.accent)}
      </>
    ),
    k: (
      <>
        {/* Eboshi: black on porcelain, gold leaf on lacquer. */}
        <path
          d="M-3.5,-12 C-4,-20 0,-27 3.5,-28.5 C3,-22 4,-16 3.5,-12 Z"
          fill={white ? hair : c.accent}
        />
        <circle cx="0" cy="3" r="2.6" fill="none" stroke={c.accent} strokeWidth="0.9" />
        {bloom(0, 3, 1, c.bloom, c.accent)}
        <line x1="0" y1="6" x2="0" y2="15" stroke={c.rim} strokeWidth="0.8" />
        <circle cx="-1.3" cy="-9.8" r="0.5" fill={c.ink} />
        <circle cx="1.3" cy="-9.8" r="0.5" fill={c.ink} />
      </>
    ),
  };
  const inside = (
    <>
      <rect x="-6" y="-30" width="3" height="48" fill="#fff" opacity={white ? 0.45 : 0.14} />
      <rect x="2" y="-30" width="20" height="50" fill="#000" opacity={white ? 0.05 : 0.15} />
    </>
  );
  return solid(
    id,
    drawEls(SAKURA_SHAPES[kind]),
    { top: c.top, bottom: c.bottom, rim: c.rim, rimWidth: 1.1 },
    inside,
    details[kind],
  );
};
