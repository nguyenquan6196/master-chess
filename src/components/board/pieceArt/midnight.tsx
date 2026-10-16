import type { PieceKind } from '../pieceShapes';
import { lathe, poly, shade, solid, type Art, type Pt } from './shared';

/**
 * Midnight: cast metal in Art Deco cuts — tall, narrow, all straight edges and sharp
 * bevels (hexagon pawn head, V-notched rook, blade bishop, built-in cross) — in
 * moonlit silver and gloss black with a cold blue edge light.
 */
const FOOT: Pt[] = [
  [0, 18],
  [10, 18],
  [10, 15],
  [5, 13],
];

const BODY: Record<PieceKind, string> = {
  p: lathe([...FOOT, [3, 1], [6, -2], [0, -2]]),
  r: lathe([
    [0, 18],
    [11, 18],
    [11, 15],
    [8, 13],
    [7, -14],
    [9, -16],
    [9, -23],
    [4, -19],
    [0, -23],
  ]),
  n: poly([
    [-10, 18],
    [10, 18],
    [10, 15],
    [8, 13],
    [10, -12],
    [2, -18],
    [-2, -27],
    [-5, -16],
    [-12, -7],
    [-11, -2],
    [-5, -3],
    [-7, 13],
    [-10, 15],
  ]),
  b: lathe([...FOOT, [3, -2], [6, -6], [3, -24], [0, -27]]),
  q: lathe([...FOOT, [3, -2], [8, -8], [9, -23], [5, -16], [3, -25], [0, -18]]),
  k: lathe([
    ...FOOT,
    [3, -2],
    [7, -8],
    [7, -17],
    [2, -19],
    [2, -21],
    [5, -21],
    [5, -24],
    [2, -24],
    [2, -28],
    [0, -28],
  ]),
};

const HEX = poly(
  Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [
      Math.round(Math.cos(a) * 5.6 * 100) / 100,
      Math.round((-8.5 + Math.sin(a) * 5.6) * 100) / 100,
    ] as const;
  }),
);

const SILVER = { top: '#ffffff', bottom: '#8f9bb0', rim: '#3a4454', edge: '#d6e6ff' };
const OBSIDIAN = { top: '#4d5568', bottom: '#06070b', rim: '#000000', edge: '#7fa8ff' };

export const midnightArt: Art = (kind, white) => {
  const c = white ? SILVER : OBSIDIAN;
  const id = `mc-midnight-${white ? 'w' : 'b'}-${kind}`;
  const shape = (
    <>
      <path d={BODY[kind]} />
      {kind === 'p' && <path d={HEX} />}
    </>
  );
  const inside = (
    <>
      {shade(white ? 0.18 : 0.3)}
      {/* Cold edge light down the bevel and a diagonal sheen. */}
      <line x1="-0.4" y1="-30" x2="-0.4" y2="20" stroke={c.edge} strokeWidth="0.9" opacity="0.8" />
      <path d="M-14,-6 L-4,-16 L-2,-14 L-12,-4 Z" fill="#fff" opacity={white ? 0.35 : 0.12} />
      <rect x="-16" y="14.6" width="32" height="0.9" fill={c.edge} opacity="0.6" />
    </>
  );
  const over =
    kind === 'n' ? (
      <path d="M-5,-12 L-1.5,-12.5" stroke={c.edge} strokeWidth="1.3" strokeLinecap="round" />
    ) : kind === 'b' ? (
      <line x1="0.5" y1="-17" x2="3.5" y2="-11" stroke={c.rim} strokeWidth="1.2" />
    ) : null;
  return solid(
    id,
    shape,
    { top: c.top, bottom: c.bottom, rim: c.rim, rimWidth: 1.1 },
    inside,
    over,
  );
};
