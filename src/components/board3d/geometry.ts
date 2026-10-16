import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  SphereGeometry,
  Vector2,
  type BufferGeometry,
} from 'three';
import { STAUNTON_HORSE, STAUNTON_KNIGHT_FOOT, STAUNTON_PROFILES } from '../board/pieceArt/wood';
import type { Pt } from '../board/pieceArt/shared';
import type { PieceKind } from '../board/pieceShapes';

/**
 * 3D piece geometry, built in code from the same Staunton profiles as the 2D wood set
 * (no downloaded models): turned parts are lathes, the knight's head is the 2D horse
 * outline extruded. SVG units (y down, ground at y = 18) are scaled to world units.
 */

/** SVG unit → world unit: a king (~46 units) stands about 0.85 squares tall. */
const S = 1 / 54;
const SEGMENTS = 40;

/** One mesh of a piece: geometry plus its offset (world units). */
export interface PiecePart {
  geometry: BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const heightOf = (y: number) => (18 - y) * S;

function latheOf(profile: readonly Pt[]): BufferGeometry {
  const points = profile.map(([x, y]) => new Vector2(Math.max(x, 0.0001) * S, heightOf(y)));
  return new LatheGeometry(points, SEGMENTS);
}

/** The rook in 3D: a flat-topped tower (crenels are separate merlon blocks). */
const ROOK_TOWER: Pt[] = [...STAUNTON_PROFILES.r.slice(0, 9), [10.5, -14.5], [0, -14.5]];

/** Absolute M/L/C/Z path → three Shape in world units (y flipped up). */
function shapeFromPath(d: string): Shape {
  const shape = new Shape();
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  const num = () => Number(tokens[i++]);
  const pt = () => {
    const x = num();
    const y = num();
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
    } else if (cmd === 'Z') shape.closePath();
  }
  return shape;
}

function buildParts(kind: PieceKind): PiecePart[] {
  switch (kind) {
    case 'p':
      return [
        { geometry: latheOf(STAUNTON_PROFILES.p) },
        { geometry: new SphereGeometry(6.8 * S, 32, 24), position: [0, heightOf(-12.5), 0] },
      ];
    case 'r': {
      const merlon = new BoxGeometry(4.2 * S, 4 * S, 4.2 * S);
      const top = heightOf(-14.5) + 2 * S;
      const r = 8.4 * S;
      return [
        { geometry: latheOf(ROOK_TOWER) },
        ...[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          return {
            geometry: merlon,
            position: [Math.cos(a) * r, top, Math.sin(a) * r] as [number, number, number],
            rotation: [0, -a, 0] as [number, number, number],
          };
        }),
      ];
    }
    case 'n': {
      const head = new ExtrudeGeometry(shapeFromPath(STAUNTON_HORSE), {
        depth: 7 * S,
        bevelEnabled: true,
        bevelSize: 1.2 * S,
        bevelThickness: 1.2 * S,
        bevelSegments: 3,
        curveSegments: 16,
      });
      head.translate(0, 0, -3.5 * S);
      return [{ geometry: latheOf(STAUNTON_KNIGHT_FOOT) }, { geometry: head }];
    }
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
        {
          geometry: new BoxGeometry(3.6 * S, 9.5 * S, 3.6 * S),
          position: [0, heightOf(-23.25), 0],
        },
        { geometry: new BoxGeometry(9 * S, 3.4 * S, 3.4 * S), position: [0, heightOf(-23.8), 0] },
      ];
  }
}

const CACHE = new Map<PieceKind, PiecePart[]>();

/** Parts of a piece (built once per kind and shared by every piece). */
export function pieceParts(kind: PieceKind): PiecePart[] {
  let parts = CACHE.get(kind);
  if (!parts) {
    parts = buildParts(kind);
    CACHE.set(kind, parts);
  }
  return parts;
}

/** Thin disc marking a legal target; a ring marks a capture. */
export const TARGET_DOT = new CylinderGeometry(0.15, 0.15, 0.01, 24);
