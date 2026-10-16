/**
 * Option ids for player settings (appearance and sound). Values (colours, synth
 * patches…) live in services; display names in messages under `settings.*`.
 */
export const THEME_IDS = [
  'classic',
  'wood',
  'rosin',
  'marble',
  'neon',
  'arcade',
  'fantasy',
  'sakura',
  'midnight',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const BOARD_STYLES = [
  'theme',
  'green',
  'brown',
  'blue',
  'gray',
  'purple',
  'pink',
  'neon',
  'gameboy',
] as const;
/**
 * Piece sets. "theme" follows the colour theme (THEME_PIECE_SET); every other id is a
 * self-drawn set with its own shapes ("classic" = react-chessboard's default pieces,
 * "outline" = the neon line set).
 */
export const PIECE_SETS = [
  'theme',
  'classic',
  'wood',
  'resin',
  'marble',
  'outline',
  'pixel',
  'fantasy',
  'sakura',
  'midnight',
] as const;
export const ACCENTS = [
  'theme',
  'green',
  'blue',
  'purple',
  'pink',
  'orange',
  'red',
  'teal',
  'gold',
] as const;
export const HIGHLIGHTS = ['theme', 'yellow', 'blue', 'green', 'red'] as const;
export const BUTTON_STYLES = ['rounded', 'square', 'pill'] as const;
export const BACKDROPS = ['theme', 'none', 'color', 'gradient', 'image'] as const;
export const GRADIENTS = ['sunset', 'ocean', 'forest', 'aurora', 'dusk'] as const;
export const MOVE_ANIMATIONS = ['normal', 'fast', 'off'] as const;

export const MUSIC_MODES = ['auto', 'fixed', 'off'] as const;
/** Generated music moods (spec §7.1): screens and bot tiers. */
export const MUSIC_TRACKS = [
  'menu',
  'learn',
  'practice',
  'rush',
  'bot1',
  'bot2',
  'bot3',
  'bot4',
] as const;
export const SOUND_PACKS = ['classic', 'arcade', 'fantasy'] as const;

export type BoardStyle = (typeof BOARD_STYLES)[number];
export type PieceSet = (typeof PIECE_SETS)[number];
/** A piece set that can actually be drawn ("theme" resolved). */
export type ConcretePieceSet = Exclude<PieceSet, 'theme'>;

/** The piece set each theme brings (shape and material match the theme). */
export const THEME_PIECE_SET: Record<ThemeId, ConcretePieceSet> = {
  classic: 'classic',
  wood: 'wood',
  rosin: 'resin',
  marble: 'marble',
  neon: 'outline',
  arcade: 'pixel',
  fantasy: 'fantasy',
  sakura: 'sakura',
  midnight: 'midnight',
};

/** Resolves "theme" to the set of the active (resolved) theme. */
export function resolvePieceSet(set: PieceSet, theme: ThemeId): ConcretePieceSet {
  return set === 'theme' ? THEME_PIECE_SET[theme] : set;
}
export type Accent = (typeof ACCENTS)[number];
export type Highlight = (typeof HIGHLIGHTS)[number];
export type ButtonStyle = (typeof BUTTON_STYLES)[number];
export type Backdrop = (typeof BACKDROPS)[number];
export type Gradient = (typeof GRADIENTS)[number];
export type MoveAnimation = (typeof MOVE_ANIMATIONS)[number];
export type MusicMode = (typeof MUSIC_MODES)[number];
export type MusicTrack = (typeof MUSIC_TRACKS)[number];
export type SoundPack = (typeof SOUND_PACKS)[number];

/** Limits for the backdrop sliders. */
export const BACKDROP_LIMITS = { dimMax: 0.8, blurMaxPx: 12 } as const;
