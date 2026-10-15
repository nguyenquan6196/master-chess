'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import type { MusicTrack } from '@/core/profile/settingsOptions';
import { useSettings } from '../settings/store';
import { isAudioUnlocked, subscribeAudioUnlock } from './engine';
import { installMusicVisibility, playMusic, setMusicIntensity } from './music';
import { trackForPath } from './musicTracks';

/** A screen can ask for a specific track and tension (e.g. a bot game). */
interface MusicScene {
  scene: { track: MusicTrack; intensity: number } | null;
  setScene: (scene: { track: MusicTrack; intensity: number } | null) => void;
}

export const useMusicScene = create<MusicScene>()((set) => ({
  scene: null,
  setScene: (scene) => set({ scene }),
}));

/**
 * Picks what plays: nothing when music is off, the chosen track in "fixed" mode,
 * otherwise the current screen's scene or the page's default track (spec §7.1).
 */
export function useMusicDirector(pathname: string): void {
  const mode = useSettings((s) => s.musicMode);
  const muted = useSettings((s) => s.muted);
  const fixed = useSettings((s) => s.musicTrack);
  const scene = useMusicScene((s) => s.scene);
  const unlocked = useSyncExternalStore(subscribeAudioUnlock, isAudioUnlocked, () => false);

  const track: MusicTrack | null =
    mode === 'off' || muted
      ? null
      : mode === 'fixed'
        ? fixed
        : (scene?.track ?? trackForPath(pathname));
  const intensity = mode === 'auto' ? (scene?.intensity ?? 0) : 0;

  useEffect(() => {
    if (unlocked) playMusic(track);
  }, [unlocked, track]);

  useEffect(() => {
    setMusicIntensity(intensity);
  }, [intensity]);

  useEffect(() => installMusicVisibility(), []);
}
