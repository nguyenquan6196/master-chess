/** Small Web Audio voices shared by sound effects and generated music. */

export interface Voice {
  ctx: AudioContext;
  dest: AudioNode;
}

/** Enveloped oscillator note. */
export function tone(
  { ctx, dest }: Voice,
  at: number,
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  level = 0.25,
  attack = 0.015,
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(level, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

let noiseBuffer: AudioBuffer | null = null;
function noise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    const len = ctx.sampleRate;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** Filtered noise burst (knocks, hats, snares). */
export function noiseHit(
  { ctx, dest }: Voice,
  at: number,
  dur: number,
  filter: { type: BiquadFilterType; freq: number; q?: number },
  level = 0.5,
): void {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filter.type;
  f.frequency.value = filter.freq;
  f.Q.value = filter.q ?? 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(at, Math.random() * 0.5);
  src.stop(at + dur + 0.02);
}

/** Pitch-dropping sine: kick drums and the thump of a piece. */
export function thump(
  { ctx, dest }: Voice,
  at: number,
  from: number,
  to: number,
  dur: number,
  level = 0.6,
): void {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + dur * 0.9);
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  osc.connect(g).connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** A wooden piece landing on the board. */
export function knock(v: Voice, at: number, strength = 1): void {
  noiseHit(v, at, 0.05, { type: 'bandpass', freq: 1700, q: 1.2 }, 0.9 * strength);
  thump(v, at, 190, 90, 0.08, 0.6 * strength);
}

/** Bell-like chime (inharmonic partials, long decay) for the fantasy pack and music. */
export function chime(v: Voice, at: number, freq: number, dur = 1.2, level = 0.18): void {
  tone(v, at, freq, dur, 'sine', level, 0.005);
  tone(v, at, freq * 2.76, dur * 0.5, 'sine', level * 0.35, 0.005);
  tone(v, at, freq * 5.4, dur * 0.25, 'sine', level * 0.15, 0.005);
}

/** Square-wave blip with a pitch slide (8-bit pack). */
export function blip(
  { ctx, dest }: Voice,
  at: number,
  from: number,
  to: number,
  dur: number,
  level = 0.12,
): void {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.linearRampToValueAtTime(to, at + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, at);
  g.gain.setValueAtTime(level, at + dur * 0.8);
  g.gain.linearRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** MIDI note number → frequency. */
export const midi = (n: number): number => 440 * 2 ** ((n - 69) / 12);
