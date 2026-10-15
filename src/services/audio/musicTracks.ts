import type { MusicTrack } from '@/core/profile/settingsOptions';

/**
 * Generated music moods (spec §7.1): each track is a recipe for the sequencer in
 * music.ts. Steps are 16th notes; drum patterns use "x" (hit) and "." (rest) over 16 steps.
 */
export interface TrackRecipe {
  bpm: number;
  /** MIDI note of the key's root (around C3–C4). */
  root: number;
  /** Scale intervals in semitones. */
  scale: number[];
  /** Chord per bar as scale degree (0-based), looped. */
  progression: number[];
  pad: { wave: OscillatorType; level: number };
  /** Arpeggio: chord-tone index per 16th step (-1 = rest), looped per bar. */
  arp: number[] | null;
  arpWave: OscillatorType;
  /** Bass hits per bar (16 steps); null = no bass. */
  bass: string | null;
  kick: string | null;
  snare: string | null;
  hat: string | null;
  /** Chance per 8th note of a melody note. */
  melody: number;
  melodyVoice: 'chime' | 'pluck' | 'square';
  /** Low-pass cutoff (Hz) at intensity 0; tension opens it. */
  brightness: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];

export const TRACKS: Record<MusicTrack, TrackRecipe> = {
  menu: {
    bpm: 76,
    root: 60,
    scale: MAJOR,
    progression: [0, 5, 3, 4],
    pad: { wave: 'triangle', level: 0.05 },
    arp: [0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 1, -1, 2, -1, 3, -1],
    arpWave: 'triangle',
    bass: 'x.......x.......',
    kick: null,
    snare: null,
    hat: null,
    melody: 0.18,
    melodyVoice: 'chime',
    brightness: 1800,
  },
  learn: {
    bpm: 70,
    root: 57,
    scale: MINOR,
    progression: [0, 5, 2, 6],
    pad: { wave: 'sine', level: 0.06 },
    arp: [0, -1, -1, 2, -1, -1, 1, -1, 0, -1, -1, 2, -1, -1, 3, -1],
    arpWave: 'sine',
    bass: 'x...............',
    kick: null,
    snare: null,
    hat: null,
    melody: 0.12,
    melodyVoice: 'pluck',
    brightness: 1500,
  },
  practice: {
    bpm: 98,
    root: 65,
    scale: MAJOR,
    progression: [0, 4, 5, 3],
    pad: { wave: 'triangle', level: 0.04 },
    arp: [0, 1, 2, 1, 0, 1, 2, 3, 0, 1, 2, 1, 0, 1, 2, 3],
    arpWave: 'triangle',
    bass: 'x..x..x.x..x..x.',
    kick: 'x.......x.......',
    snare: null,
    hat: '..x...x...x...x.',
    melody: 0.15,
    melodyVoice: 'pluck',
    brightness: 2400,
  },
  rush: {
    bpm: 140,
    root: 62,
    scale: MINOR,
    progression: [0, 5, 3, 4],
    pad: { wave: 'sawtooth', level: 0.025 },
    arp: [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 1, 0, 2],
    arpWave: 'square',
    bass: 'x.x.x.x.x.x.x.x.',
    kick: 'x...x...x...x...',
    snare: '....x.......x...',
    hat: 'x.x.x.x.x.x.x.x.',
    melody: 0.1,
    melodyVoice: 'square',
    brightness: 3200,
  },
  bot1: {
    bpm: 84,
    root: 55,
    scale: MAJOR,
    progression: [0, 3, 4, 3],
    pad: { wave: 'triangle', level: 0.05 },
    arp: [0, -1, 2, -1, 1, -1, 2, -1, 0, -1, 2, -1, 1, -1, 3, -1],
    arpWave: 'triangle',
    bass: 'x.......x...x...',
    kick: null,
    snare: null,
    hat: '....x.......x...',
    melody: 0.14,
    melodyVoice: 'chime',
    brightness: 2000,
  },
  bot2: {
    bpm: 92,
    root: 62,
    scale: DORIAN,
    progression: [0, 3, 0, 4],
    pad: { wave: 'triangle', level: 0.045 },
    arp: [0, -1, 1, 2, -1, 1, 0, -1, 0, -1, 1, 2, -1, 1, 3, -1],
    arpWave: 'triangle',
    bass: 'x.....x.x.......',
    kick: 'x.......x.......',
    snare: null,
    hat: '..x...x...x...x.',
    melody: 0.12,
    melodyVoice: 'pluck',
    brightness: 2100,
  },
  bot3: {
    bpm: 100,
    root: 52,
    scale: MINOR,
    progression: [0, 5, 6, 4],
    pad: { wave: 'sawtooth', level: 0.03 },
    arp: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 2, 3, 2],
    arpWave: 'triangle',
    bass: 'x..x....x..x..x.',
    kick: 'x.....x.x.......',
    snare: '....x.......x...',
    hat: 'x.x.x.x.x.x.x.x.',
    melody: 0.1,
    melodyVoice: 'pluck',
    brightness: 1800,
  },
  bot4: {
    bpm: 112,
    root: 48,
    scale: PHRYGIAN,
    progression: [0, 1, 0, 6],
    pad: { wave: 'sawtooth', level: 0.035 },
    arp: [0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 3, 2, 1, 0],
    arpWave: 'sawtooth',
    bass: 'x.xx..x.x.xx..x.',
    kick: 'x..x..x.x..x..x.',
    snare: '....x.......x..x',
    hat: 'xxxxxxxxxxxxxxxx',
    melody: 0.08,
    melodyVoice: 'square',
    brightness: 1400,
  },
};

/** The bot tier (1–4, spec §7.1) → its track. */
export const BOT_TIER_TRACK: Record<1 | 2 | 3 | 4, MusicTrack> = {
  1: 'bot1',
  2: 'bot2',
  3: 'bot3',
  4: 'bot4',
};

/** Default track for a page path (auto mode). */
export function trackForPath(path: string): MusicTrack {
  if (path.startsWith('/learn')) return 'learn';
  if (path.startsWith('/practice/rush')) return 'rush';
  if (path.startsWith('/practice')) return 'practice';
  if (path.startsWith('/play')) return 'bot1';
  return 'menu';
}
