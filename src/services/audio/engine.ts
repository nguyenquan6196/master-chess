import { useSettings } from '../settings/store';

/**
 * Shared Web Audio graph (spec §7.1). Everything is synthesized — no audio files.
 *   source → bus (music | sfx | ui) → master → destination
 * Bus levels follow the player's settings (mute, master and per-bus volume).
 */
export type Bus = 'music' | 'sfx' | 'ui';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buses: Partial<Record<Bus, GainNode>> = {};
let unsubscribe: (() => void) | null = null;
const unlockListeners = new Set<() => void>();

/** True once the audio context runs (after the first user gesture). */
export const isAudioUnlocked = (): boolean => ctx?.state === 'running';

/** Notified when audio becomes available (for useSyncExternalStore). */
export function subscribeAudioUnlock(fn: () => void): () => void {
  unlockListeners.add(fn);
  return () => unlockListeners.delete(fn);
}

const BUS_RAMP_S = 0.08;

function targetLevel(bus: Bus): number {
  const s = useSettings.getState();
  if (s.muted) return 0;
  if (bus === 'music') return s.musicMode === 'off' ? 0 : s.musicVolume;
  if (bus === 'sfx') return s.sfxEnabled ? s.sfxVolume : 0;
  return s.uiVolume;
}

function applyLevels(): void {
  if (!ctx || !master) return;
  const s = useSettings.getState();
  const now = ctx.currentTime;
  master.gain.setTargetAtTime(s.muted ? 0 : s.masterVolume, now, BUS_RAMP_S);
  for (const bus of ['music', 'sfx', 'ui'] as const) {
    buses[bus]?.gain.setTargetAtTime(targetLevel(bus), now, BUS_RAMP_S);
  }
}

/** Creates the context lazily. Must first run from a user gesture (browser autoplay rules). */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
    for (const bus of ['music', 'sfx', 'ui'] as const) {
      const g = ctx.createGain();
      g.connect(master);
      buses[bus] = g;
    }
    applyLevels();
    unsubscribe ??= useSettings.subscribe(applyLevels);
  }
  const notify = () => unlockListeners.forEach((fn) => fn());
  if (ctx.state === 'suspended') void ctx.resume().then(notify);
  else notify();
}

/** The running context and the input node of a bus, or null before unlock. */
export function audioOut(bus: Bus): { ctx: AudioContext; dest: GainNode } | null {
  if (!ctx || ctx.state !== 'running') return null;
  const dest = buses[bus];
  return dest ? { ctx, dest } : null;
}

/** Unlocks audio on the first pointer/key interaction anywhere (call once on startup). */
export function installAudioUnlock(): () => void {
  const onFirst = () => unlockAudio();
  window.addEventListener('pointerdown', onFirst, { once: true });
  window.addEventListener('keydown', onFirst, { once: true });
  return () => {
    window.removeEventListener('pointerdown', onFirst);
    window.removeEventListener('keydown', onFirst);
  };
}
