'use client';

import { useEffect, useRef } from 'react';

const PIECES = 90;
const DURATION_MS = 1600;
const GRAVITY = 0.0012;
/** Theme tokens used as confetti colors. */
const COLOR_VARS = [
  '--mc-accent',
  '--mc-mark-selected',
  '--mc-hl-last',
  '--mc-danger',
  '--mc-side-white',
];

/**
 * One-shot confetti burst drawn on a canvas over its parent (which must be `relative`).
 * Re-fires whenever `trigger` changes to a new truthy value. Skipped for reduced motion.
 */
export function Confetti({ trigger }: { trigger: number | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!trigger || !el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const { width, height } = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    el.width = width * dpr;
    el.height = height * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const colors = COLOR_VARS.map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
    const parts = Array.from({ length: PIECES }, () => ({
      x: width / 2,
      y: height * 0.55,
      vx: (Math.random() - 0.5) * 0.9,
      vy: -Math.random() * 0.9 - 0.3,
      size: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.02,
      color: colors[Math.floor(Math.random() * colors.length)] ?? 'gold',
    }));

    const start = performance.now();
    let last = start;
    let frame = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      ctx.clearRect(0, 0, width, height);
      const fade = Math.max(0, 1 - (now - start) / DURATION_MS);
      for (const p of parts) {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (fade > 0) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trigger]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 size-full"
    />
  );
}
