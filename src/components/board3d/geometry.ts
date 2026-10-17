import {
  BoxGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  OctahedronGeometry,
  SphereGeometry,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ConcretePieceSet } from '@/core/profile/settingsOptions';
import { MARBLE_KNIGHT, MARBLE_PROFILES } from '../board/pieceArt/marble';
import { MIDNIGHT_KNIGHT, MIDNIGHT_PROFILES } from '../board/pieceArt/midnight';
import { PIXEL_PALETTE, spriteCells, SPRITES } from '../board/pieceArt/pixel';
import { RESIN_HORSE, RESIN_KNIGHT_FOOT, RESIN_PROFILES } from '../board/pieceArt/resin';
import type { Pt } from '../board/pieceArt/shared';
import { STAUNTON_HORSE, STAUNTON_KNIGHT_FOOT, STAUNTON_PROFILES } from '../board/pieceArt/wood';
import type { PieceKind } from '../board/pieceShapes';
import { figureParts } from './figures';
import {
  box,
  extruded,
  flatTop,
  heightOf,
  latheOf,
  merlons,
  S,
  shapeFromPath,
  shapeFromPoints,
  type PiecePart,
} from './geoUtil';

export type { PiecePart } from './geoUtil';

/**
 * 3D piece geometry, built in code from the 2D sets' own shapes (no downloaded models),
 * so each theme's pieces keep their look in 3D:
 * - classic / wood / neon: turned Staunton lathes (neon is drawn as a glowing wireframe),
 * - resin: the slim cast Staunton profiles,
 * - marble: the same lathe cut with 8 sides (faceted stone), diamond finials,
 * - midnight: 6-sided Art Deco lathes, diamond pawn heads,
 * - pixel: voxels from the 12×12 sprites, painted with the sprite's outline and shade,
 * - fantasy / sakura: round multi-part figures (figures.ts).
 * Surfaces (grain, veins, swirls, brushed metal) come from textures.ts.
 */

/**
 * Voxel piece from a 12×12 sprite: every cell (fill, shade and the derived outline) is a
 * cube, two cubes deep, coloured like the 2D sprite.
 */
function voxels(rows: readonly string[], white: boolean): BufferGeometry {
  const PX = 3.2;
  const pal = white ? PIXEL_PALETTE.white : PIXEL_PALETTE.black;
  const cells = spriteCells(rows);
  const lowest = Math.max(...cells.map((c) => c.y));
  const cubes: BufferGeometry[] = [];
  for (const cell of cells) {
    const hex = parseInt(pal[cell.t].slice(1), 16);
    // Vertex colours are linear; the palette is sRGB.
    const rgb = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => (v / 255) ** 2.2);
    for (const layer of [-0.5, 0.5]) {
      const cube = new BoxGeometry(PX * S, PX * S, PX * S).toNonIndexed();
      cube.translate((cell.x - 6.5) * PX * S, (lowest - cell.y + 0.5) * PX * S, layer * PX * S);
      const n = cube.getAttribute('position').count;
      cube.setAttribute(
        'color',
        new Float32BufferAttribute(Array.from({ length: n }, () => rgb).flat(), 3),
      );
      cubes.push(cube);
    }
  }
  return mergeGeometries(cubes) ?? cubes[0];
}

// ---- Sets --------------------------------------------------------------------------

function staunton(kind: PieceKind): PiecePart[] {
  switch (kind) {
    case 'p':
      return [
        { geometry: latheOf(STAUNTON_PROFILES.p) },
        { geometry: new SphereGeometry(6.8 * S, 32, 24), position: [0, heightOf(-12.5), 0] },
      ];
    case 'r':
      return [
        { geometry: latheOf(flatTop(STAUNTON_PROFILES.r, 9, 10.5, -14.5)) },
        ...merlons(8.4, -14.5, 4.2, 4),
      ];
    case 'n':
      return [
        { geometry: latheOf(STAUNTON_KNIGHT_FOOT) },
        { geometry: extruded([shapeFromPath(STAUNTON_HORSE)], 7, 1.2) },
      ];
    case 'b':
      return [
        { geometry: latheOf(STAUNTON_PROFILES.b) },
        { geometry: new SphereGeometry(2.4 * S, 16, 12), position: [0, heightOf(-25), 0] },
      ];
    case 'q':
      return [
        { geometry: latheOf(STAUNTON_PROFILES.q) },
        { geometry: new SphereGeometry(2.6 * S, 16, 12), position: [0, heightOf(-23), 0] },
      ];
    case 'k':
      return [
        { geometry: latheOf(STAUNTON_PROFILES.k) },
        box(3.6, 9.5, 3.6, -23.25),
        box(9, 3.4, 3.4, -23.8),
      ];
  }
}

function resin(kind: PieceKind): PiecePart[] {
  switch (kind) {
    case 'p':
      return [
        { geometry: latheOf(RESIN_PROFILES.p) },
        { geometry: new SphereGeometry(5.6 * S, 32, 24), position: [0, heightOf(-10), 0] },
      ];
    case 'r':
      return [
        { geometry: latheOf(flatTop(RESIN_PROFILES.r, 8, 8.5, -15)) },
        ...merlons(6.8, -15, 3.2, 3),
      ];
    case 'n':
      return [
        { geometry: latheOf(RESIN_KNIGHT_FOOT) },
        { geometry: extruded([shapeFromPath(RESIN_HORSE)], 6, 1) },
      ];
    case 'b':
      return [
        { geometry: latheOf(RESIN_PROFILES.b) },
        { geometry: new SphereGeometry(2 * S, 16, 12), position: [0, heightOf(-25), 0] },
      ];
    case 'q':
      return [
        { geometry: latheOf(RESIN_PROFILES.q) },
        { geometry: new SphereGeometry(2.3 * S, 16, 12), position: [0, heightOf(-24.5), 0] },
      ];
    case 'k':
      return [
        { geometry: latheOf(RESIN_PROFILES.k) },
        box(2.8, 9, 2.8, -23.5),
        box(8, 2.8, 2.8, -24.1),
      ];
  }
}

function marble(kind: PieceKind): PiecePart[] {
  const cut = (profile: readonly Pt[]) => latheOf(profile, 8);
  switch (kind) {
    case 'p':
      return [
        { geometry: cut(MARBLE_PROFILES.p) },
        { geometry: new SphereGeometry(7 * S, 8, 4), position: [0, heightOf(-11), 0] },
      ];
    case 'r':
      return [
        { geometry: cut(flatTop(MARBLE_PROFILES.r, 7, 12, -15)) },
        ...merlons(9.4, -15, 4.6, 4),
      ];
    case 'n':
      return [{ geometry: extruded([shapeFromPoints(MARBLE_KNIGHT)], 9, 0.5) }];
    case 'b':
      return [
        { geometry: cut(MARBLE_PROFILES.b) },
        { geometry: new OctahedronGeometry(2.8 * S), position: [0, heightOf(-26), 0] },
      ];
    case 'q':
      return [
        { geometry: cut(MARBLE_PROFILES.q) },
        { geometry: new OctahedronGeometry(3 * S), position: [0, heightOf(-23.5), 0] },
      ];
    case 'k':
      return [
        { geometry: cut(MARBLE_PROFILES.k) },
        box(3.6, 11, 3.6, -23.5),
        box(9, 3.5, 3.6, -24.25),
      ];
  }
}

function midnight(kind: PieceKind): PiecePart[] {
  const cut = (profile: readonly Pt[]) => latheOf(profile, 6);
  switch (kind) {
    case 'p':
      return [
        { geometry: cut(MIDNIGHT_PROFILES.p) },
        { geometry: new OctahedronGeometry(5.6 * S), position: [0, heightOf(-8.5), 0] },
      ];
    case 'r':
      return [{ geometry: cut(MIDNIGHT_PROFILES.r) }];
    case 'n':
      return [{ geometry: extruded([shapeFromPoints(MIDNIGHT_KNIGHT)], 7, 0.4) }];
    case 'b':
      return [{ geometry: cut(MIDNIGHT_PROFILES.b) }];
    case 'q':
      return [{ geometry: cut(MIDNIGHT_PROFILES.q) }];
    case 'k': {
      const body = MIDNIGHT_PROFILES.k.slice(
        0,
        MIDNIGHT_PROFILES.k.findIndex(([x, y]) => x === 2 && y === -19) + 1,
      );
      return [{ geometry: cut([...body, [0, -19]]) }, box(4, 9, 4, -23.5), box(10, 3, 4, -22.5)];
    }
  }
}

function build(set: ConcretePieceSet, kind: PieceKind): PiecePart[] {
  switch (set) {
    case 'resin':
      return resin(kind);
    case 'marble':
      return marble(kind);
    case 'midnight':
      return midnight(kind);
    case 'fantasy':
    case 'sakura':
      return figureParts(set, kind);
    default:
      return staunton(kind);
  }
}

const CACHE = new Map<string, PiecePart[]>();
const VOXELS = new Map<string, PiecePart[]>();

/** Pixel pieces carry their colours in the geometry, so they differ per side. */
export function pixelParts(kind: PieceKind, white: boolean): PiecePart[] {
  const key = `${kind}-${white}`;
  let parts = VOXELS.get(key);
  if (!parts) {
    parts = [{ geometry: voxels(SPRITES[kind], white), vertexColors: true }];
    VOXELS.set(key, parts);
  }
  return parts;
}

/** Parts of a piece of `set` (built once per set and kind, shared by every piece). */
export function pieceParts(set: ConcretePieceSet, kind: PieceKind): PiecePart[] {
  const key = `${set}-${kind}`;
  let parts = CACHE.get(key);
  if (!parts) {
    parts = build(set, kind);
    CACHE.set(key, parts);
  }
  return parts;
}

/** Thin disc marking a legal target; a ring marks a capture. */
export const TARGET_DOT = new CylinderGeometry(0.15, 0.15, 0.01, 24);
