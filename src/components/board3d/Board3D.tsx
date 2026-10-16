'use client';

import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Color, Vector3, type Group } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ALL_SQUARES,
  isForwardSlide,
  isLightSquare,
  moveSlides,
  piecesFromFen,
  slidePosition,
  squareToWorld,
  type BoardPiece,
  type Slide,
} from '@/core/board3d/board3d';
import type { ConcretePieceSet } from '@/core/profile/settingsOptions';
import { cn } from '../ui/cn';
import { pieceParts, TARGET_DOT } from './geometry';
import { PIECE_MATERIALS } from './materials';
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
  /** Duration of one move animation; 0 = no animation. */
  moveMs: number;
  /** Whether squares react to clicks (a side can move, or squares can be selected). */
  interactive: boolean;
  onSquareClick: (square: string) => void;
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

function presetPosition(preset: CameraPreset, flip: boolean): Vector3 {
  const [x, y, z] = PRESET_POSITION[preset];
  return new Vector3(x, y, flip ? -z : z);
}

interface Anim {
  slides: Slide[];
  start: number | null;
}

/** Orbit controls plus a smooth glide to the chosen preset. */
function CameraRig({ preset, flip }: { preset: CameraPreset; flip: boolean }) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const goal = useRef<Vector3 | null>(null);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enablePan = false;
    c.enableDamping = true;
    c.minDistance = 7;
    c.maxDistance = 20;
    c.maxPolarAngle = 1.35;
    controls.current = c;
    return () => c.dispose();
  }, [camera, gl]);

  useEffect(() => {
    goal.current = presetPosition(preset, flip);
  }, [preset, flip]);

  useFrame(() => {
    if (goal.current) {
      camera.position.lerp(goal.current, 0.14);
      if (camera.position.distanceTo(goal.current) < 0.01) goal.current = null;
    }
    controls.current?.update();
  });
  return null;
}

function Piece({
  piece,
  anim,
  moveMs,
  set,
}: {
  piece: BoardPiece;
  anim: RefObject<Anim | null>;
  moveMs: number;
  set: ConcretePieceSet;
}) {
  const ref = useRef<Group>(null);
  const base = squareToWorld(piece.square);
  const mat = PIECE_MATERIALS[set][piece.color === 'w' ? 'white' : 'black'];
  // White's knights look left (as in 2D), Black's mirror them.
  const turn = piece.type === 'n' && piece.color === 'b' ? Math.PI : 0;

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const a = anim.current;
    const slide = a?.slides.find((s) => s.to === piece.square);
    if (!a || !slide || moveMs <= 0) {
      g.position.set(base.x, 0, base.z);
      return;
    }
    a.start ??= clock.elapsedTime;
    const t = ((clock.elapsedTime - a.start) * 1000) / moveMs;
    const p = slidePosition(slide, t, piece.type === 'n');
    g.position.set(p.x, p.y, p.z);
  });

  return (
    <group ref={ref} position={[base.x, 0, base.z]} rotation={[0, turn, 0]}>
      {pieceParts(piece.type).map((part, i) => (
        <mesh
          key={i}
          geometry={part.geometry}
          position={part.position}
          rotation={part.rotation}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={mat.color}
            roughness={mat.roughness}
            metalness={mat.metalness}
            emissive={mat.emissive ?? '#000000'}
            emissiveIntensity={mat.emissiveIntensity ?? 0}
            transparent={mat.opacity !== undefined}
            opacity={mat.opacity ?? 1}
            flatShading={mat.flatShading ?? false}
          />
        </mesh>
      ))}
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
  moveMs,
  interactive,
  onSquareClick,
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
  const pieces = useMemo(() => piecesFromFen(fen), [fen]);
  const occupied = useMemo(() => new Set(pieces.map((p) => p.square)), [pieces]);

  // Work out which pieces slide whenever the position changes (before the next frame).
  const prevPieces = useRef(pieces);
  const anim = useRef<Anim | null>(null);
  useLayoutEffect(() => {
    const prev = prevPieces.current;
    anim.current = {
      slides: moveSlides(lastMove, pieces).filter((s) => isForwardSlide(prev, pieces, s)),
      start: null,
    };
    prevPieces.current = pieces;
  }, [pieces, lastMove]);

  const click = (square: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!interactive || e.delta > CLICK_SLOP_PX) return;
    onSquareClick(square);
  };
  const nextPreset = CAMERA_PRESETS[(CAMERA_PRESETS.indexOf(preset) + 1) % CAMERA_PRESETS.length];

  return (
    <div
      className={cn('relative w-full', interactive && hover ? 'cursor-pointer' : 'cursor-grab')}
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
        <CameraRig preset={preset} flip={flip} />
        <hemisphereLight args={['#ffffff', frameColor, 0.7]} />
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
        <mesh position={[0, BOARD_TOP - 0.14, 0]} receiveShadow>
          <boxGeometry args={[8.7, 0.16, 8.7]} />
          <meshStandardMaterial color={frameColor} roughness={0.6} />
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
                color={isLightSquare(sq) ? colors.light.color : colors.dark.color}
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
        {(arrows ?? []).map((a) => (
          <Arrow key={`${a.from}${a.to}`} from={a.from} to={a.to} tint={colors.arrow} />
        ))}

        {/* Pieces (clicking a piece clicks its square). */}
        {pieces.map((p) => (
          <group
            key={`${p.square}${p.color}${p.type}`}
            onClick={click(p.square)}
            onPointerOver={() => setHover(p.square)}
          >
            <Piece piece={p} anim={anim} moveMs={moveMs * MOVE_SLOWDOWN} set={pieceSet} />
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
