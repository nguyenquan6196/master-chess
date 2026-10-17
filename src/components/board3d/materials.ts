import type { ConcretePieceSet, ThemeId } from '@/core/profile/settingsOptions';
import type { Tone } from './geoUtil';
import type { SurfaceKind } from './textures';

/**
 * 3D materials per piece set (Phase 6): each set's base material — oak/walnut, clear resin, marble, glowing neon tubes, flat pixel
 * colours, gold/amethyst, porcelain/lacquer, silver/obsidian. Metalness stays moderate:
 * the scene has no environment map to reflect. Colours are fixed artwork
 * (like the 2D sets), so pieces keep their contrast on every board.
 */
export interface PieceMaterial {
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  flatShading?: boolean;
  /** Draw only the edges (the neon set: glowing tubes). */
  wireframe?: boolean;
}

type Pair = { white: PieceMaterial; black: PieceMaterial };

const m = (
  color: string,
  roughness: number,
  metalness = 0,
  extra: Partial<PieceMaterial> = {},
) => ({
  color,
  roughness,
  metalness,
  ...extra,
});

export const PIECE_MATERIALS: Record<ConcretePieceSet, Pair> = {
  classic: { white: m('#f1ebdd', 0.45), black: m('#2a2a2f', 0.35) },
  wood: { white: m('#e3bd84', 0.6), black: m('#5a3520', 0.55) },
  resin: {
    white: m('#f2f8fd', 0.12, 0, { opacity: 0.9 }),
    black: m('#2a78c4', 0.12, 0, { opacity: 0.88 }),
  },
  marble: {
    white: m('#f5f5f2', 0.28, 0, { flatShading: true }),
    black: m('#1d1e22', 0.22, 0, { flatShading: true }),
  },
  outline: {
    white: m('#3ff3ff', 0.35, 0, { emissive: '#3ff3ff', emissiveIntensity: 0.9, wireframe: true }),
    black: m('#ff3fd8', 0.35, 0, { emissive: '#ff3fd8', emissiveIntensity: 0.9, wireframe: true }),
  },
  pixel: {
    white: m('#e0f8d0', 1, 0, { flatShading: true }),
    black: m('#173d24', 1, 0, { flatShading: true }),
  },
  fantasy: { white: m('#f2d27f', 0.35, 0.3), black: m('#6b45b8', 0.35, 0.15) },
  sakura: { white: m('#fbeff1', 0.22), black: m('#2a1012', 0.18) },
  midnight: {
    white: m('#d5dce8', 0.28, 0.45, { flatShading: true }),
    black: m('#1b1e26', 0.3, 0.4, { flatShading: true }),
  },
};

/** Palette colours for the parts of character figures (fantasy, sakura). */
export const TONES: Partial<
  Record<
    ConcretePieceSet,
    { white: Partial<Record<Tone, PieceMaterial>>; black: Partial<Record<Tone, PieceMaterial>> }
  >
> = {
  fantasy: {
    white: {
      accent: m('#e7b84a', 0.3, 0.45),
      gem: m('#8a4bd8', 0.25, 0.1),
      skin: m('#f3d6b6', 0.6),
      hair: m('#f4f1ea', 0.7),
      ink: m('#6e4a0e', 0.6),
      light: m('#d9b6ff', 0.3, 0, { emissive: '#b37bff', emissiveIntensity: 0.7 }),
    },
    black: {
      accent: m('#ffcf5a', 0.3, 0.45),
      gem: m('#ffd24a', 0.25, 0.2),
      skin: m('#e8c6a8', 0.6),
      hair: m('#f4f1ea', 0.7),
      ink: m('#2a1250', 0.6),
      light: m('#ffe08a', 0.3, 0, { emissive: '#ffcf5a', emissiveIntensity: 0.7 }),
    },
  },
  sakura: {
    white: {
      accent: m('#c8323c', 0.3),
      bloom: m('#e8798f', 0.4),
      skin: m('#fbeae4', 0.55),
      hair: m('#1f0d10', 0.35),
      hat: m('#1f0d10', 0.3),
      ink: m('#3a1a1e', 0.25),
      light: m('#ffcf6a', 0.4, 0, { emissive: '#ffb84a', emissiveIntensity: 0.8 }),
    },
    black: {
      accent: m('#e6b450', 0.3, 0.4),
      bloom: m('#f39bb0', 0.4),
      skin: m('#f3dcd4', 0.55),
      hair: m('#2a120c', 0.35),
      hat: m('#e6b450', 0.3, 0.4),
      ink: m('#0e0405', 0.2),
      light: m('#ffcf6a', 0.4, 0, { emissive: '#ffb84a', emissiveIntensity: 0.8 }),
    },
  },
};

/** The painted surface of a set's pieces (grain, swirl, veins, brushed metal). */
export const PIECE_SURFACE: Partial<Record<ConcretePieceSet, SurfaceKind>> = {
  wood: 'wood',
  resin: 'swirl',
  marble: 'marble',
  midnight: 'brushed',
};

/** Board surface per theme — the 3D twin of each theme's 2D board look. */
export const THEME_BOARD_SURFACE: Record<ThemeId, SurfaceKind> = {
  classic: 'plain',
  wood: 'wood',
  rosin: 'agate',
  marble: 'marble',
  neon: 'neon',
  arcade: 'pixel',
  fantasy: 'plain',
  sakura: 'plain',
  midnight: 'brushed',
};
