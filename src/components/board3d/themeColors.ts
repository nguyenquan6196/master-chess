'use client';

import { useEffect, useState } from 'react';

/** A theme colour for three.js: hex colour plus its alpha. */
export interface ThemeColor {
  color: string;
  opacity: number;
}

/** CSS variables the 3D board follows (board squares, highlights, marks, arrow). */
const VARS = {
  light: '--mc-board-light',
  dark: '--mc-board-dark',
  last: '--mc-hl-last',
  selected: '--mc-hl-selected',
  move: '--mc-hl-move',
  check: '--mc-hl-check',
  arrow: '--mc-arrow-hint',
  markHint: '--mc-mark-hint',
  markSelected: '--mc-mark-selected',
  markCorrect: '--mc-mark-correct',
  markWrong: '--mc-mark-wrong',
} as const;

export type ThemeColors = Record<keyof typeof VARS, ThemeColor>;

const FALLBACK: ThemeColor = { color: '#888888', opacity: 1 };

const hex = (n: number) =>
  Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .padStart(2, '0');

/** Any CSS colour → hex + alpha, using the browser's own colour parser. */
function resolve(value: string, probe: HTMLElement): ThemeColor {
  if (!value) return FALLBACK;
  probe.style.color = '';
  probe.style.color = value;
  const computed = getComputedStyle(probe).color;
  const nums = computed.match(/-?\d*\.?\d+(e-?\d+)?/g)?.map(Number) ?? [];
  if (computed.startsWith('color(') && nums.length >= 3) {
    // color(srgb r g b / a) with channels in 0…1.
    return {
      color: `#${hex(nums[0] * 255)}${hex(nums[1] * 255)}${hex(nums[2] * 255)}`,
      opacity: nums[3] ?? 1,
    };
  }
  if (nums.length >= 3) {
    return { color: `#${hex(nums[0])}${hex(nums[1])}${hex(nums[2])}`, opacity: nums[3] ?? 1 };
  }
  return FALLBACK;
}

function read(): ThemeColors {
  const root = getComputedStyle(document.documentElement);
  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const out = Object.fromEntries(
    Object.entries(VARS).map(([key, name]) => [
      key,
      resolve(root.getPropertyValue(name).trim(), probe),
    ]),
  ) as ThemeColors;
  probe.remove();
  return out;
}

/** Theme colours, re-read whenever the theme or appearance settings change the root. */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class'],
    });
    return () => observer.disconnect();
  }, []);
  return colors;
}
