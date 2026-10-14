import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Profile } from '@/core/profile/schema';

/**
 * Which player is active in this tab. Kept in sessionStorage: a reload continues as the
 * same player, but a new visit starts at the "choose player" screen (spec §8.1).
 */
interface SessionState {
  profileId: string | null;
  /** Cached copy of the active profile for rendering (source of truth is IndexedDB). */
  profile: Profile | null;
  /** True once the saved session (if any) has been restored from IndexedDB. */
  hydrated: boolean;
  setProfile: (profile: Profile | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      profileId: null,
      profile: null,
      hydrated: false,
      setProfile: (profile) => set({ profile, profileId: profile?.id ?? null }),
    }),
    {
      name: 'mc-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ profileId }) => ({ profileId }),
      skipHydration: true,
    },
  ),
);
