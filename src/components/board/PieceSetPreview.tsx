import { defaultPieces } from 'react-chessboard';
import type { ConcretePieceSet } from '@/core/profile/settingsOptions';
import { PIECE_RENDERERS } from './pieceSets';

/** A white knight and a black king of `set`, for piece-set pickers. */
export function PieceSetPreview({ set, size = 34 }: { set: ConcretePieceSet; size?: number }) {
  const pieces = PIECE_RENDERERS[set] ?? defaultPieces;
  const WhiteKnight = pieces.wN;
  const BlackKing = pieces.bK;
  return (
    <span aria-hidden className="flex items-end justify-center">
      <span style={{ width: size, height: size }}>{WhiteKnight?.()}</span>
      <span style={{ width: size, height: size }} className="-ml-1.5">
        {BlackKing?.()}
      </span>
    </span>
  );
}
