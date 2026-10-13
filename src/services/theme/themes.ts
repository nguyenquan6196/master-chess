/**
 * Theme ids map to `[data-theme="<id>"]` blocks in `src/styles/themes.css`.
 * Phase 5 replaces this with manifest-driven themes (spec §7.2).
 */
export const THEMES = ['classic', 'midnight'] as const;
export type ThemeId = (typeof THEMES)[number];

export const THEME_PREFERENCES = ['auto', ...THEMES] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'auto';

const LIGHT_THEME: ThemeId = 'classic';
const DARK_THEME: ThemeId = 'midnight';

export function resolveTheme(pref: ThemePreference, prefersDark: boolean): ThemeId {
  if (pref === 'auto') return prefersDark ? DARK_THEME : LIGHT_THEME;
  return pref;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}
