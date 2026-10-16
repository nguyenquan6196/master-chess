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

/**
 * Cast-resin pieces (pairs with the "rosin" theme): translucent pearl-white and ocean-blue
 * bodies with a soft agate swirl inside, a glossy highlight and a darker rim. Colours are
 * fixed artwork. Gradient ids are shared per colour/kind (identical defs, so reuse is safe).
 */
const RESIN = {
  white: { top: '#ffffff', bottom: '#cfdde8', rim: '#7d97ad', swirl: '#9cc0dc' },
  black: { top: '#5aa6e6', bottom: '#0b3f7a', rim: '#06264a', swirl: '#cfeaff' },
};

function resin(kind: PieceKind, white: boolean): Render {
  const c = white ? RESIN.white : RESIN.black;
  const id = `mc-resin-${white ? 'w' : 'b'}-${kind}`;
  const shape = (
    <>
      {PIECE_SHAPES[kind]}
      {PIECE_BASE}
    </>
  );
  const Piece: Render = (props) =>
    svg(
      <>
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={c.top} />
            <stop offset="1" stopColor={c.bottom} />
          </linearGradient>
          <clipPath id={`${id}-clip`}>{shape}</clipPath>
        </defs>
        {/* Light halo so blue pieces stay readable on the blue squares. */}
        {!white && (
          <g fill="none" stroke="#eaf6ff" strokeWidth="3.4" strokeLinejoin="round" opacity="0.85">
            {shape}
          </g>
        )}
        {/* Body: slightly translucent so the board glows through. */}
        <g fill={`url(#${id}-body)`} fillOpacity={white ? 0.94 : 0.9}>
          {shape}
        </g>
        {/* Agate swirl and gloss, kept inside the silhouette. */}
        <g clipPath={`url(#${id}-clip)`}>
          <g fill="none" stroke={c.swirl} strokeLinecap="round" opacity="0.55">
            <path d="M-14,6 C-6,0 2,10 12,2" strokeWidth="2.2" />
            <path d="M-12,-6 C-4,-12 4,-2 13,-9" strokeWidth="1.4" />
            <path d="M-10,14 C-2,9 6,16 14,11" strokeWidth="1.2" />
          </g>
          <ellipse
            cx="-4"
            cy="-10"
            rx="3"
            ry="11"
            fill="#ffffff"
            opacity={white ? 0.7 : 0.45}
            transform="rotate(18 -4 -10)"
          />
        </g>
        <g fill="none" stroke={c.rim} strokeWidth="1.3" strokeLinejoin="round">
          {shape}
        </g>
      </>,
      { filter: 'drop-shadow(0 1px 1.2px rgb(0 0 0 / 0.35))', ...props?.svgStyle },
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
  resin: build(resin),
};
