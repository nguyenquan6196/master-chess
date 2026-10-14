import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_PROFILE_SETTINGS, type ProfileSettings } from '@/core/profile/schema';
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
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
  update: (patch: Partial<ProfileSettings>) => void;
}

export function pickProfileSettings(s: ProfileSettings): ProfileSettings {
  return {
    locale: s.locale,
    theme: s.theme,
    sfxEnabled: s.sfxEnabled,
    sfxVolume: s.sfxVolume,
    showEvalBar: s.showEvalBar,
  };
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE_SETTINGS,
      localeChosen: false,
      setLocale: (locale) => set({ locale, localeChosen: true }),
      setTheme: (theme) => set({ theme }),
      update: (patch) => set(patch),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ...pickProfileSettings(s), localeChosen: s.localeChosen }),
      // v1 only had locale/theme/localeChosen.
      migrate: (persisted) => ({ ...DEFAULT_PROFILE_SETTINGS, ...(persisted as object) }),
      // Server HTML always renders defaults; we rehydrate after mount to avoid hydration mismatches.
      skipHydration: true,
    },
  ),
);
