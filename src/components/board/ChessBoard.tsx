'use client';

import { useMemo, useState, type CSSProperties } from 'react';
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
  lastMove?: { from: string; to: string } | null;
  /** Return false to reject the move (e.g. illegal); the board snaps back. */
  onMove?: (move: MoveInput) => boolean;
  promotionLabels: PromotionLabels;
  className?: string;
}

const BOARD_STYLE: CSSProperties = { borderRadius: 8, overflow: 'hidden' };
const LIGHT_SQUARE: CSSProperties = { backgroundColor: 'var(--mc-board-light)' };
const DARK_SQUARE: CSSProperties = { backgroundColor: 'var(--mc-board-dark)' };
const LIGHT_NOTATION: CSSProperties = { color: 'var(--mc-board-notation-light)', fontWeight: 600 };
const DARK_NOTATION: CSSProperties = { color: 'var(--mc-board-notation-dark)', fontWeight: 600 };

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
  className,
}: ChessBoardProps) {
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
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'var(--mc-hl-last)' };
      styles[lastMove.to] = { backgroundColor: 'var(--mc-hl-last)' };
    }
    const checked = checkedKingSquare(fen);
    if (checked) styles[checked] = { ...styles[checked], backgroundImage: CHECK_GLOW };
    if (selected) styles[selected] = { backgroundColor: 'var(--mc-hl-selected)' };
    for (const sq of targets) {
      const occupied = pieceColorAt(fen, sq) !== null;
      styles[sq] = {
        ...styles[sq],
        backgroundImage: occupied ? CAPTURE_RING : MOVE_DOT,
        cursor: 'pointer',
      };
    }
    return styles;
  }, [fen, lastMove, selected, targets]);

  const options: ChessboardOptions = {
    id: 'mc-board',
    position: fen,
    boardOrientation: orientation,
    boardStyle: BOARD_STYLE,
    lightSquareStyle: LIGHT_SQUARE,
    darkSquareStyle: DARK_SQUARE,
    lightSquareNotationStyle: LIGHT_NOTATION,
    darkSquareNotationStyle: DARK_NOTATION,
    squareStyles,
    animationDurationInMs: 180,
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
