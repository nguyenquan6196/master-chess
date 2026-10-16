import { describe, expect, it } from 'vitest';
import { frameRateVerdict, isLowEndDevice, PERF_3D } from './perf';

const frames = (fps: number, n: number) => Array.from({ length: n }, () => 1 / fps);
const enough = PERF_3D.warmupFrames + PERF_3D.sampleFrames;

describe('core/board3d/perf', () => {
  it('spots low-end devices', () => {
    expect(isLowEndDevice({ cores: 8, memoryGb: 8 })).toBe(false);
    expect(isLowEndDevice({})).toBe(false);
    expect(isLowEndDevice({ cores: 2 })).toBe(true);
    expect(isLowEndDevice({ cores: 8, memoryGb: 1 })).toBe(true);
    expect(isLowEndDevice({ cores: 8, saveData: true })).toBe(true);
  });

  it('waits for enough frames, then judges the average', () => {
    expect(frameRateVerdict(frames(60, enough - 1))).toBe('pending');
    expect(frameRateVerdict(frames(60, enough))).toBe('ok');
    expect(frameRateVerdict(frames(15, enough))).toBe('slow');
    // A slow warm-up does not count.
    expect(
      frameRateVerdict([...frames(5, PERF_3D.warmupFrames), ...frames(50, PERF_3D.sampleFrames)]),
    ).toBe('ok');
  });

  it('ignores pauses (hidden tab)', () => {
    const withPauses = [...frames(60, enough)];
    withPauses.splice(40, 0, 3, 5, 10);
    expect(frameRateVerdict(withPauses)).toBe('ok');
  });
});
