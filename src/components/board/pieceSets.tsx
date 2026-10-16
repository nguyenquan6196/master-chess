import type { CSSProperties, JSX } from 'react';
import type { PieceSet } from '@/core/profile/settingsOptions';
import { GLYPH_FONT, PIECE_BASE, PIECE_GLYPHS, PIECE_SHAPES, type PieceKind } from './pieceShapes';

/**
 * Self-drawn piece sets (spec §7.2, no external assets). "classic" keeps
 * react-chessboard's default pieces. Colours are fixed artwork (like flags) so pieces
 * keep their contrast on every board style.
 */
type Render = (props?: { svgStyle?: CSSProperties }) => JSX.Element;
type PieceRenderObject = Record<string, Render>;

/** Fixed artwork colours that read well on every board (light and dark). */
const FILL = { white: '#f7f5ee', black: '#3b3d45', blackEdge: '#0d0e12' };

const KINDS: PieceKind[] = ['p', 'n', 'b', 'r', 'q', 'k'];

function svg(children: JSX.Element, style?: CSSProperties) {
  return (
    <svg viewBox="-24 -29 48 48" width="100%" height="100%" style={style}>
      {children}
    </svg>
  );
}

function minimal(kind: PieceKind, white: boolean): Render {
  const Piece: Render = (props) =>
    svg(
      <g
        fill={white ? FILL.white : FILL.black}
        stroke={white ? FILL.black : FILL.blackEdge}
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        {PIECE_SHAPES[kind]}
        {PIECE_BASE}
      </g>,
      props?.svgStyle,
    );
  return Piece;
}

function outline(kind: PieceKind, white: boolean): Render {
  const color = white ? '#3ff3ff' : '#ff3fd8';
  const Piece: Render = (props) =>
    svg(
      <g
        fill={white ? 'rgb(63 243 255 / 0.12)' : 'rgb(255 63 216 / 0.12)'}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
      >
        {PIECE_SHAPES[kind]}
        {PIECE_BASE}
      </g>,
      props?.svgStyle,
    );
  return Piece;
}

function glyph(kind: PieceKind, white: boolean): Render {
  const Piece: Render = (props) =>
    svg(
      <text
        x="0"
        y="12"
        textAnchor="middle"
        fontSize="40"
        fontFamily={GLYPH_FONT}
        fill={white ? FILL.white : FILL.black}
        stroke={white ? FILL.black : FILL.blackEdge}
        strokeWidth="1.2"
        paintOrder="stroke"
      >
        {PIECE_GLYPHS[kind]}
      </text>,
      props?.svgStyle,
    );
  return Piece;
}

function build(make: (kind: PieceKind, white: boolean) => Render): PieceRenderObject {
  const out: PieceRenderObject = {};
  for (const k of KINDS) {
    out[`w${k.toUpperCase()}`] = make(k, true);
    out[`b${k.toUpperCase()}`] = make(k, false);
  }
  return out;
}

/** Custom renderers per set; undefined = react-chessboard's default pieces. */
export const PIECE_RENDERERS: Record<PieceSet, PieceRenderObject | undefined> = {
  classic: undefined,
  minimal: build(minimal),
  outline: build(outline),
  glyph: build(glyph),
};
