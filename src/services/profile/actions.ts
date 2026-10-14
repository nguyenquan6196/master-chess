import type { Profile } from '@/core/profile/schema';
import { unlockAudio } from '../audio/sfx';
import { requestPersistentStorage } from '../db/db';
import { profileRepo } from '../db/repositories';
import { pickProfileSettings, useSettings } from '../settings/store';
import { useSession } from './session';

/** Makes `profile` the active player and applies their settings. Call from a click. */
export async function selectProfile(profile: Profile): Promise<void> {
  unlockAudio();
  requestPersistentStorage();
  await profileRepo.touch(profile.id);
  useSettings.setState({ ...profile.settings, localeChosen: true });
  useSession.getState().setProfile({ ...profile, lastActiveAt: Date.now() });
}

/** Creates a player with the language/theme currently shown, then selects them. */
export async function createProfile(name: string, avatar: string): Promise<Profile> {
  const profile = await profileRepo.create(
    name,
    avatar,
    pickProfileSettings(useSettings.getState()),
  );
  await selectProfile(profile);
  return profile;
}

export function switchProfile(): void {
  useSession.getState().setProfile(null);
}

/** Restores the active player after a reload (sessionStorage only keeps the id). */
export async function restoreSession(): Promise<void> {
  try {
    await useSession.persist.rehydrate();
    const { profileId } = useSession.getState();
    if (!profileId) return;
    const profile = await profileRepo.get(profileId);
    if (profile) useSettings.setState({ ...profile.settings, localeChosen: true });
    useSession.getState().setProfile(profile ?? null);
  } finally {
    useSession.setState({ hydrated: true });
  }
}

/** Persists settings changes of the active player (subscribed in AppProviders). */
export function syncSettingsToProfile(): () => void {
  return useSettings.subscribe((state, prev) => {
    const profile = useSession.getState().profile;
    if (!profile) return;
    const next = pickProfileSettings(state);
    const before = pickProfileSettings(prev);
    if (JSON.stringify(next) === JSON.stringify(before)) return;
    void profileRepo.updateSettings(profile.id, next);
    useSession.setState({ profile: { ...profile, settings: next } });
  });
}
