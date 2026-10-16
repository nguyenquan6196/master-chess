import type { ConcretePieceSet } from '@/core/profile/settingsOptions';

/**
 * 3D materials per piece set (Phase 6): the same Staunton shapes everywhere, dressed in
 * each set's material — oak/walnut, clear resin, marble, glowing neon tubes, flat pixel
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
