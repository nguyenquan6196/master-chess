/** Piece kinds and Unicode chess characters (rank emblems). */
export type PieceKind = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/**
 * Unicode chess characters (drawn inside rank emblems). U+FE0E asks for the
 * text form so ♟ never turns into a colour emoji.
 */
export const PIECE_GLYPHS: Record<PieceKind, string> = {
  k: '♚\uFE0E',
  q: '♛\uFE0E',
  r: '♜\uFE0E',
  b: '♝\uFE0E',
  n: '♞\uFE0E',
  p: '♟\uFE0E',
};
export const GLYPH_FONT = "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', serif";
