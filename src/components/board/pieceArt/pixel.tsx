import type { JSX } from 'react';
import type { PieceKind } from '../pieceShapes';
import type { Art } from './shared';

/**
 * Arcade: 8-bit sprites. Each piece is a 12×12 fill bitmap ('X'); the outline (empty
 * pixels touching the fill) and a right-edge shade are derived, then drawn as crisp
 * squares in a Game Boy-like palette.
 */
const SPRITES: Record<PieceKind, string[]> = {
  p: [
    '............',
    '............',
    '.....XX.....',
    '....XXXX....',
    '....XXXX....',
    '.....XX.....',
    '.....XX.....',
    '....XXXX....',
    '...XXXXXX...',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '............',
  ],
  r: [
    '............',
    '..XX.XX.XX..',
    '..XXXXXXXX..',
    '...XXXXXX...',
    '...XXXXXX...',
    '...XXXXXX...',
    '...XXXXXX...',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '.XXXXXXXXXX.',
    '............',
  ],
  n: [
    '............',
    '.....XX.....',
    '....XXXXX...',
    '...XXXXXXX..',
    '..XXX.XXXX..',
    '.XXXXXXXXX..',
    '.XXX.XXXXX..',
    '......XXXX..',
    '.....XXXXX..',
    '....XXXXXX..',
    '...XXXXXXXX.',
    '............',
  ],
  b: [
    '.....XX.....',
    '....XXXX....',
    '...XXX.XX...',
    '...XX.XXX...',
    '...XXXXXX...',
    '....XXXX....',
    '.....XX.....',
    '....XXXX....',
    '...XXXXXX...',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '............',
  ],
  q: [
    '.X...XX...X.',
    '.XX..XX..XX.',
    '.XXXXXXXXXX.',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '...XXXXXX...',
    '....XXXX....',
    '....XXXX....',
    '...XXXXXX...',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '............',
  ],
  k: [
    '.....XX.....',
    '....XXXX....',
    '.....XX.....',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '...XXXXXX...',
    '....XXXX....',
    '....XXXX....',
    '...XXXXXX...',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '............',
  ],
};

/** Pixel size and grid origin so the 14×14 padded grid fills the piece box. */
const PX = 3.2;
const X0 = -22.4;
const Y0 = -26.8;

const PALETTE = {
  white: { fill: '#e0f8d0', shade: '#88c070', outline: '#081820' },
  black: { fill: '#173d24', shade: '#081808', outline: '#e0f8d0' },
};

function sprite(rows: string[]): { x: number; y: number; t: 'fill' | 'shade' | 'outline' }[] {
  const at = (r: number, c: number) => rows[r]?.[c] === 'X';
  const out: { x: number; y: number; t: 'fill' | 'shade' | 'outline' }[] = [];
  // Padded by one pixel on every side so outlines never clip.
  for (let r = -1; r <= 12; r++) {
    for (let c = -1; c <= 12; c++) {
      if (at(r, c)) {
        out.push({ x: c + 1, y: r + 1, t: at(r, c + 1) ? 'fill' : 'shade' });
      } else if (at(r - 1, c) || at(r + 1, c) || at(r, c - 1) || at(r, c + 1)) {
        out.push({ x: c + 1, y: r + 1, t: 'outline' });
      }
    }
  }
  return out;
}

const CACHE = new Map<PieceKind, ReturnType<typeof sprite>>();

export const pixelArt: Art = (kind, white): JSX.Element => {
  const pal = white ? PALETTE.white : PALETTE.black;
  let px = CACHE.get(kind);
  if (!px) {
    px = sprite(SPRITES[kind]);
    CACHE.set(kind, px);
  }
  return (
    <g shapeRendering="crispEdges">
      {px.map(({ x, y, t }) => (
        <rect
          key={`${x}-${y}`}
          x={X0 + x * PX}
          y={Y0 + y * PX}
          width={PX + 0.05}
          height={PX + 0.05}
          fill={pal[t]}
        />
      ))}
    </g>
  );
};
