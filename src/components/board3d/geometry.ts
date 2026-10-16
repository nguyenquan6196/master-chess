import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  OctahedronGeometry,
  Shape,
  SphereGeometry,
  Vector2,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ConcretePieceSet } from '@/core/profile/settingsOptions';
import { FANTASY_SHAPES } from '../board/pieceArt/fantasy';
import { MARBLE_KNIGHT, MARBLE_PROFILES } from '../board/pieceArt/marble';
import { MIDNIGHT_KNIGHT, MIDNIGHT_PROFILES } from '../board/pieceArt/midnight';
import { SPRITES } from '../board/pieceArt/pixel';
import { RESIN_HORSE, RESIN_KNIGHT_FOOT, RESIN_PROFILES } from '../board/pieceArt/resin';
import { SAKURA_SHAPES } from '../board/pieceArt/sakura';
import type { Pt, ShapeEl } from '../board/pieceArt/shared';
import { STAUNTON_HORSE, STAUNTON_KNIGHT_FOOT, STAUNTON_PROFILES } from '../board/pieceArt/wood';
import type { PieceKind } from '../board/pieceShapes';

/**
 * 3D piece geometry, built in code from the 2D sets' own shapes (no downloaded models),
 * so each theme's pieces keep their look in 3D:
 * - classic / wood / neon: turned Staunton lathes (neon is drawn as a glowing wireframe),
 * - resin: the slim cast Staunton profiles,
 * - marble: the same lathe cut with 8 sides (faceted stone), diamond finials,
 * - midnight: 6-sided Art Deco lathes, diamond pawn heads,
 * - pixel: voxels built from the 12×12 sprites,
 * - fantasy / sakura: the character silhouettes extruded into carved figures.
 * SVG units (y down, ground at y = 18) are scaled to world units.
 */

/** SVG unit → world unit: a king (~46 units) stands about 0.85 squares tall. */
const S = 1 / 54;
const ROUND = 40;

/** One mesh of a piece: geometry plus its offset (world units). */
export interface PiecePart {
  geometry: BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

type Vec3 = [number, number, number];
const heightOf = (y: number) => (18 - y) * S;

function latheOf(profile: readonly Pt[], sides = ROUND): BufferGeometry {
  const points = profile.map(([x, y]) => new Vector2(Math.max(x, 0.0001) * S, heightOf(y)));
  return new LatheGeometry(points, sides);
}

/** A profile cut flat at `topY` (replacing its crenellated top) for merlon towers. */
function flatTop(profile: readonly Pt[], keep: number, rimX: number, topY: number): Pt[] {
  return [...profile.slice(0, keep), [rimX, topY], [0, topY]];
}

/** Four merlons standing on a tower's rim. */
function merlons(radius: number, topY: number, size: number, height: number): PiecePart[] {
  const block = new BoxGeometry(size * S, height * S, size * S);
  return [0, 1, 2, 3].map((i) => {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    return {
      geometry: block,
      position: [
        Math.cos(a) * radius * S,
        heightOf(topY) + (height / 2) * S,
        Math.sin(a) * radius * S,
      ] as Vec3,
      rotation: [0, -a, 0] as Vec3,
    };
  });
}

function box(w: number, h: number, d: number, cy: number): PiecePart {
  return { geometry: new BoxGeometry(w * S, h * S, d * S), position: [0, heightOf(cy), 0] };
}

/** Absolute M/L/C/Q/Z path → three Shape in world units (y flipped up). */
function shapeFromPath(d: string): Shape {
  const shape = new Shape();
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  const pt = () => {
    const x = Number(tokens[i++]);
    const y = Number(tokens[i++]);
    return [x * S, heightOf(y)] as const;
  };
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') shape.moveTo(...pt());
    else if (cmd === 'L') shape.lineTo(...pt());
    else if (cmd === 'C') {
      const a = pt();
      const b = pt();
      const c = pt();
      shape.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]);
    } else if (cmd === 'Q') {
      const a = pt();
      const b = pt();
      shape.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    } else if (cmd === 'Z') shape.closePath();
  }
  return shape;
}

function shapeFromPoints(points: readonly Pt[]): Shape {
  return new Shape(points.map(([x, y]) => new Vector2(x * S, heightOf(y))));
}

function shapeFromEl(e: ShapeEl): Shape {
  if ('d' in e) return shapeFromPath(e.d);
  const shape = new Shape();
  if ('circle' in e) {
    const [cx, cy, r] = e.circle;
    shape.absarc(cx * S, heightOf(cy), r * S, 0, Math.PI * 2, false);
  } else {
    const [cx, cy, rx, ry] = e.ellipse;
    shape.absellipse(cx * S, heightOf(cy), rx * S, ry * S, 0, Math.PI * 2, false, 0);
  }
  return shape;
}

/** Extrude flat shapes `depth` SVG units thick, centred on z = 0, merged into one mesh. */
function extruded(shapes: readonly Shape[], depth: number, bevel: number): BufferGeometry {
  const parts = shapes.map((shape) => {
    const g = new ExtrudeGeometry(shape, {
      depth: depth * S,
      bevelEnabled: bevel > 0,
      bevelSize: bevel * S,
      bevelThickness: bevel * S,
      bevelSegments: 2,
      curveSegments: 12,
    });
    g.translate(0, 0, (-depth / 2) * S);
    return g;
  });
  return mergeGeometries(parts) ?? parts[0];
}

/** Voxel piece from a 12×12 sprite: each filled pixel is a cube, two cubes deep. */
function voxels(rows: readonly string[]): BufferGeometry {
  const PX = 3.2;
  const lowest = Math.max(...rows.map((r, i) => (r.includes('X') ? i : -1)));
  const cubes: BufferGeometry[] = [];
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch !== 'X') return;
      for (const layer of [-0.5, 0.5]) {
        const cube = new BoxGeometry(PX * S, PX * S, PX * S);
        cube.translate((c - 5.5) * PX * S, (lowest - r + 0.5) * PX * S, layer * PX * S);
        cubes.push(cube);
      }
    });
  });
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

function figures(shapes: Record<PieceKind, ShapeEl[]>, kind: PieceKind): PiecePart[] {
  return [{ geometry: extruded(shapes[kind].map(shapeFromEl), 8, 1) }];
}

function build(set: ConcretePieceSet, kind: PieceKind): PiecePart[] {
  switch (set) {
    case 'resin':
      return resin(kind);
    case 'marble':
      return marble(kind);
    case 'midnight':
      return midnight(kind);
    case 'pixel':
      return [{ geometry: voxels(SPRITES[kind]) }];
    case 'fantasy':
      return figures(FANTASY_SHAPES, kind);
    case 'sakura':
      return figures(SAKURA_SHAPES, kind);
    default:
      return staunton(kind);
  }
}

const CACHE = new Map<string, PiecePart[]>();

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
