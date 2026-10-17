import {
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  Float32BufferAttribute,
  SphereGeometry,
  Vector3,
} from 'three';
import { heightOf, S, type PiecePart, type Tone, type Vec3 } from './geoUtil';

/**
 * A rounded 3D horse for the knights: the neck and the head are lofted along curved
 * spines with oval cross-sections (wide side to side, deep front to back), so the knight
 * reads as a carved horse from every angle instead of an extruded slab.
 * Coordinates are the 2D art's SVG units (x right, y down, ground y = 18); the horse faces
 * −x like the 2D knights.
 */

/** A spine key point: position (svg units), in-plane half-size `a`, side half-width `b`. */
type Key = readonly [x: number, y: number, a: number, b: number];

/** Neck: from the foot up to the poll, leaning back like a Staunton knight. */
const NECK: Key[] = [
  [0.5, 13, 8.2, 5.4],
  [1, 7, 7.8, 5.1],
  [2.5, 1, 7.4, 4.7],
  [3.4, -5, 6.9, 4.3],
  [3, -11, 6, 3.9],
  [1.6, -16, 5, 3.6],
  [0.6, -19.5, 3.6, 3.2],
  [0.2, -21.3, 1.6, 1.6],
];

/** Head: from the forehead down to the muzzle. */
const HEAD: Key[] = [
  [0.5, -17.5, 4.4, 3.6],
  [-3.5, -13.5, 4.5, 3.5],
  [-7.5, -9, 4, 3.1],
  [-10.6, -5.6, 3.4, 2.8],
  [-12.4, -3.6, 2.6, 2.3],
  [-13.3, -2.7, 1, 1],
];

export interface HorseStyle {
  /** Sides of each cross-section: many for smooth sets, 6/8 for faceted ones. */
  sides: number;
  /** Uniform scale (slimmer cast or chunkier figure horses). */
  scale?: number;
  /** Svg height where the neck starts (top of the set's foot). */
  base?: number;
  /** Tone of the eyes and nostrils. */
  eyeTone?: Tone;
  /** Tone of the mane ridge (default: body). */
  maneTone?: Tone;
}

interface Ring {
  centre: Vector3;
  /** In-plane unit normal (perpendicular to the spine in the side view). */
  normal: Vector3;
  a: number;
  b: number;
}

/** Smooth rings along a spine (Catmull-Rom through the keys, sizes eased between them). */
function rings(keys: readonly Key[], samples: number, k: number, lift: number): Ring[] {
  const pts = keys.map(([x, y]) => new Vector3(x * k, y + lift, 0));
  const curve = new CatmullRomCurve3(pts, false, 'centripetal');
  const out: Ring[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const centre = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const normal = new Vector3(-tangent.y, tangent.x, 0).normalize();
    const f = t * (keys.length - 1);
    const j = Math.min(Math.floor(f), keys.length - 2);
    const u = f - j;
    const e = u * u * (3 - 2 * u);
    const a = (keys[j][2] + (keys[j + 1][2] - keys[j][2]) * e) * k;
    const b = (keys[j][3] + (keys[j + 1][3] - keys[j][3]) * e) * k;
    out.push({ centre, normal, a, b });
  }
  return out;
}

/** Tube through the rings, closed at both ends, converted to world units. */
function loft(rs: readonly Ring[], sides: number): BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const toWorld = (v: Vector3) => [v.x * S, heightOf(v.y), v.z * S];
  rs.forEach((r, i) => {
    for (let s = 0; s < sides; s++) {
      // Mirrored around the ring, so the surface texture wraps without a seam.
      uv.push(Math.abs((2 * s) / sides - 1), i / (rs.length - 1));
      const th = (s / sides) * Math.PI * 2;
      const v = r.centre
        .clone()
        .addScaledVector(r.normal, Math.cos(th) * r.a)
        .add(new Vector3(0, 0, Math.sin(th) * r.b));
      pos.push(...toWorld(v));
    }
  });
  for (let i = 0; i < rs.length - 1; i++) {
    for (let s = 0; s < sides; s++) {
      const a = i * sides + s;
      const b = i * sides + ((s + 1) % sides);
      const c = a + sides;
      const d = b + sides;
      idx.push(a, c, b, b, c, d);
    }
  }
  // Caps: a centre vertex fanned to the first and the last ring.
  const first = pos.length / 3;
  pos.push(...toWorld(rs[0].centre));
  const last = first + 1;
  pos.push(...toWorld(rs[rs.length - 1].centre));
  uv.push(0, 0, 0, 1);
  const end = (rs.length - 1) * sides;
  for (let s = 0; s < sides; s++) {
    const n = (s + 1) % sides;
    idx.push(first, s, n);
    idx.push(last, end + n, end + s);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const at = (v: Vector3, z = 0): Vec3 => [v.x * S, heightOf(v.y), z * S];

/** The horse (neck, head, cheeks, ears, mane, eyes, nostrils) standing on `base`. */
export function horseParts(style: HorseStyle): PiecePart[] {
  const k = style.scale ?? 1;
  const lift = (style.base ?? 13) - 13;
  const smooth = style.sides >= 12;
  const neck = rings(NECK, 28, k, lift);
  const head = rings(HEAD, 22, k, lift);
  const parts: PiecePart[] = [
    { geometry: loft(neck, style.sides) },
    { geometry: loft(head, style.sides) },
  ];

  // Round jowls where the head meets the neck.
  const jowl = new SphereGeometry(1, smooth ? 20 : style.sides, smooth ? 14 : 4);
  jowl.scale(4.2 * k * S, 4.6 * k * S, 3.7 * k * S);
  parts.push({ geometry: jowl, position: at(new Vector3(-1.8 * k, -12.8 + lift, 0)) });

  // Ears, pricked and leaning back a little.
  const ear = new ConeGeometry(1.3 * k * S, 4.6 * k * S, smooth ? 12 : 4);
  for (const z of [-1.7, 1.7]) {
    parts.push({
      geometry: ear,
      position: at(new Vector3(1.6 * k, -22.6 + lift, 0), z * k),
      rotation: [z * 0.08, 0, -0.35],
    });
  }

  // Mane: a ridge along the back of the neck, from the poll down to the withers.
  const mane = neck.slice(6, 25).map((r): Key => {
    const back = r.centre.clone().addScaledVector(r.normal, r.a - 0.7 * k);
    return [back.x / k, back.y - lift, 1.6, 1.1];
  });
  parts.push({
    geometry: loft(rings(mane, 18, k, lift), smooth ? 10 : style.sides),
    tone: style.maneTone,
  });

  // Eyes on both cheeks and nostrils at the muzzle.
  const eyeTone = style.eyeTone ?? 'ink';
  const eye = new SphereGeometry(0.95 * k * S, 12, 8);
  const eyeAt = head[5];
  const eyeC = eyeAt.centre.clone().addScaledVector(eyeAt.normal, eyeAt.a * 0.35);
  const nostril = new SphereGeometry(0.6 * k * S, 10, 6);
  const nose = head[19];
  const noseC = nose.centre.clone().addScaledVector(nose.normal, -nose.a * 0.1);
  for (const side of [-1, 1]) {
    parts.push({ geometry: eye, tone: eyeTone, position: at(eyeC, side * eyeAt.b * 0.86) });
    parts.push({ geometry: nostril, tone: eyeTone, position: at(noseC, side * nose.b * 0.62) });
  }
  return parts;
}
