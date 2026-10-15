import { THEME_PREFERENCE_VALUES } from '@/core/profile/schema';

export { resolveTheme, THEME_INFO, THEMES, type ThemePreference } from './appearance';

/** "auto" (follow the system light/dark preference) plus every theme id. */
export const THEME_PREFERENCES = THEME_PREFERENCE_VALUES;

export function isThemePreference(value: unknown): value is (typeof THEME_PREFERENCES)[number] {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}
