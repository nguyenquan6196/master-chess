'use client';

import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from 'three';

/**
 * Procedural surface textures for the 3D board and pieces (Phase 6), drawn on a canvas in
 * the browser — the 3D twins of the 2D themes' CSS patterns (wood grain, marble veins,
 * agate bands, brushed metal, pixels, neon grid). No image files. Each texture bakes its
 * base colour in; materials then use white so the texture shows as painted.
 */
export type SurfaceKind =
  'plain' | 'wood' | 'marble' | 'agate' | 'brushed' | 'pixel' | 'neon' | 'swirl';

const SIZE = 256;

/** Small deterministic PRNG so every square/variant always looks the same. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Mix a hex colour towards black (k < 0) or white (k > 0). */
function shift(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k),
  );
  return `rgb(${ch[0]} ${ch[1]} ${ch[2]})`;
}

function paint(kind: SurfaceKind, base: string, seed: number, ctx: CanvasRenderingContext2D) {
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  switch (kind) {
    case 'plain': {
      // A faint grain so flat colours don't look plastic.
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = shift(base, r() < 0.5 ? -0.06 : 0.06);
        ctx.globalAlpha = 0.35;
        ctx.fillRect(r() * SIZE, r() * SIZE, 2, 2);
      }
      break;
    }
    case 'wood': {
      // Long wavy grain lines plus a knot now and then.
      const lines = 34 + Math.floor(r() * 10);
      for (let i = 0; i < lines; i++) {
        const x0 = (i / lines) * SIZE + r() * 6;
        ctx.strokeStyle = shift(base, -0.18 - r() * 0.2);
        ctx.globalAlpha = 0.25 + r() * 0.35;
        ctx.lineWidth = 0.6 + r() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        const wobble = 3 + r() * 6;
        for (let y = 0; y <= SIZE; y += 16) {
          ctx.lineTo(x0 + Math.sin(y / 40 + i) * wobble, y);
        }
        ctx.stroke();
      }
      if (r() < 0.6) {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = shift(base, -0.35);
        const kx = r() * SIZE;
        const ky = r() * SIZE;
        for (let k = 1; k < 5; k++) {
          ctx.beginPath();
          ctx.ellipse(kx, ky, 4 + k * 4, 10 + k * 7, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    case 'marble': {
      // Soft cloudy blotches and branching veins.
      for (let i = 0; i < 14; i++) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = shift(base, r() < 0.5 ? -0.12 : 0.12);
        ctx.beginPath();
        ctx.arc(r() * SIZE, r() * SIZE, 30 + r() * 70, 0, Math.PI * 2);
        ctx.fill();
      }
      const veins = 3 + Math.floor(r() * 3);
      for (let v = 0; v < veins; v++) {
        ctx.strokeStyle = shift(base, base.length && r() < 0.5 ? -0.45 : 0.45);
        ctx.globalAlpha = 0.35 + r() * 0.35;
        ctx.lineWidth = 0.8 + r() * 1.8;
        ctx.beginPath();
        let x = r() * SIZE;
        let y = 0;
        ctx.moveTo(x, y);
        while (y < SIZE) {
          x += (r() - 0.5) * 50;
          y += 12 + r() * 26;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'agate': {
      // Bands curving out from a corner, like a slice of agate.
      const cx = r() < 0.5 ? -20 : SIZE + 20;
      const cy = r() < 0.5 ? -20 : SIZE + 20;
      for (let b = 0; b < 16; b++) {
        ctx.strokeStyle = b % 2 ? shift(base, 0.4) : shift(base, -0.25);
        ctx.globalAlpha = 0.18 + r() * 0.2;
        ctx.lineWidth = 4 + r() * 10;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30 + b * 22, 24 + b * 18, r() * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'swirl': {
      // Resin: drifting curls of a lighter tone.
      for (let i = 0; i < 9; i++) {
        ctx.strokeStyle = shift(base, 0.45);
        ctx.globalAlpha = 0.25 + r() * 0.3;
        ctx.lineWidth = 2 + r() * 6;
        ctx.beginPath();
        const y0 = r() * SIZE;
        ctx.moveTo(0, y0);
        ctx.bezierCurveTo(
          SIZE * 0.3,
          y0 - 60 * r(),
          SIZE * 0.6,
          y0 + 60 * r(),
          SIZE,
          y0 + (r() - 0.5) * 40,
        );
        ctx.stroke();
      }
      break;
    }
    case 'brushed': {
      // Fine streaks, light and dark.
      for (let i = 0; i < 260; i++) {
        ctx.strokeStyle = shift(base, r() < 0.5 ? -0.12 : 0.18);
        ctx.globalAlpha = 0.2 + r() * 0.25;
        ctx.lineWidth = 0.6;
        const y = r() * SIZE;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(SIZE, y + (r() - 0.5) * 3);
        ctx.stroke();
      }
      break;
    }
    case 'pixel': {
      // Chunky 8×8 dither, like an old handheld screen.
      const cell = SIZE / 8;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const v = r();
          if (v < 0.3) continue;
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = shift(base, v < 0.65 ? -0.12 : 0.1);
          ctx.fillRect(i * cell, j * cell, cell, cell);
        }
      }
      break;
    }
    case 'neon': {
      // Thin glowing border and a faint inner grid.
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = shift(base, 0.55);
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, SIZE - 8, SIZE - 8);
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      for (let g = 32; g < SIZE; g += 32) {
        ctx.beginPath();
        ctx.moveTo(g, 0);
        ctx.lineTo(g, SIZE);
        ctx.moveTo(0, g);
        ctx.lineTo(SIZE, g);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.globalAlpha = 1;
}

const CACHE = new Map<string, CanvasTexture>();

/** A cached texture of `kind` painted over `base` (hex), one of a few `variant`s. */
export function surfaceTexture(kind: SurfaceKind, base: string, variant = 0): CanvasTexture {
  const key = `${kind}|${base}|${variant}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(kind, base, hashSeed(key), ctx);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.anisotropy = 4;
  if (kind === 'pixel') {
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;
  }
  CACHE.set(key, tex);
  return tex;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
