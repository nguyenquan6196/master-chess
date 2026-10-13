import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, type Locale } from '../i18n/config';
import { DEFAULT_THEME_PREFERENCE, type ThemePreference } from '../theme/themes';
import { SETTINGS_STORAGE_KEY } from './keys';

/**
 * App-wide settings. Phase 1 moves these into the player profile (IndexedDB, spec §8.1);
 * until then they live in localStorage.
 */
interface SettingsState {
  locale: Locale;
  theme: ThemePreference;
  /** False until a locale was chosen or detected, so first visits can follow the browser. */
  localeChosen: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      theme: DEFAULT_THEME_PREFERENCE,
      localeChosen: false,
      setLocale: (locale) => set({ locale, localeChosen: true }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale, theme, localeChosen }) => ({ locale, theme, localeChosen }),
      // Server HTML always renders defaults; we rehydrate after mount to avoid hydration mismatches.
      skipHydration: true,
    },
  ),
);
