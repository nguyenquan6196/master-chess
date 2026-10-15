import type { MusicTrack } from '@/core/profile/settingsOptions';
import { audioOut } from './engine';
import { TRACKS, type TrackRecipe } from './musicTracks';
import { chime, midi, noiseHit, thump, tone, type Voice } from './synth';

/**
 * Generative background music (spec §7.1): a small step sequencer turns a track recipe
 * into pads, bass, arpeggio, melody and drums in real time. One track plays at a time;
 * switching crossfades, a hidden tab fades out and pauses scheduling.
 * `intensity` (0–1) adds tension: faster, brighter, denser drums, a low drone.
 */
const LOOKAHEAD_S = 0.15;
const TICK_MS = 30;
const FADE_S = 1.5;
const TENSION = { tempo: 0.12, brightness: 2200, droneLevel: 0.04 } as const;

interface Playing {
  track: MusicTrack;
  recipe: TrackRecipe;
  gain: GainNode;
  filter: BiquadFilterNode;
  step: number;
  nextTime: number;
  timer: ReturnType<typeof setInterval> | null;
}

let current: Playing | null = null;
let intensity = 0;
let seed = 1;

/** Deterministic-ish randomness so melodies vary but are not chaotic. */
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const hit = (pattern: string | null, step: number) => pattern?.[step % 16] === 'x';

function chordNotes(r: TrackRecipe, bar: number): number[] {
  const degree = r.progression[bar % r.progression.length];
  const note = (d: number) => r.root + r.scale[d % 7] + 12 * Math.floor(d / 7);
  return [note(degree), note(degree + 2), note(degree + 4), note(degree + 7)];
}

function scheduleStep(p: Playing, v: Voice, at: number) {
  const r = p.recipe;
  const stepDur = 60 / (r.bpm * (1 + TENSION.tempo * intensity)) / 4;
  const s = p.step % 16;
  const bar = Math.floor(p.step / 16);
  const chord = chordNotes(r, bar);

  if (s === 0) {
    for (const n of chord.slice(0, 3)) {
      tone(v, at, midi(n), stepDur * 16, r.pad.wave, r.pad.level, 0.35);
      tone(v, at, midi(n) * 1.004, stepDur * 16, r.pad.wave, r.pad.level * 0.6, 0.45);
    }
    if (intensity > 0.3)
      tone(
        v,
        at,
        midi(chord[0] - 24),
        stepDur * 16,
        'sawtooth',
        TENSION.droneLevel * intensity,
        0.5,
      );
  }
  if (r.arp) {
    const idx = r.arp[s];
    if (idx >= 0)
      tone(v, at, midi(chord[idx % chord.length] + 12), stepDur * 1.6, r.arpWave, 0.05, 0.005);
  }
  if (hit(r.bass, s)) tone(v, at, midi(chord[0] - 12), stepDur * 2.5, 'triangle', 0.16, 0.01);
  if (hit(r.kick, s) || (intensity > 0.6 && s % 4 === 0)) thump(v, at, 120, 45, 0.18, 0.5);
  if (hit(r.snare, s)) noiseHit(v, at, 0.12, { type: 'bandpass', freq: 1800, q: 0.8 }, 0.18);
  if (hit(r.hat, s) || (intensity > 0.5 && s % 2 === 1)) {
    noiseHit(v, at, 0.03, { type: 'highpass', freq: 7000 }, 0.08);
  }
  if (s % 2 === 0 && rand() < r.melody) {
    const n = r.root + 12 + r.scale[Math.floor(rand() * 7)];
    if (r.melodyVoice === 'chime') chime(v, at, midi(n + 12), 1.2, 0.06);
    else
      tone(
        v,
        at,
        midi(n),
        stepDur * 3,
        r.melodyVoice === 'square' ? 'square' : 'triangle',
        0.05,
        0.005,
      );
  }
  p.nextTime = at + stepDur;
  p.step++;
}

function startScheduler(p: Playing) {
  if (p.timer) return;
  p.timer = setInterval(() => {
    const out = audioOut('music');
    if (!out) return;
    const v: Voice = { ctx: out.ctx, dest: p.filter };
    if (p.nextTime < out.ctx.currentTime) p.nextTime = out.ctx.currentTime + 0.05;
    while (p.nextTime < out.ctx.currentTime + LOOKAHEAD_S) scheduleStep(p, v, p.nextTime);
  }, TICK_MS);
}

function stopScheduler(p: Playing) {
  if (p.timer) clearInterval(p.timer);
  p.timer = null;
}

function fadeOutAndDrop(p: Playing) {
  const out = audioOut('music');
  stopScheduler(p);
  if (!out) return;
  const now = out.ctx.currentTime;
  p.gain.gain.cancelScheduledValues(now);
  p.gain.gain.setValueAtTime(p.gain.gain.value, now);
  p.gain.gain.linearRampToValueAtTime(0, now + FADE_S);
  setTimeout(() => p.gain.disconnect(), (FADE_S + 2) * 1000);
}

/** Plays `track` (crossfading from the current one); null stops the music. */
export function playMusic(track: MusicTrack | null): void {
  if (current?.track === track) return;
  if (current) fadeOutAndDrop(current);
  current = null;
  if (!track) return;
  const out = audioOut('music');
  if (!out) return;
  const gain = out.ctx.createGain();
  gain.gain.setValueAtTime(0, out.ctx.currentTime);
  gain.gain.linearRampToValueAtTime(1, out.ctx.currentTime + FADE_S);
  const filter = out.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.connect(gain).connect(out.dest);
  const recipe = TRACKS[track];
  current = {
    track,
    recipe,
    gain,
    filter,
    step: 0,
    nextTime: out.ctx.currentTime + 0.1,
    timer: null,
  };
  setMusicIntensity(intensity);
  startScheduler(current);
}

/** 0 = calm … 1 = tense (time trouble, losing badly). */
export function setMusicIntensity(value: number): void {
  intensity = Math.max(0, Math.min(1, value));
  const out = audioOut('music');
  if (!current || !out) return;
  current.filter.frequency.setTargetAtTime(
    current.recipe.brightness + TENSION.brightness * intensity,
    out.ctx.currentTime,
    0.5,
  );
}

export const currentMusicTrack = (): MusicTrack | null => current?.track ?? null;

/** Fades out while the tab is hidden and resumes when it is visible again. */
export function installMusicVisibility(): () => void {
  const onChange = () => {
    const out = audioOut('music');
    if (!current || !out) return;
    const now = out.ctx.currentTime;
    current.gain.gain.cancelScheduledValues(now);
    current.gain.gain.setValueAtTime(current.gain.gain.value, now);
    if (document.hidden) {
      current.gain.gain.linearRampToValueAtTime(0, now + 0.3);
      stopScheduler(current);
    } else {
      current.gain.gain.linearRampToValueAtTime(1, now + FADE_S);
      startScheduler(current);
    }
  };
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}
