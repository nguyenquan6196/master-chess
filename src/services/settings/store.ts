import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_PROFILE_SETTINGS,
  migratePieceSetV8,
  type ProfileSettings,
} from '@/core/profile/schema';
import type { Locale } from '../i18n/config';
import type { ThemePreference } from '../theme/themes';
import { SETTINGS_STORAGE_KEY } from './keys';

/**
 * Settings of the active player. The source of truth is the profile in IndexedDB
 * (synced by AppProviders); localStorage keeps a copy so theme/language apply before
 * paint and on the "choose player" screen.
 */
interface SettingsState extends ProfileSettings {
  /** False until a locale was chosen or detected, so first visits can follow the browser. */
  localeChosen: boolean;
  /** Bumped when the custom backdrop image changes (not persisted). */
  backdropVersion: number;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
  update: (patch: Partial<ProfileSettings>) => void;
}

const SETTING_KEYS = Object.keys(DEFAULT_PROFILE_SETTINGS) as (keyof ProfileSettings)[];

/** Only the persisted settings fields (drops store actions and UI-only flags). */
export function pickProfileSettings(s: ProfileSettings): ProfileSettings {
  return Object.fromEntries(SETTING_KEYS.map((k) => [k, s[k]])) as ProfileSettings;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE_SETTINGS,
      localeChosen: false,
      backdropVersion: 0,
      setLocale: (locale) => set({ locale, localeChosen: true }),
      setTheme: (theme) => set({ theme }),
      update: (patch) => set(patch),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ...pickProfileSettings(s), localeChosen: s.localeChosen }),
      // Older versions lack later settings: fill them with defaults.
      // v4: removed piece sets (minimal, glyph) follow the theme again.
      migrate: (persisted) =>
        migratePieceSetV8({ settings: { ...DEFAULT_PROFILE_SETTINGS, ...(persisted as object) } })
          .settings,
      // Server HTML always renders defaults; we rehydrate after mount to avoid hydration mismatches.
      skipHydration: true,
    },
  ),
);
