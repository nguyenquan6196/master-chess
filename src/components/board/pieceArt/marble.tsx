import type { PieceKind } from '../pieceShapes';
import { lathe, poly, shade, solid, type Art, type Pt } from './shared';

/**
 * Marble: carved stone — heavy chamfered plinths, straight cuts and faceted heads
 * (octagon pawn, diamond finials), white Carrara and black marble with veins. The right
 * half is shaded so the facets read as cut stone.
 */
const PLINTH: Pt[] = [
  [0, 18],
  [14, 18],
  [14, 14],
  [11, 12],
];

const BODY: Record<PieceKind, string> = {
  p: lathe([...PLINTH, [7, 12], [5, 0], [8, -2], [8, -4], [0, -4]]),
  r: lathe([
    ...PLINTH,
    [9, 12],
    [9, -8],
    [12, -10],
    [12, -19],
    [7, -19],
    [7, -15],
    [2.5, -15],
    [2.5, -19],
    [0, -19],
  ]),
  n: poly([
    [-14, 18],
    [14, 18],
    [14, 14],
    [11, 12],
    [9, 12],
    [11, 0],
    [10, -14],
    [3, -20],
    [-1, -25],
    [-4, -17],
    [-12, -9],
    [-13, -2],
    [-6, 0],
    [-9, 12],
    [-11, 12],
    [-14, 14],
  ]),
  b: lathe([...PLINTH, [7, 12], [5, -2], [9, -4], [9, -6], [5, -7], [8, -12], [6, -19], [0, -24]]),
  q: lathe([
    ...PLINTH,
    [7, 12],
    [5, -4],
    [9, -6],
    [9, -8],
    [6, -9],
    [11, -19],
    [7, -15],
    [5, -21],
    [2, -15],
    [0, -21],
  ]),
  k: lathe([...PLINTH, [7, 12], [5, -4], [9, -6], [9, -8], [6, -9], [9, -18], [0, -18]]),
};

const OCTAGON = poly(
  Array.from({ length: 8 }, (_, i) => {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    return [
      Math.round(Math.cos(a) * 7 * 100) / 100,
      Math.round((-11 + Math.sin(a) * 7) * 100) / 100,
    ] as const;
  }),
);
const diamond = (cy: number, r: number) =>
  poly([
    [0, cy - r],
    [r * 0.8, cy],
    [0, cy + r],
    [-r * 0.8, cy],
  ]);
const CROSS = poly([
  [-1.8, -29],
  [1.8, -29],
  [1.8, -26],
  [4.5, -26],
  [4.5, -22.5],
  [1.8, -22.5],
  [1.8, -18],
  [-1.8, -18],
  [-1.8, -22.5],
  [-4.5, -22.5],
  [-4.5, -26],
  [-1.8, -26],
]);

const CARRARA = { top: '#ffffff', bottom: '#d6dade', rim: '#646a71', vein: '#8f979f' };
const NERO = { top: '#5a5e65', bottom: '#121316', rim: '#000000', vein: '#d4d7dc' };

export const marbleArt: Art = (kind, white) => {
  const c = white ? CARRARA : NERO;
  const id = `mc-marble-${white ? 'w' : 'b'}-${kind}`;
  const shape = (
    <>
      <path d={BODY[kind]} />
      {kind === 'p' && <path d={OCTAGON} />}
      {kind === 'b' && <path d={diamond(-26, 2.6)} />}
      {kind === 'q' && <path d={diamond(-23.5, 2.8)} />}
      {kind === 'k' && <path d={CROSS} />}
    </>
  );
  const inside = (
    <>
      {/* Veins. */}
      <g fill="none" stroke={c.vein} strokeLinecap="round" opacity={white ? 0.6 : 0.4}>
        <path d="M-15,-6 C-8,-2 -6,6 2,8 C8,9 10,14 16,15" strokeWidth="0.9" />
        <path d="M-6,-28 C-4,-18 4,-16 3,-6" strokeWidth="0.6" />
        <path d="M6,-14 C10,-8 7,0 12,4" strokeWidth="0.5" />
      </g>
      {/* Facets: the right half is in shadow, the plinth top catches light. */}
      {shade(white ? 0.1 : 0.22)}
      <rect x="-16" y="12" width="32" height="2" fill="#fff" opacity={white ? 0.5 : 0.12} />
    </>
  );
  const over =
    kind === 'n' ? (
      <path d="M-5,-12 L-2,-12" stroke={c.rim} strokeWidth="1.6" strokeLinecap="round" />
    ) : kind === 'b' ? (
      <line x1="1" y1="-16" x2="5" y2="-11" stroke={c.rim} strokeWidth="1.4" />
    ) : null;
  return solid(
    id,
    shape,
    { top: c.top, bottom: c.bottom, rim: c.rim, rimWidth: 1.2 },
    inside,
    over,
  );
};
