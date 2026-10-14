import { useSettings } from '../settings/store';

/**
 * Sound effects synthesized with the Web Audio API — no audio files, so nothing to
 * license or download. Phase 5 adds Howler.js, music and sound packs (spec §7.1).
 */
export type SfxName =
  | 'move'
  | 'capture'
  | 'castle'
  | 'check'
  | 'promote'
  | 'gameStart'
  | 'win'
  | 'loss'
  | 'draw'
  | 'notify'
  | 'illegal';

let ctx: AudioContext | null = null;

/** Must be called from a user gesture (click) — browsers block audio before that. */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

function out(volume: number): GainNode | null {
  if (!ctx || ctx.state !== 'running') return null;
  const g = ctx.createGain();
  g.gain.value = volume;
  g.connect(ctx.destination);
  return g;
}

/** Short filtered noise burst + low thump: a wooden piece landing on the board. */
function knock(dest: GainNode, at: number, strength = 1) {
  const c = dest.context as AudioContext;
  const len = Math.floor(c.sampleRate * 0.05);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4;
  const noise = c.createBufferSource();
  noise.buffer = buf;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1700;
  band.Q.value = 1.2;
  const ng = c.createGain();
  ng.gain.value = 0.9 * strength;
  noise.connect(band).connect(ng).connect(dest);
  noise.start(at);

  const osc = c.createOscillator();
  osc.frequency.setValueAtTime(190, at);
  osc.frequency.exponentialRampToValueAtTime(90, at + 0.07);
  const og = c.createGain();
  og.gain.setValueAtTime(0.6 * strength, at);
  og.gain.exponentialRampToValueAtTime(0.001, at + 0.08);
  osc.connect(og).connect(dest);
  osc.start(at);
  osc.stop(at + 0.09);
}

function tone(
  dest: GainNode,
  at: number,
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  level = 0.25,
) {
  const c = dest.context as AudioContext;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(level, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function playSfx(name: SfxName): void {
  const { sfxEnabled, sfxVolume } = useSettings.getState();
  if (!sfxEnabled || sfxVolume <= 0) return;
  const dest = out(sfxVolume);
  if (!dest || !ctx) return;
  const t = ctx.currentTime + 0.01;

  switch (name) {
    case 'move':
      knock(dest, t);
      break;
    case 'capture':
      knock(dest, t, 1.3);
      knock(dest, t + 0.06, 0.8);
      break;
    case 'castle':
      knock(dest, t);
      knock(dest, t + 0.11);
      break;
    case 'check':
      knock(dest, t);
      tone(dest, t + 0.03, 880, 0.12, 'triangle');
      tone(dest, t + 0.12, 1320, 0.16, 'triangle');
      break;
    case 'promote':
      knock(dest, t);
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(dest, t + 0.05 + i * 0.07, f, 0.18, 'triangle', 0.18),
      );
      break;
    case 'gameStart':
      tone(dest, t, 523, 0.18, 'triangle', 0.2);
      tone(dest, t + 0.12, 784, 0.25, 'triangle', 0.2);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(dest, t + i * 0.11, f, 0.35, 'triangle', 0.22));
      break;
    case 'loss':
      [392, 349, 311, 262].forEach((f, i) => tone(dest, t + i * 0.16, f, 0.4, 'sine', 0.22));
      break;
    case 'draw':
      tone(dest, t, 523, 0.3, 'sine', 0.2);
      tone(dest, t + 0.18, 523, 0.35, 'sine', 0.2);
      break;
    case 'notify':
      tone(dest, t, 988, 0.12, 'sine', 0.18);
      break;
    case 'illegal':
      tone(dest, t, 140, 0.12, 'square', 0.08);
      break;
  }
}
