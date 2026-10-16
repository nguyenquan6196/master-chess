/**
 * 3D board geometry (Phase 6), pure: square ↔ world coordinates, piece lists from a FEN,
 * the pieces a move animates (castling moves the rook too) and the move trajectory.
 *
 * World: one square = 1 unit, board centred on the origin, y up. White's back rank is at
 * +z (towards the default camera), files a→h run −x → +x.
 */

export type Square3D = string;
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface BoardPiece {
  square: Square3D;
  type: PieceType;
  color: PieceColor;
}

const FILES = 'abcdefgh';

/** Centre of a square in world units (y = 0 is the board surface). */
export function squareToWorld(square: Square3D): { x: number; z: number } {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  return { x: file - 3.5, z: 4.5 - rank };
}

/** The square under a world point, or null off the board. */
export function worldToSquare(x: number, z: number): Square3D | null {
  const file = Math.floor(x + 4);
  const rank = Math.floor(4.5 - z + 0.5);
  if (file < 0 || file > 7 || rank < 1 || rank > 8) return null;
  return `${FILES[file]}${rank}`;
}

/** Light squares are those where (file index + rank) is even (a1 is dark, h1 light). */
export function isLightSquare(square: Square3D): boolean {
  return (FILES.indexOf(square[0]) + Number(square[1])) % 2 === 0;
}

/** Every square, a8 … h1. */
export const ALL_SQUARES: readonly Square3D[] = Array.from({ length: 64 }, (_, i) => {
  const rank = 8 - Math.floor(i / 8);
  return `${FILES[i % 8]}${rank}`;
});

/** Pieces on the board of a FEN (placement field only). */
export function piecesFromFen(fen: string): BoardPiece[] {
  const placement = fen.split(' ')[0] ?? '';
  const out: BoardPiece[] = [];
  placement.split('/').forEach((row, r) => {
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const lower = ch.toLowerCase();
      if ('pnbrqk'.includes(lower) && file < 8) {
        out.push({
          square: `${FILES[file]}${8 - r}`,
          type: lower as PieceType,
          color: ch === lower ? 'b' : 'w',
        });
      }
      file++;
    }
  });
  return out;
}

export interface Slide {
  from: Square3D;
  to: Square3D;
}

/**
 * The slides a move shows: the moved piece, plus the rook when the king castles (the
 * king moves two files). `pieces` is the position after the move.
 */
export function moveSlides(
  move: { from: Square3D; to: Square3D } | null | undefined,
  pieces: readonly BoardPiece[],
): Slide[] {
  if (!move || move.from === move.to) return [];
  const slides: Slide[] = [{ from: move.from, to: move.to }];
  const moved = pieces.find((p) => p.square === move.to);
  const fileDelta = FILES.indexOf(move.to[0]) - FILES.indexOf(move.from[0]);
  if (moved?.type === 'k' && Math.abs(fileDelta) === 2) {
    const rank = move.to[1];
    slides.push(
      fileDelta > 0 ? { from: `h${rank}`, to: `f${rank}` } : { from: `a${rank}`, to: `d${rank}` },
    );
  }
  return slides;
}

/**
 * True when `slide` is a move that just happened going from `prev` to `next`: the piece
 * now on `to` stood on `from` before and `from` is empty now. Undo / new game / jumps in
 * a replay fail this check, so they snap instead of animating backwards.
 */
export function isForwardSlide(
  prev: readonly BoardPiece[],
  next: readonly BoardPiece[],
  slide: Slide,
): boolean {
  const before = prev.find((p) => p.square === slide.from);
  const after = next.find((p) => p.square === slide.to);
  const fromNow = next.find((p) => p.square === slide.from);
  if (!before || !after || fromNow) return false;
  // Promotion changes the type, never the colour.
  return before.color === after.color && (before.type === after.type || before.type === 'p');
}

/** Smooth start and stop. */
export function easeInOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2;
}

/** Height of a hop along the move (knights jump higher), 0 at both ends. */
export const HOP = { slide: 0.18, knight: 0.9 } as const;

/** Position along a slide at progress t ∈ [0, 1]. */
export function slidePosition(
  slide: Slide,
  t: number,
  knight: boolean,
): { x: number; y: number; z: number } {
  const a = squareToWorld(slide.from);
  const b = squareToWorld(slide.to);
  const e = easeInOut(t);
  const lift = (knight ? HOP.knight : HOP.slide) * Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  return { x: a.x + (b.x - a.x) * e, y: lift, z: a.z + (b.z - a.z) * e };
}
