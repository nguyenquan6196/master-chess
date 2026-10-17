import {
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from 'three';
import { FANTASY_SHAPES } from '../board/pieceArt/fantasy';
import { SAKURA_SHAPES } from '../board/pieceArt/sakura';
import type { ShapeEl } from '../board/pieceArt/shared';
import type { PieceKind } from '../board/pieceShapes';
import {
  extruded,
  heightOf,
  horseHead,
  latheOf,
  S,
  shapeFromEl,
  shapeFromPath,
  type PiecePart,
  type Tone,
  type Vec3,
} from './geoUtil';

/**
 * Round 3D figures for the character sets (fantasy, sakura): bodies are turned, heads and
 * orbs are spheres, hats/roofs are cones, and the painted 2D details (faces, gems,
 * flowers, sashes, windows) become small coloured parts. Coordinates are the 2D art's
 * (SVG units; x right, y down, front = +z).
 */

const part = (
  geometry: BufferGeometry,
  tone: Tone,
  position?: Vec3,
  rotation?: Vec3,
): PiecePart => ({
  geometry,
  tone,
  position,
  rotation,
});
const at = (x: number, y: number, z = 0): Vec3 => [x * S, heightOf(y), z * S];

/** Upright cylinder from svg height `y1` (bottom) up to `y2`. */
function column(
  r1: number,
  r2: number,
  y1: number,
  y2: number,
  x = 0,
  z = 0,
  sides = 24,
  tone: Tone = 'body',
) {
  return part(
    new CylinderGeometry(r2 * S, r1 * S, (y1 - y2) * S, sides),
    tone,
    at(x, (y1 + y2) / 2, z),
  );
}
const ball = (r: number, x: number, y: number, z: number, tone: Tone) =>
  part(new SphereGeometry(r * S, 24, 16), tone, at(x, y, z));
/** A flat disc facing the viewer (front decals: shields, flowers, crests). */
const disc = (r: number, x: number, y: number, z: number, tone: Tone, thick = 0.6) =>
  part(new CylinderGeometry(r * S, r * S, thick * S, 24), tone, at(x, y, z), [Math.PI / 2, 0, 0]);
const ring = (r: number, tube: number, y: number, tone: Tone) =>
  part(new TorusGeometry(r * S, tube * S, 10, 40), tone, at(0, y), [Math.PI / 2, 0, 0]);
const block = (w: number, h: number, d: number, x: number, y: number, z: number, tone: Tone) =>
  part(new BoxGeometry(w * S, h * S, d * S), tone, at(x, y, z));
/** Four-sided roof / pyramid frustum between svg heights (square, turned 45°). */
const roof = (wTop: number, wBottom: number, y1: number, y2: number, tone: Tone) =>
  part(
    new CylinderGeometry(wTop * Math.SQRT2 * S, wBottom * Math.SQRT2 * S, (y1 - y2) * S, 4),
    tone,
    at(0, (y1 + y2) / 2),
    [0, Math.PI / 4, 0],
  );
/** A dome (top part of a sphere): helmets and hair caps. */
const dome = (r: number, x: number, y: number, z: number, tone: Tone, cover = 0.45) =>
  part(new SphereGeometry(r * S, 24, 12, 0, Math.PI * 2, 0, Math.PI * cover), tone, at(x, y, z));
/** Thick, rounded extrusion of 2D outlines (horse heads, wings, hats). */
const carved = (
  els: readonly ShapeEl[],
  depth: number,
  bevel: number,
  tone: Tone,
  z = 0,
  ry = 0,
) => {
  const g = extruded(els.map(shapeFromEl), depth, bevel);
  return part(g, tone, [0, 0, z * S], ry ? [0, ry, 0] : undefined);
};

/** Painted eyes (and optional blush) on a head of radius `r` centred at svg (0, y). */
const face = (r: number, y: number, blush = false) => [
  ball(r * 0.13, -r * 0.36, y - r * 0.08, r * 0.9, 'ink'),
  ball(r * 0.13, r * 0.36, y - r * 0.08, r * 0.9, 'ink'),
  ...(blush
    ? [
        ball(r * 0.17, -r * 0.55, y + r * 0.32, r * 0.78, 'bloom'),
        ball(r * 0.17, r * 0.55, y + r * 0.32, r * 0.78, 'bloom'),
      ]
    : []),
];

// ---- Fantasy -----------------------------------------------------------------------

const PEDESTAL = latheOf([
  [0, 18],
  [12, 18],
  [12, 16.2],
  [10.8, 15],
  [9, 13.6],
  [0, 13.6],
]);
const pedestal = () => [part(PEDESTAL, 'body'), ring(10.9, 0.7, 15.2, 'accent')];

function fantasy(kind: PieceKind): PiecePart[] {
  const F = FANTASY_SHAPES[kind];
  switch (kind) {
    case 'p':
      return [
        ...pedestal(),
        part(
          latheOf([
            [0, 13.6],
            [6, 13.6],
            [5.2, 4],
            [4.4, -1],
            [0, -1],
          ]),
          'body',
        ),
        ball(4.6, 0, -4.5, 0, 'skin'),
        dome(5.6, 0, -4, 0, 'accent', 0.5),
        block(7.5, 0.9, 1, 0, -5, 4.8, 'ink'),
        carved([F[3]], 2, 0.6, 'gem'),
        disc(5.6, -4.5, 5, 5.2, 'accent', 1.6),
        disc(3.8, -4.5, 5, 6.1, 'gem', 0.5),
        ball(1.8, -4.5, 5, 6.3, 'accent'),
      ];
    case 'r':
      return [
        ...pedestal(),
        column(8.6, 8, 13.6, -8),
        ring(8.2, 0.6, -8, 'accent'),
        part(new CylinderGeometry(0.4 * S, 10.5 * S, 16.5 * S, 24), 'gem', at(0, -16.25)),
        column(0.5, 0.5, -24, -30, 0, 0, 8, 'ink'),
        block(6.5, 3.5, 0.4, 3.6, -27.5, 0, 'accent'),
        block(5, 5.6, 1.2, 0, 10.8, 8.2, 'ink'),
        block(3.2, 3.6, 1.2, 0, -0.5, 8.2, 'ink'),
      ];
    case 'n':
      return [
        ...pedestal(),
        part(horseHead(shapeFromEl(F[3]), 11, 2.8), 'body'),
        carved([F[1], F[2]], 3, 0.8, 'accent'),
        ball(1.3, -3, -10, 4.8, 'gem'),
        ball(1.3, -3, -10, -4.8, 'gem'),
        ball(0.7, -11, -7, 3, 'ink'),
      ];
    case 'b':
      return [
        ...pedestal(),
        part(
          latheOf([
            [0, 13.6],
            [8, 13.6],
            [5, 0],
            [3.6, -6],
            [0, -6],
          ]),
          'body',
        ),
        ball(3.6, 0, -8.5, 0, 'skin'),
        ...face(3.6, -8.5),
        part(new CylinderGeometry(2.6 * S, 0.3 * S, 6 * S, 16), 'hair', at(0, -5.5, 2.4)),
        column(7.5, 7.5, -11, -12, 0, 0, 32, 'gem'),
        part(
          new CylinderGeometry(0.3 * S, 5 * S, 16 * S, 24),
          'gem',
          at(0.8, -19.5),
          [0, 0, -0.12],
        ),
        ball(1.2, 1.5, -19, 3.6, 'accent'),
        column(0.8, 0.8, 13.6, -13, -9.3, 0, 8, 'ink'),
        ball(2.6, -9.3, -15.5, 0, 'light'),
      ];
    case 'q':
      return [
        ...pedestal(),
        carved([F[1]], 1.4, 0.4, 'gem', -3, 0.35),
        carved([F[2]], 1.4, 0.4, 'gem', -3, -0.35),
        part(
          latheOf([
            [0, 13.6],
            [9, 13.6],
            [6.5, 5],
            [4, 0],
            [3, -6],
            [0, -6],
          ]),
          'body',
        ),
        ring(3.3, 0.6, -4, 'accent'),
        ball(3.6, 0, -10, 0, 'skin'),
        ...face(3.6, -10),
        dome(3.8, 0, -10.5, 0, 'hair', 0.4),
        part(new CylinderGeometry(3.9 * S, 3.5 * S, 3.2 * S, 12, 1, true), 'accent', at(0, -14.2)),
        ball(1, 0, -14.5, 3.8, 'gem'),
      ];
    case 'k':
      return [
        ...pedestal(),
        part(
          latheOf([
            [0, 13.6],
            [10, 13.6],
            [7.5, 2],
            [6, -6],
            [0, -6],
          ]),
          'body',
        ),
        ring(7.4, 0.7, 2, 'accent'),
        ball(3.8, 0, -10, 0, 'skin'),
        ...face(3.8, -10),
        part(new CylinderGeometry(2.8 * S, 0.3 * S, 5.5 * S, 16), 'hair', at(0, -6.2, 2.6)),
        part(new CylinderGeometry(4.4 * S, 4 * S, 6 * S, 10, 1, true), 'accent', at(0, -16)),
        ball(1.1, 0, -15.5, 4.3, 'gem'),
        block(2, 7, 2, 0, -23.5, 0, 'accent'),
        block(6, 2, 2, 0, -25, 0, 'accent'),
        column(0.8, 0.8, 13.6, -12, 9.3, 0, 8, 'accent'),
        ball(2.5, 9.3, -14.2, 0, 'gem'),
      ];
  }
}

// ---- Sakura ------------------------------------------------------------------------

const stand = () => [column(11, 10, 18, 15, 0, 0, 32, 'ink')];
/** Five-petal blossom decal on the front of a body. */
const blossom = (x: number, y: number, z: number, r = 1.5) => [
  ...Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return disc(r * 0.75, x + Math.cos(a) * r, y + Math.sin(a) * r, z, 'bloom', 0.5);
  }),
  disc(r * 0.45, x, y, z + 0.2, 'accent', 0.5),
];

function sakura(kind: PieceKind): PiecePart[] {
  const K = SAKURA_SHAPES[kind];
  switch (kind) {
    case 'p':
      return [
        ...stand(),
        part(
          latheOf([
            [0, 15],
            [6, 15],
            [6.6, 8],
            [5.8, 1],
            [4, -3],
            [0, -3],
          ]),
          'body',
        ),
        ring(5.9, 0.8, 1, 'accent'),
        ...blossom(0, 7, 6.6),
        ball(6.2, 0, -9.5, 0, 'body'),
        dome(6.45, 0, -9.7, 0, 'hair', 0.42),
        block(1.6, 0.5, 0.5, -2.2, -8, 6, 'ink'),
        block(1.6, 0.5, 0.5, 2.2, -8, 6, 'ink'),
        ball(0.9, -3.4, -6.6, 5.3, 'bloom'),
        ball(0.9, 3.4, -6.6, 5.3, 'bloom'),
      ];
    case 'r':
      return [
        ...stand(),
        block(12, 29, 12, 0, 0.5, 0, 'body'),
        roof(4.5, 11, 4, 0.5, 'accent'),
        roof(4, 10, -5.5, -9, 'accent'),
        roof(3.4, 8.5, -14.5, -18, 'accent'),
        column(0.8, 0.8, -18, -27, 0, 0, 8, 'accent'),
        ball(1.6, 0, -27.2, 0, 'accent'),
        block(4, 8, 0.8, 0, 11, 6.2, 'ink'),
        block(3.2, 4, 0.8, 0, -1, 6.2, 'light'),
      ];
    case 'n':
      return [
        ...stand(),
        part(horseHead(shapeFromEl(K[2]), 11, 2.8), 'body'),
        part(new CylinderGeometry(0.2 * S, 1.4 * S, 6 * S, 10), 'body', at(3.5, -22.5)),
        ball(1.1, -2, -12.5, 4.9, 'ink'),
        ball(1.1, -2, -12.5, -4.9, 'ink'),
        column(0.4, 0.4, -2, -8, 6, 5, 8, 'accent'),
        ball(1.7, 6, -1.2, 5, 'accent'),
        ...blossom(3, -15, 5.4, 1.3),
      ];
    case 'b':
      return [
        ...stand(),
        column(3, 3, 15, 2.5),
        part(
          new CylinderGeometry(6 * Math.SQRT2 * S, 8 * Math.SQRT2 * S, 3.5 * S, 4),
          'body',
          at(0, 0.75),
          [0, Math.PI / 4, 0],
        ),
        block(11, 10, 11, 0, -6, 0, 'body'),
        block(6, 5, 11.4, 0, -6, 0, 'light'),
        block(11.4, 5, 6, 0, -6, 0, 'light'),
        roof(3, 11, -11, -17, 'accent'),
        ball(2.6, 0, -19.5, 0, 'body'),
        column(0.8, 0.8, -21.5, -24.5, 0, 0, 8, 'accent'),
        ...blossom(0, 9, 3.1, 1.2),
      ];
    case 'q':
      return [
        ...stand(),
        part(
          latheOf([
            [0, 15],
            [9, 15],
            [7, 6],
            [5, 0],
            [4, -4],
            [0, -4],
          ]),
          'body',
        ),
        column(5.6, 5.3, 4, 1, 0, 0, 24, 'accent'),
        ...blossom(-3.5, 9, 7.6),
        ...blossom(3.8, 11.5, 8.2, 1.2),
        ball(4.2, 0, -9, 0, 'skin'),
        ...face(4.2, -9, true),
        dome(4.45, 0, -9.3, 0, 'hair', 0.45),
        ball(3.3, 0, -15, 0, 'hair'),
        ball(2, -4.3, -13, 0, 'hair'),
        ball(2, 4.3, -13, 0, 'hair'),
        part(
          new CylinderGeometry(0.35 * S, 0.35 * S, 6.5 * S, 6),
          'accent',
          at(4.8, -17.8, 1),
          [0, 0, -1],
        ),
        ...blossom(7.8, -20, 1.6, 1.3),
      ];
    case 'k':
      return [
        ...stand(),
        column(6, 6, 15, -1),
        carved(
          [{ d: 'M-6,-1 L-12.5,-4 L-11.5,-6.5 L-4,-5 L4,-5 L11.5,-6.5 L12.5,-4 L6,-1 Z' }],
          8,
          1,
          'body',
        ),
        disc(2.6, 0, 3, 6.2, 'accent'),
        ...blossom(0, 3, 6.6, 1),
        ball(3.8, 0, -9.5, 0, 'skin'),
        ...face(3.8, -9.5),
        part(
          extruded(
            [shapeFromPath('M-3.5,-12 C-4,-20 0,-27 3.5,-28.5 C3,-22 4,-16 3.5,-12 Z')],
            5,
            1,
          ),
          'hat',
        ),
      ];
  }
}

/** Parts of a fantasy or sakura figure. */
export function figureParts(set: 'fantasy' | 'sakura', kind: PieceKind): PiecePart[] {
  return set === 'fantasy' ? fantasy(kind) : sakura(kind);
}
