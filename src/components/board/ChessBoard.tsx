'use client';

import { MOVE_ANIMATION_MS, useBoardPrefs } from './BoardPrefs';
import { PIECE_RENDERERS } from './pieceSets';
import {
  lazy,
  Suspense,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
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
import { isLowEndDevice } from '@/core/board3d/perf';
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
  /** Game boards may switch to the 3D board (Phase 6); lessons and previews stay 2D. */
  allow3d?: boolean;
  className?: string;
}

/** The 3D board is a separate chunk, loaded only when a player turns 3D on. */
const Board3D = lazy(() => import('../board3d/Board3D'));

let webglCache: boolean | null = null;
/** WebGL support, probed once on the client (no 3D on the server or without WebGL). */
/** WebGL and not a low-end device: the conditions to offer the 3D board at all. */
function webglAvailable(): boolean {
  if (webglCache === null) {
    try {
      const canvas = document.createElement('canvas');
      const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
      };
      webglCache =
        !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl')) &&
        !isLowEndDevice({
          cores: nav.hardwareConcurrency,
          memoryGb: nav.deviceMemory,
          saveData: nav.connection?.saveData,
        });
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}
const noSubscribe = () => () => {};

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
/** Square colour plus an optional theme texture (`--mc-board-*-texture`, e.g. agate rings). */
const LIGHT_SQUARE: CSSProperties = {
  backgroundColor: 'var(--mc-board-light)',
  backgroundImage: 'var(--mc-board-light-texture, none)',
};
const DARK_SQUARE: CSSProperties = {
  backgroundColor: 'var(--mc-board-dark)',
  backgroundImage: 'var(--mc-board-dark-texture, none)',
};
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
  allow3d = false,
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
  const webgl = useSyncExternalStore(noSubscribe, webglAvailable, () => false);
  // Set when the 3D board ran too slowly: back to 2D, with a short notice.
  const [slow, setSlow] = useState(false);
  const show3d = allow3d && prefs.view === '3d' && webgl && !slow;
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
    onSquareClick: ({ square }) => clickSquare(square),
  };

  function clickSquare(square: string) {
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
  }

  const board2d = <Chessboard options={options} />;
  const canToggle = allow3d && webgl && prefs.onViewChange;

  return (
    <div className={className} style={{ position: 'relative', touchAction: 'none' }}>
      {show3d ? (
        <Suspense fallback={board2d}>
          <Board3D
            fen={fen}
            orientation={orientation}
            lastMove={lastMove}
            selected={selected}
            targets={targets}
            checked={checkedKingSquare(fen)}
            marks={marks}
            arrows={arrows}
            pieceSet={prefs.pieceSet}
            moveMs={MOVE_ANIMATION_MS[prefs.moveAnimation]}
            interactive={movableColor !== 'none' || !!onSquareSelect}
            onSquareClick={clickSquare}
            canDrag={(sq) => !pendingPromotion && canMoveColor(pieceColorAt(fen, sq as Square))}
            onSelect={(sq) => setSelected(sq as Square)}
            onDrop={(from, to) => {
              if (legalTargets(fen, from as Square).includes(to as Square)) {
                tryMove(from as Square, to as Square);
              }
            }}
            onSlow={() => {
              setSlow(true);
              prefs.onViewChange?.('2d');
            }}
            labels={prefs.labels3d}
            onTo2d={prefs.onViewChange ? () => prefs.onViewChange?.('2d') : undefined}
          />
        </Suspense>
      ) : (
        <>
          {board2d}
          {slow && (
            <button
              type="button"
              onClick={() => setSlow(false)}
              className="absolute inset-x-2 top-2 z-10 rounded-xl border border-border bg-surface/95 px-3 py-2 text-left text-xs font-semibold shadow-card"
            >
              {prefs.labels3d.slow}
            </button>
          )}
          {canToggle && !slow && (
            <button
              type="button"
              onClick={() => prefs.onViewChange?.('3d')}
              title={prefs.labels3d.to3d}
              className="mc-press absolute top-1.5 right-1.5 z-10 h-7 rounded-full border border-border bg-surface/85 px-2.5 text-xs font-bold shadow-card backdrop-blur hover:bg-surface"
            >
              3D
            </button>
          )}
        </>
      )}
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
