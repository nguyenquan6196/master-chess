'use client';

import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Vector3,
  type BufferGeometry,
  type Group,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ALL_SQUARES,
  isForwardSlide,
  isLightSquare,
  moveSlides,
  piecesFromFen,
  slidePosition,
  squareToWorld,
  worldToSquare,
  type BoardPiece,
  type Slide,
} from '@/core/board3d/board3d';
import { frameRateVerdict } from '@/core/board3d/perf';
import type { ConcretePieceSet } from '@/core/profile/settingsOptions';
import { cn } from '../ui/cn';
import { pieceParts, pixelParts, TARGET_DOT } from './geometry';
import { PIECE_MATERIALS, PIECE_SURFACE, TONES } from './materials';
import { surfaceTexture, type SurfaceKind } from './textures';
import { useThemeColors, type ThemeColor } from './themeColors';

export type CameraPreset = 'angle' | 'top' | 'low';
export const CAMERA_PRESETS: readonly CameraPreset[] = ['angle', 'top', 'low'];

export interface Board3DLabels {
  camera: Record<CameraPreset, string>;
  to2d: string;
}

export type Mark3D = 'hint' | 'selected' | 'correct' | 'wrong' | 'missed';

export interface Board3DProps {
  fen: string;
  orientation: 'white' | 'black';
  lastMove?: { from: string; to: string } | null;
  selected: string | null;
  targets: readonly string[];
  checked: string | null;
  marks?: Record<string, Mark3D>;
  arrows?: { from: string; to: string }[];
  pieceSet: ConcretePieceSet;
  /** The board's painted surface (wood grain, marble, agate…), from the theme. */
  boardSurface: SurfaceKind;
  /** Duration of one move animation; 0 = no animation. */
  moveMs: number;
  /** Whether squares react to clicks (a side can move, or squares can be selected). */
  interactive: boolean;
  onSquareClick: (square: string) => void;
  /** Drag and drop: which squares hold a piece the player may pick up. */
  canDrag: (square: string) => boolean;
  /** A piece was picked up (show its moves). */
  onSelect: (square: string) => void;
  /** A dragged piece was dropped on another square. */
  onDrop: (from: string, to: string) => void;
  /** The scene runs too slowly on this device (ChessBoard falls back to 2D). */
  onSlow?: () => void;
  labels: Board3DLabels;
  onTo2d?: () => void;
}

/** Camera positions per preset, for White (Black mirrors z). */
const PRESET_POSITION: Record<CameraPreset, [number, number, number]> = {
  angle: [0, 10.4, 9.4],
  top: [0, 15, 0.01],
  low: [0, 5.6, 12.6],
};
/** Pixels the pointer may move between press and release and still count as a click. */
const CLICK_SLOP_PX = 5;
/** Moves look rushed in 3D at 2D speed; stretch them a little. */
const MOVE_SLOWDOWN = 2;
const BOARD_TOP = 0;
const OVERLAY_Y = BOARD_TOP + 0.004;
/** How high a dragged piece floats above the board. */
const DRAG_LIFT = 0.35;
/** The board's surface, for turning the pointer ray into a board position. */
const GROUND = new Plane(new Vector3(0, 1, 0), 0);

/** Four looks per square colour, spread over the board so the pattern doesn't repeat. */
function squareVariant(square: string): number {
  return (square.charCodeAt(0) * 7 + Number(square[1]) * 3) % 4;
}

interface Drag {
  from: string;
  x: number;
  z: number;
}

function presetPosition(preset: CameraPreset, flip: boolean): Vector3 {
  const [x, y, z] = PRESET_POSITION[preset];
  return new Vector3(x, y, flip ? -z : z);
}

interface Anim {
  slides: Slide[];
  start: number | null;
}

/** Orbit controls plus a smooth glide to the chosen preset. */
/** Points that must stay in frame: the board frame's corners and the far pieces' tops. */
const FIT_POINTS = [-1, 1].flatMap((sx) =>
  [-1, 1].flatMap((sz) => [
    new Vector3(4.6 * sx, 0, 4.6 * sz),
    new Vector3(4.6 * sx, -0.75, 4.6 * sz),
    new Vector3(3.8 * sx, 0.95, 3.8 * sz),
  ]),
);
/** How close to the canvas edge (normalised device coords) the board may come. */
const FIT_MARGIN = 0.94;

/** Camera position along the preset's direction, just far enough to show the whole board. */
function fittedPosition(fov: number, aspect: number, preset: CameraPreset, flip: boolean): Vector3 {
  const dir = presetPosition(preset, flip).normalize();
  const probe = new PerspectiveCamera(fov, aspect, 0.1, 200);
  const fits = (d: number) => {
    probe.position.copy(dir).multiplyScalar(d);
    probe.lookAt(0, 0, 0);
    probe.updateMatrixWorld();
    probe.updateProjectionMatrix();
    return FIT_POINTS.every((p) => {
      const v = p.clone().project(probe);
      return Math.abs(v.x) <= FIT_MARGIN && Math.abs(v.y) <= FIT_MARGIN && v.z < 1;
    });
  };
  let near = 4;
  let far = 60;
  for (let i = 0; i < 24; i++) {
    const mid = (near + far) / 2;
    if (fits(mid)) far = mid;
    else near = mid;
  }
  return dir.multiplyScalar(far);
}

/** Orbit controls plus a smooth glide to the chosen preset (fitted to the canvas). */
function CameraRig({
  preset,
  flip,
  controlsRef,
}: {
  preset: CameraPreset;
  flip: boolean;
  /** Shared so dragging a piece can pause orbiting. */
  controlsRef: RefObject<OrbitControls | null>;
}) {
  const { camera, gl, size } = useThree();
  const goal = useRef<Vector3 | null>(null);
  const placed = useRef(false);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enablePan = false;
    c.enableDamping = true;
    c.minDistance = 6;
    c.maxDistance = 30;
    c.maxPolarAngle = 1.35;
    controlsRef.current = c;
    return () => c.dispose();
  }, [camera, gl, controlsRef]);

  useEffect(() => {
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 38;
    const target = fittedPosition(fov, size.width / Math.max(1, size.height), preset, flip);
    if (!placed.current) {
      // First frame: start in place instead of gliding in.
      camera.position.copy(target);
      placed.current = true;
    } else {
      goal.current = target;
    }
  }, [camera, preset, flip, size.width, size.height]);

  useFrame(() => {
    if (goal.current) {
      camera.position.lerp(goal.current, 0.14);
      if (camera.position.distanceTo(goal.current) < 0.01) goal.current = null;
    }
    controlsRef.current?.update();
  });
  return null;
}

/** Measures the frame rate once and reports when the device is too slow for 3D. */
function FpsWatch({ onSlow }: { onSlow: () => void }) {
  const frames = useRef<number[]>([]);
  const done = useRef(false);
  useFrame((_, delta) => {
    if (done.current) return;
    frames.current.push(delta);
    const verdict = frameRateVerdict(frames.current);
    if (verdict === 'pending') return;
    done.current = true;
    if (verdict === 'slow') onSlow();
  });
  return null;
}

/** Per-kind phase offsets so the neon tubes don't all pulse in sync (as in 2D). */
const NEON_PHASE: Record<BoardPiece['type'], number> = {
  p: 0,
  r: 0.5,
  n: 1.1,
  b: 0.8,
  q: 1.6,
  k: 0.3,
};
const NEON_PERIOD_S = 2.6;
/** Reduced motion: neon glows steadily instead of pulsing. */
const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 0…1 brightness of a neon tube: a slow breath with a quick flicker (2D `mc-neon-pulse`). */
function neonPulse(t: number): number {
  const f = (t % NEON_PERIOD_S) / NEON_PERIOD_S;
  if (f > 0.45 && f < 0.51) return f < 0.48 ? 0.15 : 0.95;
  return 0.5 - 0.5 * Math.cos(f * Math.PI * 2);
}

/** Outline edges of a geometry (cached): the glowing tube lines of the neon set. */
const EDGES = new WeakMap<BufferGeometry, EdgesGeometry>();
function edgesOf(g: BufferGeometry): EdgesGeometry {
  let e = EDGES.get(g);
  if (!e) {
    e = new EdgesGeometry(g, 28);
    EDGES.set(g, e);
  }
  return e;
}

function Piece({
  piece,
  anim,
  drag,
  moveMs,
  set,
  flip,
}: {
  piece: BoardPiece;
  anim: RefObject<Anim | null>;
  drag: RefObject<Drag | null>;
  moveMs: number;
  set: ConcretePieceSet;
  /** Board seen from Black's side. */
  flip: boolean;
}) {
  const ref = useRef<Group>(null);
  const home = squareToWorld(piece.square);
  const side = piece.color === 'w' ? 'white' : 'black';
  const base = PIECE_MATERIALS[set][side];
  const surface = PIECE_SURFACE[set];
  const parts =
    set === 'pixel' ? pixelParts(piece.type, piece.color === 'w') : pieceParts(set, piece.type);
  // White's knights look left (as in 2D), Black's mirror them.
  // Character figures face whoever sits at the bottom of the board; on turned (Staunton)
  // sets White's knights look left as in 2D and Black's mirror them.
  const figure = set === 'fantasy' || set === 'sakura';
  const turn = figure
    ? flip
      ? Math.PI
      : 0
    : piece.type === 'n' && piece.color === 'b'
      ? Math.PI
      : 0;

  // Neon: glass body + glowing edges that breathe with a flicker, like the 2D tubes.
  const neon = set === 'outline';
  const pulse = neon && !REDUCED_MOTION;
  const glow = useRef<(MeshStandardMaterial | LineBasicMaterial | null)[]>([]);

  useFrame(({ clock }) => {
    if (pulse) {
      const k = neonPulse(clock.elapsedTime + NEON_PHASE[piece.type]);
      for (const m of glow.current) {
        if (m instanceof MeshStandardMaterial) m.emissiveIntensity = 0.12 + 0.4 * k;
        else if (m) m.opacity = 0.45 + 0.55 * k;
      }
    }
    const g = ref.current;
    if (!g) return;
    const d = drag.current;
    if (d && d.from === piece.square) {
      g.position.set(d.x, DRAG_LIFT, d.z);
      return;
    }
    const a = anim.current;
    const slide = a?.slides.find((s) => s.to === piece.square);
    if (!a || !slide || moveMs <= 0) {
      g.position.set(home.x, 0, home.z);
      return;
    }
    a.start ??= clock.elapsedTime;
    const t = ((clock.elapsedTime - a.start) * 1000) / moveMs;
    const p = slidePosition(slide, t, piece.type === 'n');
    g.position.set(p.x, p.y, p.z);
  });

  return (
    <group ref={ref} position={[home.x, 0, home.z]} rotation={[0, turn, 0]}>
      {parts.map((part, i) => {
        const mat = (part.tone && TONES[set]?.[side][part.tone]) || base;
        // The body gets the set's painted surface; small coloured parts stay plain.
        const map =
          surface && !part.tone
            ? surfaceTexture(surface, mat.color, piece.color === 'w' ? 0 : 1)
            : null;
        if (neon) {
          return (
            <group key={i} position={part.position} rotation={part.rotation}>
              <mesh geometry={part.geometry}>
                <meshStandardMaterial
                  ref={(m) => {
                    glow.current[i * 2] = m;
                  }}
                  color={mat.color}
                  emissive={mat.emissive ?? '#000000'}
                  emissiveIntensity={0.3}
                  roughness={0.2}
                  transparent
                  opacity={0.5}
                  depthWrite={false}
                />
              </mesh>
              <lineSegments geometry={edgesOf(part.geometry)}>
                <lineBasicMaterial
                  ref={(m) => {
                    glow.current[i * 2 + 1] = m;
                  }}
                  color={mat.emissive ?? mat.color}
                  transparent
                  opacity={0.9}
                />
              </lineSegments>
            </group>
          );
        }
        return (
          <mesh
            key={i}
            geometry={part.geometry}
            position={part.position}
            rotation={part.rotation}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={map || part.vertexColors ? '#ffffff' : mat.color}
              map={map}
              vertexColors={part.vertexColors ?? false}
              roughness={mat.roughness}
              metalness={mat.metalness}
              emissive={mat.emissive ?? '#000000'}
              emissiveIntensity={mat.emissiveIntensity ?? 0}
              transparent={mat.opacity !== undefined}
              opacity={mat.opacity ?? 1}
              flatShading={mat.flatShading ?? false}
              wireframe={mat.wireframe ?? false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** A flat coloured square lying on the board. */
function SquareTint({
  square,
  tint,
  size = 1,
}: {
  square: string;
  tint: ThemeColor;
  size?: number;
}) {
  const { x, z } = squareToWorld(square);
  return (
    <mesh position={[x, OVERLAY_Y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color={tint.color} transparent opacity={tint.opacity} depthWrite={false} />
    </mesh>
  );
}

function SquareRing({
  square,
  tint,
  inner = 0.36,
  outer = 0.46,
}: {
  square: string;
  tint: ThemeColor;
  inner?: number;
  outer?: number;
}) {
  const { x, z } = squareToWorld(square);
  return (
    <mesh position={[x, OVERLAY_Y + 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 40]} />
      <meshBasicMaterial
        color={tint.color}
        transparent
        opacity={Math.max(tint.opacity, 0.5)}
        depthWrite={false}
      />
    </mesh>
  );
}

function Arrow({ from, to, tint }: { from: string; to: string; tint: ThemeColor }) {
  const a = squareToWorld(from);
  const b = squareToWorld(to);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const head = 0.32;
  return (
    <group position={[a.x, OVERLAY_Y + 0.02, a.z]} rotation={[0, -Math.atan2(dz, dx), 0]}>
      <mesh position={[(length - head) / 2, 0, 0]}>
        <boxGeometry args={[length - head, 0.02, 0.13]} />
        <meshBasicMaterial color={tint.color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[length - head / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.24, head, 3]} />
        <meshBasicMaterial color={tint.color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * The optional 3D board (Phase 6), lazy-loaded by ChessBoard. It only renders and
 * reports square clicks; selection, legality and promotion stay in ChessBoard.
 */
export default function Board3D({
  fen,
  orientation,
  lastMove,
  selected,
  targets,
  checked,
  marks,
  arrows,
  pieceSet,
  boardSurface,
  moveMs,
  interactive,
  onSquareClick,
  canDrag,
  onSelect,
  onDrop,
  onSlow,
  labels,
  onTo2d,
}: Board3DProps) {
  const colors = useThemeColors();
  // The frame is a darker cut of the dark squares' colour.
  const frameColor = useMemo(
    () => '#' + new Color(colors.dark.color).multiplyScalar(0.6).getHexString(),
    [colors.dark.color],
  );
  const flip = orientation === 'black';
  const [preset, setPreset] = useState<CameraPreset>('angle');
  const [hover, setHover] = useState<string | null>(null);
  const controls = useRef<OrbitControls | null>(null);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dropSquare, setDropSquare] = useState<string | null>(null);
  const pieces = useMemo(() => piecesFromFen(fen), [fen]);
  const occupied = useMemo(() => new Set(pieces.map((p) => p.square)), [pieces]);

  // Work out which pieces slide whenever the position changes (before the next frame).
  const prevPieces = useRef(pieces);
  const anim = useRef<Anim | null>(null);
  // A move the player just dragged is already where it belongs: don't slide it again.
  const dropped = useRef<Slide | null>(null);
  useLayoutEffect(() => {
    const prev = prevPieces.current;
    const justDropped = dropped.current;
    dropped.current = null;
    anim.current = {
      slides: moveSlides(lastMove, pieces).filter(
        (s) =>
          isForwardSlide(prev, pieces, s) &&
          !(justDropped && justDropped.from === s.from && justDropped.to === s.to),
      ),
      start: null,
    };
    prevPieces.current = pieces;
  }, [pieces, lastMove]);

  const click = (square: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Own pieces are picked up on press (drag), not toggled by the click that follows.
    if (!interactive || e.delta > CLICK_SLOP_PX || canDrag(square)) return;
    onSquareClick(square);
  };

  const setOrbit = (on: boolean) => {
    if (controls.current) controls.current.enabled = on;
  };
  const point = new Vector3();
  const pickUp = (square: string) => (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || !canDrag(square)) return;
    e.stopPropagation();
    (e.target as unknown as Element).setPointerCapture(e.pointerId);
    const { x, z } = squareToWorld(square);
    drag.current = { from: square, x, z };
    setDragging(true);
    setOrbit(false);
    onSelect(square);
  };
  const moveDrag = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current;
    if (!d || !e.ray.intersectPlane(GROUND, point)) return;
    d.x = point.x;
    d.z = point.z;
    const sq = worldToSquare(point.x, point.z);
    if (sq !== dropSquare) setDropSquare(sq);
  };
  const putDown = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current;
    if (!d) return;
    (e.target as unknown as Element).releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
    setDropSquare(null);
    setOrbit(true);
    const to = worldToSquare(d.x, d.z);
    if (to && to !== d.from) {
      dropped.current = { from: d.from, to };
      onDrop(d.from, to);
    }
  };
  const nextPreset = CAMERA_PRESETS[(CAMERA_PRESETS.indexOf(preset) + 1) % CAMERA_PRESETS.length];

  return (
    <div
      className={cn(
        'relative w-full',
        dragging
          ? 'cursor-grabbing'
          : hover && interactive && canDrag(hover)
            ? 'cursor-grab'
            : hover && interactive
              ? 'cursor-pointer'
              : 'cursor-move',
      )}
      style={{ aspectRatio: '1' }}
    >
      <Canvas
        shadows
        // No filmic tone mapping: squares keep the theme's exact colours.
        flat
        dpr={[1, 2]}
        camera={{ fov: 38, position: presetPosition('angle', flip).toArray() }}
        onPointerMissed={() => setHover(null)}
      >
        <CameraRig preset={preset} flip={flip} controlsRef={controls} />
        {onSlow && <FpsWatch onSlow={onSlow} />}
        {/* Neutral fill: a coloured ground light would tint white pieces. */}
        <hemisphereLight args={['#ffffff', '#8c8c94', 0.75]} />
        <directionalLight
          position={[4, 10, flip ? -5 : 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <ambientLight intensity={0.25} />

        {/* Frame and squares. */}
        <mesh position={[0, BOARD_TOP - 0.42, 0]} receiveShadow castShadow>
          <boxGeometry args={[9, 0.6, 9]} />
          <meshStandardMaterial
            color="#ffffff"
            map={surfaceTexture(boardSurface, frameColor, 7)}
            roughness={0.55}
          />
        </mesh>
        {ALL_SQUARES.map((sq) => {
          const { x, z } = squareToWorld(sq);
          return (
            <mesh
              key={sq}
              position={[x, BOARD_TOP - 0.06, z]}
              receiveShadow
              onClick={click(sq)}
              onPointerOver={() => setHover(sq)}
            >
              <boxGeometry args={[1, 0.12, 1]} />
              <meshStandardMaterial
                color="#ffffff"
                map={surfaceTexture(
                  boardSurface,
                  isLightSquare(sq) ? colors.light.color : colors.dark.color,
                  squareVariant(sq),
                )}
                roughness={0.55}
              />
            </mesh>
          );
        })}

        {/* Highlights. */}
        {lastMove && (
          <>
            <SquareTint square={lastMove.from} tint={colors.last} />
            <SquareTint square={lastMove.to} tint={colors.last} />
          </>
        )}
        {selected && <SquareTint square={selected} tint={colors.selected} />}
        {checked && <SquareTint square={checked} tint={colors.check} />}
        {Object.entries(marks ?? {}).map(([sq, mark]) =>
          mark === 'hint' || mark === 'missed' ? (
            <SquareRing
              key={sq}
              square={sq}
              tint={mark === 'hint' ? colors.markHint : colors.markCorrect}
            />
          ) : (
            <SquareTint
              key={sq}
              square={sq}
              tint={
                mark === 'correct'
                  ? colors.markCorrect
                  : mark === 'wrong'
                    ? colors.markWrong
                    : colors.markSelected
              }
            />
          ),
        )}
        {targets.map((sq) => {
          if (occupied.has(sq)) return <SquareRing key={sq} square={sq} tint={colors.move} />;
          const { x, z } = squareToWorld(sq);
          return (
            <mesh key={sq} geometry={TARGET_DOT} position={[x, OVERLAY_Y + 0.005, z]}>
              <meshBasicMaterial
                color={colors.move.color}
                transparent
                opacity={Math.max(colors.move.opacity, 0.45)}
              />
            </mesh>
          );
        })}
        {dropSquare && dragging && (
          <SquareRing square={dropSquare} tint={colors.selected} inner={0.4} outer={0.5} />
        )}
        {(arrows ?? []).map((a) => (
          <Arrow key={`${a.from}${a.to}`} from={a.from} to={a.to} tint={colors.arrow} />
        ))}

        {/* Pieces: press-and-drag your own pieces; clicking a piece clicks its square. */}
        {pieces.map((p) => (
          <group
            // The set is part of the key: switching sets rebuilds the meshes, so materials
            // that gain or lose a texture compile the right shader.
            key={`${pieceSet}-${p.square}${p.color}${p.type}`}
            onClick={click(p.square)}
            onPointerDown={pickUp(p.square)}
            onPointerMove={moveDrag}
            onPointerUp={putDown}
            onPointerOver={() => {
              setHover(p.square);
              // Over a piece you can pick up, a press means "drag the piece", not "turn the board".
              if (interactive && canDrag(p.square)) setOrbit(false);
            }}
            onPointerOut={() => {
              if (!drag.current) setOrbit(true);
            }}
          >
            <Piece
              piece={p}
              anim={anim}
              drag={drag}
              moveMs={moveMs * MOVE_SLOWDOWN}
              set={pieceSet}
              flip={flip}
            />
          </group>
        ))}
      </Canvas>

      <div className="absolute top-2 right-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => setPreset(nextPreset)}
          title={labels.camera[nextPreset]}
          aria-label={labels.camera[nextPreset]}
          className="mc-press grid size-9 place-items-center rounded-full border border-border bg-surface/85 text-base shadow-card backdrop-blur hover:bg-surface"
        >
          <span aria-hidden>🎥</span>
        </button>
        {onTo2d && (
          <button
            type="button"
            onClick={onTo2d}
            title={labels.to2d}
            className="mc-press h-9 rounded-full border border-border bg-surface/85 px-3 text-xs font-bold shadow-card backdrop-blur hover:bg-surface"
          >
            2D
          </button>
        )}
      </div>
    </div>
  );
}
