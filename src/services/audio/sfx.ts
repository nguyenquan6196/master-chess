import type { SoundPack } from '@/core/profile/settingsOptions';
import { useSettings } from '../settings/store';
import { audioOut, unlockAudio } from './engine';
import { blip, chime, knock, noiseHit, thump, tone, type Voice } from './synth';

export { unlockAudio };

/**
 * Sound effects synthesized with the Web Audio API — no audio files. Three packs
 * (spec §7.1): classic (wood), arcade (8-bit), fantasy (chimes). UI sounds go to their
 * own bus so they have a separate volume.
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
  | 'illegal'
  | 'rankUp';

export type UiSound = 'click' | 'toggle' | 'open';

type Pack = Record<SfxName, (v: Voice, t: number) => void>;

const C_MAJOR = [523, 659, 784, 1047];

const classic: Pack = {
  move: (v, t) => knock(v, t),
  capture: (v, t) => {
    knock(v, t, 1.3);
    knock(v, t + 0.06, 0.8);
  },
  castle: (v, t) => {
    knock(v, t);
    knock(v, t + 0.11);
  },
  check: (v, t) => {
    knock(v, t);
    tone(v, t + 0.03, 880, 0.12, 'triangle');
    tone(v, t + 0.12, 1320, 0.16, 'triangle');
  },
  promote: (v, t) => {
    knock(v, t);
    C_MAJOR.forEach((f, i) => tone(v, t + 0.05 + i * 0.07, f, 0.18, 'triangle', 0.18));
  },
  gameStart: (v, t) => {
    tone(v, t, 523, 0.18, 'triangle', 0.2);
    tone(v, t + 0.12, 784, 0.25, 'triangle', 0.2);
  },
  win: (v, t) => C_MAJOR.forEach((f, i) => tone(v, t + i * 0.11, f, 0.35, 'triangle', 0.22)),
  loss: (v, t) =>
    [392, 349, 311, 262].forEach((f, i) => tone(v, t + i * 0.16, f, 0.4, 'sine', 0.22)),
  draw: (v, t) => {
    tone(v, t, 523, 0.3, 'sine', 0.2);
    tone(v, t + 0.18, 523, 0.35, 'sine', 0.2);
  },
  notify: (v, t) => tone(v, t, 988, 0.12, 'sine', 0.18),
  illegal: (v, t) => tone(v, t, 140, 0.12, 'square', 0.08),
  rankUp: (v, t) => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      tone(v, t + i * 0.09, f, 0.5, 'triangle', 0.2),
    );
    tone(v, t + 0.6, 2093, 0.9, 'sine', 0.12);
  },
};

const arcade: Pack = {
  move: (v, t) => blip(v, t, 440, 330, 0.06),
  capture: (v, t) => {
    noiseHit(v, t, 0.09, { type: 'highpass', freq: 1200 }, 0.35);
    blip(v, t, 660, 220, 0.1);
  },
  castle: (v, t) => {
    blip(v, t, 392, 392, 0.05);
    blip(v, t + 0.08, 523, 523, 0.05);
  },
  check: (v, t) => {
    blip(v, t, 880, 880, 0.06);
    blip(v, t + 0.09, 880, 880, 0.06);
  },
  promote: (v, t) =>
    [523, 659, 784, 1047, 1319].forEach((f, i) => blip(v, t + i * 0.05, f, f, 0.05)),
  gameStart: (v, t) => [392, 523, 659, 784].forEach((f, i) => blip(v, t + i * 0.07, f, f, 0.07)),
  win: (v, t) =>
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => blip(v, t + i * 0.1, f, f, 0.09)),
  loss: (v, t) => blip(v, t, 440, 110, 0.6),
  draw: (v, t) => [523, 523, 523].forEach((f, i) => blip(v, t + i * 0.12, f, f, 0.07)),
  notify: (v, t) => blip(v, t, 988, 1319, 0.08),
  illegal: (v, t) => blip(v, t, 160, 120, 0.12, 0.1),
  rankUp: (v, t) =>
    [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) =>
      blip(v, t + i * 0.08, f, f, 0.08),
    ),
};

const fantasy: Pack = {
  move: (v, t) => {
    thump(v, t, 140, 70, 0.08, 0.35);
    chime(v, t, 1568, 0.25, 0.05);
  },
  capture: (v, t) => {
    thump(v, t, 160, 60, 0.1, 0.5);
    chime(v, t + 0.02, 1175, 0.5, 0.1);
  },
  castle: (v, t) => {
    chime(v, t, 784, 0.5, 0.1);
    chime(v, t + 0.12, 1175, 0.6, 0.1);
  },
  check: (v, t) => {
    chime(v, t, 1319, 0.6, 0.14);
    chime(v, t + 0.1, 1760, 0.7, 0.12);
  },
  promote: (v, t) => [784, 988, 1175, 1568].forEach((f, i) => chime(v, t + i * 0.08, f, 0.9, 0.11)),
  gameStart: (v, t) => [659, 988].forEach((f, i) => chime(v, t + i * 0.15, f, 1.2, 0.12)),
  win: (v, t) =>
    [523, 659, 784, 1047, 1319].forEach((f, i) => chime(v, t + i * 0.12, f, 1.4, 0.12)),
  loss: (v, t) => [440, 349, 294].forEach((f, i) => chime(v, t + i * 0.2, f, 1.4, 0.12)),
  draw: (v, t) => [587, 587].forEach((f, i) => chime(v, t + i * 0.25, f, 1.1, 0.11)),
  notify: (v, t) => chime(v, t, 1319, 0.7, 0.1),
  illegal: (v, t) => thump(v, t, 120, 80, 0.15, 0.3),
  rankUp: (v, t) =>
    [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => chime(v, t + i * 0.1, f, 1.6, 0.11)),
};

const PACKS: Record<SoundPack, Pack> = { classic, arcade, fantasy };

export function playSfx(name: SfxName, pack?: SoundPack): void {
  const out = audioOut('sfx');
  if (!out) return;
  PACKS[pack ?? useSettings.getState().soundPack][name](out, out.ctx.currentTime + 0.01);
}

/** Interface feedback (button clicks, toggles) on the UI bus. */
export function playUi(name: UiSound): void {
  const out = audioOut('ui');
  if (!out) return;
  const t = out.ctx.currentTime + 0.005;
  const pack = useSettings.getState().soundPack;
  if (name === 'click') {
    if (pack === 'arcade') blip(out, t, 1200, 900, 0.025, 0.06);
    else if (pack === 'fantasy') chime(out, t, 2349, 0.15, 0.04);
    else noiseHit(out, t, 0.025, { type: 'bandpass', freq: 3200, q: 2 }, 0.35);
  } else if (name === 'toggle') {
    tone(out, t, 1400, 0.05, 'triangle', 0.08);
  } else {
    tone(out, t, 700, 0.08, 'sine', 0.08);
    tone(out, t + 0.05, 1050, 0.1, 'sine', 0.07);
  }
}

/** Plays a click for every button/link press (UI bus). Install once at startup. */
export function installUiClickSounds(): () => void {
  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest(
      'button, a, [role="button"], input[type="checkbox"]',
    );
    if (el && !(el as HTMLButtonElement).disabled) playUi('click');
  };
  document.addEventListener('click', onClick, { capture: true });
  return () => document.removeEventListener('click', onClick, { capture: true });
}
