import type { CSSProperties, JSX } from 'react';
import type { ConcretePieceSet } from '@/core/profile/settingsOptions';
import { fantasyArt } from './pieceArt/fantasy';
import { marbleArt } from './pieceArt/marble';
import { midnightArt } from './pieceArt/midnight';
import { neonArt } from './pieceArt/neon';
import { pixelArt } from './pieceArt/pixel';
import { resinArt } from './pieceArt/resin';
import { sakuraArt } from './pieceArt/sakura';
import type { Art } from './pieceArt/shared';
import { woodArt } from './pieceArt/wood';
import type { PieceKind } from './pieceShapes';

/**
 * Self-drawn piece sets (spec §7.2, Phase 5.6 — no external assets): each theme's set
 * has its own shapes and material (see `pieceArt/`). "classic" keeps react-chessboard's
 * default pieces. Colours are fixed artwork (like flags) so pieces
 * keep their contrast on every board style.
 */
type Render = (props?: { svgStyle?: CSSProperties }) => JSX.Element;
type PieceRenderObject = Record<string, Render>;

const KINDS: PieceKind[] = ['p', 'n', 'b', 'r', 'q', 'k'];

function svg(children: JSX.Element, style?: CSSProperties) {
  return (
    <svg viewBox="-24 -29 48 48" width="100%" height="100%" style={style}>
      {children}
    </svg>
  );
}

/** Wraps a set's artwork (from `pieceArt/`) as a react-chessboard renderer. */
function fromArt(art: Art, style?: CSSProperties) {
  return (kind: PieceKind, white: boolean): Render => {
    const Piece: Render = (props) => svg(art(kind, white), { ...style, ...props?.svgStyle });
    return Piece;
  };
}

/** Soft contact shadow for solid (non-glowing) sets. */
const GROUNDED: CSSProperties = { filter: 'drop-shadow(0 1px 1.2px rgb(0 0 0 / 0.35))' };

function build(make: (kind: PieceKind, white: boolean) => Render): PieceRenderObject {
  const out: PieceRenderObject = {};
  for (const k of KINDS) {
    out[`w${k.toUpperCase()}`] = make(k, true);
    out[`b${k.toUpperCase()}`] = make(k, false);
  }
  return out;
}

/**
 * Renderers per concrete set ("theme" is resolved before use); undefined =
 * react-chessboard's default pieces.
 */
export const PIECE_RENDERERS: Record<ConcretePieceSet, PieceRenderObject | undefined> = {
  classic: undefined,
  wood: build(fromArt(woodArt, GROUNDED)),
  resin: build(fromArt(resinArt, GROUNDED)),
  marble: build(fromArt(marbleArt, GROUNDED)),
  outline: build(fromArt(neonArt)),
  pixel: build(fromArt(pixelArt)),
  fantasy: build(fromArt(fantasyArt, GROUNDED)),
  sakura: build(fromArt(sakuraArt, GROUNDED)),
  midnight: build(fromArt(midnightArt, GROUNDED)),
};
