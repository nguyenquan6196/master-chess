'use client';

import { MOVE_ANIMATION_MS, useBoardPrefs } from './BoardPrefs';
import { PIECE_RENDERERS } from './pieceSets';
import { useId, useMemo, useState, type CSSProperties } from 'react';
import { Chessboard, defaultPieces, type ChessboardOptions } from 'react-chessboard';
import {
  checkedKingSquare,
  isPromotionMove,
  legalTargets,
  pieceColorAt,
  turnOf,
  PROMOTION_PIECES,
  type Color,
  type MoveInput,
  type PromotionPiece,
  type Square,
} from '@/core/chess/game';
import { PromotionPicker, type PromotionLabels } from './PromotionPicker';

export type { PromotionLabels };

export interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  /** Which side the user may move: a color, both sides (local game) or none (read-only). */
  movableColor?: Color | 'both' | 'none';
  /** `promotion`: the move promoted a pawn (plays the promotion flash). */
  lastMove?: { from: string; to: string; promotion?: string } | null;
  /** Return false to reject the move (e.g. illegal); the board snaps back. */
  onMove?: (move: MoveInput) => boolean;
  promotionLabels: PromotionLabels;
  /** Highlight arrows, e.g. a hint. Colors come from the theme (`--mc-arrow-hint`). */
  arrows?: { from: string; to: string }[];
  /** Square highlights for quizzes and hints. */
  marks?: Record<string, SquareMark>;
  /** Called on every square click when the board is not movable (e.g. "select the squares"). */
  onSquareSelect?: (square: string) => void;
  className?: string;
}

export type SquareMark = 'hint' | 'selected' | 'correct' | 'wrong' | 'missed';

const MARK_STYLES: Record<SquareMark, CSSProperties> = {
  hint: { boxShadow: 'inset 0 0 0 4px var(--mc-mark-hint)' },
  selected: {
    backgroundImage: 'radial-gradient(circle, var(--mc-mark-selected) 30%, transparent 32%)',
  },
  correct: { backgroundColor: 'var(--mc-mark-correct)' },
  wrong: { backgroundColor: 'var(--mc-mark-wrong)' },
  missed: { boxShadow: 'inset 0 0 0 4px var(--mc-mark-correct)' },
};

const BOARD_STYLE: CSSProperties = { borderRadius: 8, overflow: 'hidden' };
const LIGHT_SQUARE: CSSProperties = { backgroundColor: 'var(--mc-board-light)' };
const DARK_SQUARE: CSSProperties = { backgroundColor: 'var(--mc-board-dark)' };
const LIGHT_NOTATION: CSSProperties = { color: 'var(--mc-board-notation-light)', fontWeight: 600 };
const DARK_NOTATION: CSSProperties = { color: 'var(--mc-board-notation-dark)', fontWeight: 600 };

/** SVG attributes can't read CSS variables, so resolve the theme color at render time. */
function themeColor(name: string): string {
  if (typeof window === 'undefined') return 'transparent';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'currentColor';
}

const MOVE_DOT = 'radial-gradient(circle, var(--mc-hl-move) 24%, transparent 26%)';
const CAPTURE_RING = 'radial-gradient(circle, transparent 58%, var(--mc-hl-move) 60%)';
const CHECK_GLOW = 'radial-gradient(circle, var(--mc-hl-check) 0%, transparent 72%)';

export function ChessBoard({
  fen,
  orientation = 'white',
  movableColor = 'both',
  lastMove,
  onMove,
  promotionLabels,
  arrows,
  marks,
  onSquareSelect,
  className,
}: ChessBoardProps) {
  // Unique per board: lessons show several boards on one page.
  const boardId = `mc-board-${useId().replace(/:/g, '')}`;
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  // Reset selection whenever the position changes (move played, undo, new game).
  const [selectionFen, setSelectionFen] = useState(fen);
  if (selectionFen !== fen) {
    setSelectionFen(fen);
    setSelected(null);
    setPendingPromotion(null);
  }

  const mover = turnOf(fen);
  const canMoveColor = (color: Color | null) =>
    color !== null &&
    movableColor !== 'none' &&
    color === mover &&
    (movableColor === 'both' || movableColor === color);

  const prefs = useBoardPrefs();
  const targets = useMemo(() => (selected ? legalTargets(fen, selected) : []), [fen, selected]);

  function tryMove(from: Square, to: Square): boolean {
    if (isPromotionMove(fen, from, to)) {
      setPendingPromotion({ from, to });
      return false;
    }
    const ok = onMove?.({ from, to }) ?? false;
    setSelected(null);
    return ok;
  }

  function choosePromotion(piece: PromotionPiece) {
    if (!pendingPromotion) return;
    onMove?.({ ...pendingPromotion, promotion: piece });
    setPendingPromotion(null);
    setSelected(null);
  }

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    const animate = prefs.moveAnimation !== 'off';
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'var(--mc-hl-last)' };
      styles[lastMove.to] = {
        backgroundColor: 'var(--mc-hl-last)',
        ...(lastMove.promotion && animate ? { animation: 'mc-promote-flash 0.9s ease-out' } : {}),
      };
    }
    const checked = checkedKingSquare(fen);
    if (checked) {
      styles[checked] = {
        ...styles[checked],
        backgroundImage: CHECK_GLOW,
        ...(animate ? { animation: 'mc-check-pulse 0.8s ease-in-out 3' } : {}),
      };
    }
    if (selected) styles[selected] = { backgroundColor: 'var(--mc-hl-selected)' };
    for (const sq of targets) {
      const occupied = pieceColorAt(fen, sq) !== null;
      styles[sq] = {
        ...styles[sq],
        backgroundImage: occupied ? CAPTURE_RING : MOVE_DOT,
        cursor: 'pointer',
      };
    }
    for (const [sq, mark] of Object.entries(marks ?? {})) {
      styles[sq] = {
        ...styles[sq],
        ...MARK_STYLES[mark],
        cursor: onSquareSelect ? 'pointer' : undefined,
      };
    }
    return styles;
  }, [fen, lastMove, selected, targets, marks, onSquareSelect, prefs.moveAnimation]);

  const options: ChessboardOptions = {
    id: boardId,
    position: fen,
    boardOrientation: orientation,
    boardStyle: BOARD_STYLE,
    lightSquareStyle: LIGHT_SQUARE,
    darkSquareStyle: DARK_SQUARE,
    lightSquareNotationStyle: LIGHT_NOTATION,
    darkSquareNotationStyle: DARK_NOTATION,
    squareStyles,
    arrows: (arrows ?? []).map((a) => ({
      startSquare: a.from,
      endSquare: a.to,
      color: themeColor('--mc-arrow-hint'),
    })),
    animationDurationInMs: MOVE_ANIMATION_MS[prefs.moveAnimation],
    ...(PIECE_RENDERERS[prefs.pieceSet] ? { pieces: PIECE_RENDERERS[prefs.pieceSet] } : {}),
    allowDrawingArrows: true,
    canDragPiece: ({ piece }) => canMoveColor(piece.pieceType[0] as Color),
    onPieceDrag: ({ square }) => {
      if (square) setSelected(square as Square);
    },
    onPieceDrop: ({ sourceSquare, targetSquare }) => {
      if (!targetSquare || targetSquare === sourceSquare) return false;
      return tryMove(sourceSquare as Square, targetSquare as Square);
    },
    onSquareClick: ({ square }) => {
      if (movableColor === 'none') {
        onSquareSelect?.(square);
        return;
      }
      if (pendingPromotion) return;
      const sq = square as Square;
      if (selected && targets.includes(sq)) {
        tryMove(selected, sq);
        return;
      }
      if (sq !== selected && canMoveColor(pieceColorAt(fen, sq))) setSelected(sq);
      else setSelected(null);
    },
  };

  return (
    <div className={className} style={{ position: 'relative', touchAction: 'none' }}>
      <Chessboard options={options} />
      {pendingPromotion && (
        <PromotionPicker
          pieces={PROMOTION_PIECES}
          renderPiece={(p) => defaultPieces[`${mover}${p.toUpperCase()}`]?.()}
          labels={promotionLabels}
          onChoose={choosePromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  );
}
