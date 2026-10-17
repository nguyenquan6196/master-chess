import {
  BoxGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  Vector2,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Pt, ShapeEl } from '../board/pieceArt/shared';

/**
 * Shared helpers for building 3D pieces from the 2D sets' SVG-space data (y down,
 * ground at y = 18), scaled to world units.
 */

/** Which palette colour a part is painted with (see `TONES` in materials.ts). */
export type Tone = 'body' | 'accent' | 'gem' | 'skin' | 'hair' | 'ink' | 'bloom' | 'light' | 'hat';

export const S = 1 / 54;
export const ROUND = 40;

/** One mesh of a piece: geometry plus its offset (world units). */
export interface PiecePart {
  geometry: BufferGeometry;
  /** Palette colour (default: the piece's base material). */
  tone?: Tone;
  /** The geometry carries per-vertex colours (pixel voxels). */
  vertexColors?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export type Vec3 = [number, number, number];
export const heightOf = (y: number) => (18 - y) * S;

export function latheOf(profile: readonly Pt[], sides = ROUND): BufferGeometry {
  const points = profile.map(([x, y]) => new Vector2(Math.max(x, 0.0001) * S, heightOf(y)));
  return new LatheGeometry(points, sides);
}

/** A profile cut flat at `topY` (replacing its crenellated top) for merlon towers. */
export function flatTop(profile: readonly Pt[], keep: number, rimX: number, topY: number): Pt[] {
  return [...profile.slice(0, keep), [rimX, topY], [0, topY]];
}

/** Four merlons standing on a tower's rim. */
export function merlons(radius: number, topY: number, size: number, height: number): PiecePart[] {
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

export function box(w: number, h: number, d: number, cy: number): PiecePart {
  return { geometry: new BoxGeometry(w * S, h * S, d * S), position: [0, heightOf(cy), 0] };
}

/** Absolute M/L/C/Q/Z path → three Shape in world units (y flipped up). */
export function shapeFromPath(d: string): Shape {
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

export function shapeFromPoints(points: readonly Pt[]): Shape {
  return new Shape(points.map(([x, y]) => new Vector2(x * S, heightOf(y))));
}

export function shapeFromEl(e: ShapeEl): Shape {
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
export function extruded(shapes: readonly Shape[], depth: number, bevel: number): BufferGeometry {
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
