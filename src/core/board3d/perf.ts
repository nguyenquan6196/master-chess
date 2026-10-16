/**
 * When the 3D board is too heavy (Phase 6, spec §13.4): a quick device check before it
 * loads, and a frame-rate check while it runs. Pure; callers pass in what they measured.
 */

export const PERF_3D = {
  /** At most this many CPU cores counts as a low-end device. */
  maxCoresLowEnd: 2,
  /** At most this many GB of memory (navigator.deviceMemory) counts as low-end. */
  maxMemoryGbLowEnd: 2,
  /** Average frame rate below which 3D switches itself off. */
  minFps: 24,
  /** Frames to ignore while the scene warms up (shader compile, first shadows). */
  warmupFrames: 30,
  /** Frames measured after the warm-up. */
  sampleFrames: 120,
  /** Longer frames are pauses (hidden tab, debugger), not slowness: skipped. */
  maxFrameSeconds: 0.5,
} as const;

export interface DeviceHints {
  cores?: number;
  memoryGb?: number;
  saveData?: boolean;
}

/** True when the device should not run the 3D board at all. */
export function isLowEndDevice(h: DeviceHints): boolean {
  if (h.saveData) return true;
  if (h.cores !== undefined && h.cores <= PERF_3D.maxCoresLowEnd) return true;
  if (h.memoryGb !== undefined && h.memoryGb <= PERF_3D.maxMemoryGbLowEnd) return true;
  return false;
}

/**
 * Verdict on a run of frame durations (seconds): 'pending' until enough frames were seen,
 * then 'slow' or 'ok'.
 */
export function frameRateVerdict(frameSeconds: readonly number[]): 'pending' | 'slow' | 'ok' {
  const usable = frameSeconds.filter((s) => s > 0 && s <= PERF_3D.maxFrameSeconds);
  if (usable.length < PERF_3D.warmupFrames + PERF_3D.sampleFrames) return 'pending';
  const sample = usable.slice(PERF_3D.warmupFrames, PERF_3D.warmupFrames + PERF_3D.sampleFrames);
  const avg = sample.reduce((a, b) => a + b, 0) / sample.length;
  return 1 / avg < PERF_3D.minFps ? 'slow' : 'ok';
}
