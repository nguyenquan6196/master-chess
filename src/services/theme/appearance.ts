import type { ProfileSettings } from '@/core/profile/schema';
import {
  THEME_IDS,
  type Accent,
  type BoardStyle,
  type Gradient,
  type Highlight,
  type ThemeId,
} from '@/core/profile/settingsOptions';

/**
 * Appearance presets (spec §7.2): themes are `[data-theme]` blocks in styles/themes.css;
 * the player's overrides (board, accent, highlight, buttons, backdrop) become inline CSS
 * variables on <html>. Colour values live here, never in components.
 */

export interface ThemeInfo {
  dark: boolean;
  /** Preview swatch: background, board light, board dark, accent. */
  swatch: [string, string, string, string];
  /** Animated backdrop particles (BackdropEffects), if any. */
  particles: 'petals' | 'stars' | 'neon' | 'pixels' | 'dust' | null;
}

export const THEME_INFO: Record<ThemeId, ThemeInfo> = {
  classic: { dark: false, swatch: ['#f3f1ea', '#eeeed2', '#769656', '#5d8c3b'], particles: null },
  wood: { dark: false, swatch: ['#e7cfa8', '#f0d9b5', '#b58863', '#9c5a2a'], particles: 'dust' },
  rosin: { dark: false, swatch: ['#ecd6ae', '#ecd3a4', '#8a5d36', '#1c7468'], particles: 'dust' },
  marble: { dark: false, swatch: ['#f2f2f0', '#f4f3ef', '#a3a7ad', '#3f5f7f'], particles: null },
  neon: { dark: true, swatch: ['#0a0a18', '#2a2a52', '#15152e', '#ff3fd8'], particles: 'neon' },
  arcade: { dark: true, swatch: ['#0f2a12', '#9bbc0f', '#306230', '#9bbc0f'], particles: 'pixels' },
  fantasy: { dark: true, swatch: ['#160f2b', '#e8d9b5', '#6b4f8a', '#f2c14e'], particles: 'stars' },
  sakura: {
    dark: false,
    swatch: ['#fdf2f4', '#fff0f3', '#e8a0b4', '#d6517d'],
    particles: 'petals',
  },
  midnight: {
    dark: true,
    swatch: ['#12131c', '#9fa8c7', '#4b5478', '#7c8cff'],
    particles: 'stars',
  },
};

export const THEMES = THEME_IDS;
export const DEFAULT_LIGHT_THEME: ThemeId = 'classic';
export const DEFAULT_DARK_THEME: ThemeId = 'midnight';

export const BOARD_PRESETS: Record<Exclude<BoardStyle, 'theme'>, [light: string, dark: string]> = {
  green: ['#eeeed2', '#769656'],
  brown: ['#f0d9b5', '#b58863'],
  blue: ['#dee3e6', '#8ca2ad'],
  gray: ['#f4f3ef', '#a3a7ad'],
  purple: ['#e8d9f5', '#8e6bb8'],
  pink: ['#fff0f3', '#e8a0b4'],
  neon: ['#2a2a52', '#15152e'],
  gameboy: ['#9bbc0f', '#306230'],
};

export const ACCENT_PRESETS: Record<
  Exclude<Accent, 'theme'>,
  [accent: string, hover: string, fg: string]
> = {
  green: ['#5d8c3b', '#4f7a31', '#ffffff'],
  blue: ['#2f6fd6', '#2459b0', '#ffffff'],
  purple: ['#7c4ad6', '#6638b8', '#ffffff'],
  pink: ['#d6517d', '#bf4069', '#ffffff'],
  orange: ['#e07a1f', '#c26612', '#ffffff'],
  red: ['#d23c2f', '#b52f24', '#ffffff'],
  teal: ['#14928a', '#0f7a73', '#ffffff'],
  gold: ['#d9a521', '#bd8d14', '#2a1a00'],
};

export const HIGHLIGHT_PRESETS: Record<
  Exclude<Highlight, 'theme'>,
  [last: string, selected: string]
> = {
  yellow: ['rgb(255 235 59 / 0.45)', 'rgb(255 235 59 / 0.6)'],
  blue: ['rgb(80 150 255 / 0.4)', 'rgb(80 150 255 / 0.58)'],
  green: ['rgb(110 200 90 / 0.42)', 'rgb(110 200 90 / 0.6)'],
  red: ['rgb(240 90 80 / 0.4)', 'rgb(240 90 80 / 0.58)'],
};

export const GRADIENT_PRESETS: Record<Gradient, string> = {
  sunset: 'linear-gradient(160deg, #ffb07c 0%, #ff6f91 45%, #845ec2 100%)',
  ocean: 'linear-gradient(160deg, #a1e3ff 0%, #3a8fd9 50%, #1b3a6b 100%)',
  forest: 'linear-gradient(160deg, #d4f5b0 0%, #5fa85a 50%, #1f4d2c 100%)',
  aurora: 'linear-gradient(160deg, #0f2027 0%, #2c5364 40%, #43c6ac 75%, #f8ffae 100%)',
  dusk: 'linear-gradient(160deg, #2b1055 0%, #7597de 100%)',
};

export const BUTTON_RADIUS = { square: '0', pill: '999px' } as const;

/** Everything the inline-variable computation needs (serialisable for the boot script). */
export const APPEARANCE_PRESETS = {
  board: BOARD_PRESETS,
  accent: ACCENT_PRESETS,
  highlight: HIGHLIGHT_PRESETS,
  gradient: GRADIENT_PRESETS,
  radius: BUTTON_RADIUS,
};

type AppearanceInput = Pick<
  ProfileSettings,
  | 'board'
  | 'accent'
  | 'highlight'
  | 'buttonStyle'
  | 'backdrop'
  | 'backdropColor'
  | 'backdropGradient'
  | 'backdropDim'
  | 'backdropBlur'
>;

/**
 * Inline CSS variables for the player's overrides. Self-contained on purpose (no outer
 * references): its source is embedded in the pre-paint boot script.
 */
export function computeAppearanceVars(
  s: AppearanceInput,
  presets: typeof APPEARANCE_PRESETS,
): Record<string, string> {
  const v: Record<string, string> = {};
  const board = s.board !== 'theme' ? presets.board[s.board] : null;
  if (board) {
    v['--mc-board-light'] = board[0];
    v['--mc-board-dark'] = board[1];
    v['--mc-board-notation-light'] = board[1];
    v['--mc-board-notation-dark'] = board[0];
  }
  const accent = s.accent !== 'theme' ? presets.accent[s.accent] : null;
  if (accent) {
    v['--mc-accent'] = accent[0];
    v['--mc-accent-hover'] = accent[1];
    v['--mc-accent-fg'] = accent[2];
  }
  const hl = s.highlight !== 'theme' ? presets.highlight[s.highlight] : null;
  if (hl) {
    v['--mc-hl-last'] = hl[0];
    v['--mc-hl-selected'] = hl[1];
  }
  if (s.buttonStyle === 'square' || s.buttonStyle === 'pill') {
    v['--mc-radius-btn'] = presets.radius[s.buttonStyle];
  }
  if (s.backdrop === 'none') {
    v['--mc-backdrop-image'] = 'none';
  } else if (s.backdrop === 'color') {
    v['--mc-backdrop-image'] = 'linear-gradient(' + s.backdropColor + ',' + s.backdropColor + ')';
  } else if (s.backdrop === 'gradient') {
    v['--mc-backdrop-image'] = presets.gradient[s.backdropGradient];
  }
  if (s.backdrop === 'color' || s.backdrop === 'gradient' || s.backdrop === 'image') {
    v['--mc-backdrop-size'] = 'cover';
    v['--mc-backdrop-mask'] = 'none';
    v['--mc-backdrop-opacity'] = '1';
  }
  v['--mc-backdrop-dim'] = String(s.backdropDim);
  v['--mc-backdrop-blur'] = s.backdropBlur + 'px';
  return v;
}

/** Inline variables currently set by us, so switching settings can clear stale ones. */
const MANAGED_VARS = [
  '--mc-board-light',
  '--mc-board-dark',
  '--mc-board-notation-light',
  '--mc-board-notation-dark',
  '--mc-accent',
  '--mc-accent-hover',
  '--mc-accent-fg',
  '--mc-hl-last',
  '--mc-hl-selected',
  '--mc-radius-btn',
  '--mc-backdrop-image',
  '--mc-backdrop-size',
  '--mc-backdrop-mask',
  '--mc-backdrop-opacity',
  '--mc-backdrop-dim',
  '--mc-backdrop-blur',
];

/** Applies the overrides to <html>; `imageUrl` is the custom backdrop (object URL). */
export function applyAppearance(s: AppearanceInput, imageUrl: string | null): void {
  const root = document.documentElement;
  const vars = computeAppearanceVars(s, APPEARANCE_PRESETS);
  if (s.backdrop === 'image' && imageUrl) vars['--mc-backdrop-image'] = `url("${imageUrl}")`;
  for (const name of MANAGED_VARS) {
    if (vars[name] === undefined) root.style.removeProperty(name);
    else root.style.setProperty(name, vars[name]);
  }
}

export type ThemePreference = 'auto' | ThemeId;

export function resolveTheme(pref: ThemePreference, prefersDark: boolean): ThemeId {
  if (pref === 'auto') return prefersDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  return pref;
}
