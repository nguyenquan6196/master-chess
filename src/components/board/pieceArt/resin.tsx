import type { PieceKind } from '../pieceShapes';
import { lathe, solid, type Art, type Pt } from './shared';

/**
 * Resin: cast Staunton pieces — slim, tall and smooth — in translucent pearl white and
 * ocean blue, with an agate swirl inside, a glossy streak and a darker rim. Blue
 * pieces get a light halo so they stay readable on blue squares.
 */
const FOOT: Pt[] = [
  [0, 18],
  [11, 18],
  [11, 16],
  [8, 14.5],
  [5.5, 12],
];

const BODY: Record<Exclude<PieceKind, 'n'>, string> = {
  p: lathe([...FOOT, [3.5, 6], [3, 0], [6, -2], [6, -3.5], [3, -4.5], [0, -4.5]]),
  r: lathe([
    [0, 18],
    [12, 18],
    [12, 16],
    [9, 14.5],
    [7, 12],
    [6, 4],
    [6, -8],
    [8.5, -10],
    [8.5, -18],
    [5.5, -18],
    [5.5, -15],
    [2, -15],
    [2, -18],
    [0, -18],
  ]),
  b: lathe([
    ...FOOT,
    [3.5, 6],
    [3, -2],
    [6, -3],
    [6, -5],
    [3, -5.5],
    [5, -9],
    [6, -14],
    [4.5, -19],
    [2, -22],
    [0, -23],
  ]),
  q: lathe([
    ...FOOT,
    [3.5, 6],
    [3, -4],
    [6.5, -5],
    [6.5, -7],
    [3.5, -8],
    [5, -12],
    [8, -19],
    [6.5, -21.5],
    [4.5, -19.5],
    [2.5, -22],
    [0, -20.5],
  ]),
  k: lathe([
    ...FOOT,
    [3.5, 6],
    [3, -4],
    [6.5, -5],
    [6.5, -7],
    [3.5, -8],
    [5, -12],
    [7, -18],
    [3, -19.5],
    [0, -19.5],
  ]),
};

const KNIGHT_FOOT = lathe([...FOOT, [6, 12.5], [0, 12.5]]);
const HORSE =
  'M-6,12.5 C-7,6 -3,2 -2,-2 C-6,-1 -10,-1 -11,-4 C-11,-8 -5,-12 -3,-16 C-2,-20 1,-23 3,-23 L4,-27 L6,-22 C10,-19 11,-11 10,-3 C9.5,3 8,8 7,12.5 Z';

const PEARL = { top: '#ffffff', bottom: '#cfdde8', rim: '#7d97ad', swirl: '#9cc0dc' };
const OCEAN = { top: '#5aa6e6', bottom: '#0b3f7a', rim: '#06264a', swirl: '#cfeaff' };

export const resinArt: Art = (kind, white) => {
  const c = white ? PEARL : OCEAN;
  const id = `mc-resin-${white ? 'w' : 'b'}-${kind}`;
  const shape =
    kind === 'n' ? (
      <>
        <path d={KNIGHT_FOOT} />
        <path d={HORSE} />
      </>
    ) : (
      <>
        <path d={BODY[kind]} />
        {kind === 'p' && <circle cx="0" cy="-10" r="5.6" />}
        {kind === 'b' && <circle cx="0" cy="-25" r="2" />}
        {kind === 'q' && <circle cx="0" cy="-24.5" r="2.3" />}
        {kind === 'k' && (
          <>
            <rect x="-1.4" y="-28" width="2.8" height="9" rx="0.6" />
            <rect x="-4" y="-25.5" width="8" height="2.8" rx="0.6" />
          </>
        )}
      </>
    );
  const inside = (
    <>
      <g fill="none" stroke={c.swirl} strokeLinecap="round" opacity="0.55">
        <path d="M-14,6 C-6,0 2,10 12,2" strokeWidth="2.2" />
        <path d="M-12,-6 C-4,-12 4,-2 13,-9" strokeWidth="1.4" />
        <path d="M-10,14 C-2,9 6,16 14,11" strokeWidth="1.2" />
        <path d="M-9,-18 C-3,-22 3,-14 9,-20" strokeWidth="1" />
      </g>
      <ellipse
        cx="-3"
        cy="-8"
        rx="2.4"
        ry="14"
        fill="#ffffff"
        opacity={white ? 0.7 : 0.45}
        transform="rotate(12 -3 -8)"
      />
    </>
  );
  const halo = !white && (
    <g fill="none" stroke="#eaf6ff" strokeWidth="3.4" strokeLinejoin="round" opacity="0.85">
      {shape}
    </g>
  );
  const over =
    kind === 'n' ? (
      <circle cx="-1" cy="-15" r="1.1" fill={c.rim} />
    ) : kind === 'b' ? (
      <line x1="1" y1="-17" x2="4" y2="-12" stroke={c.rim} strokeWidth="1.2" />
    ) : null;
  return solid(
    id,
    shape,
    { top: c.top, bottom: c.bottom, rim: c.rim, bodyOpacity: white ? 0.94 : 0.9 },
    inside,
    over,
    halo,
  );
};
