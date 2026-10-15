'use client';

import { useEffect, useRef } from 'react';

export type ParticleKind = 'petals' | 'stars' | 'neon' | 'pixels' | 'dust';

/** Particles per 100k px² of viewport, capped. */
const DENSITY = 2.2;
const MAX_PARTICLES = 70;

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  spin: number;
  color: string;
}

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'gray';

/**
 * Animated theme backdrop drawn on a fixed canvas behind the content. Colours come from
 * theme tokens. Stops when the tab is hidden and never runs under reduced motion.
 */
export function BackdropParticles({ kind }: { kind: ParticleKind }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Colours are read on the first frame: the new theme is applied to <html> by an
    // effect higher up, which runs after this one.
    let accent = '';
    let second = '';
    let fg = '';
    let w = 0;
    let h = 0;
    let particles: P[] = [];

    const spawn = (anywhere: boolean): P => {
      const r = Math.random;
      const base = {
        x: r() * w,
        y: anywhere ? r() * h : kind === 'petals' ? -20 : h + 20,
        phase: r() * Math.PI * 2,
        spin: (r() - 0.5) * 0.04,
      };
      switch (kind) {
        case 'petals':
          return {
            ...base,
            vx: 0.3 + r() * 0.5,
            vy: 0.5 + r() * 0.7,
            size: 4 + r() * 4,
            color: accent,
          };
        case 'stars':
          return { ...base, y: r() * h, vx: 0, vy: 0, size: 0.6 + r() * 1.6, color: fg };
        case 'neon':
          return {
            ...base,
            vx: (r() - 0.5) * 0.2,
            vy: -(0.2 + r() * 0.5),
            size: 1.5 + r() * 2.5,
            color: r() < 0.5 ? accent : second,
          };
        case 'pixels':
          return {
            ...base,
            vx: 0,
            vy: -(0.3 + r() * 0.6),
            size: 3 + Math.floor(r() * 3),
            color: accent,
          };
        case 'dust':
          return {
            ...base,
            vx: (r() - 0.5) * 0.25,
            vy: -(0.05 + r() * 0.2),
            size: 1 + r() * 2,
            color: accent,
          };
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(MAX_PARTICLES, Math.round(((w * h) / 100_000) * DENSITY));
      particles = Array.from({ length: n }, () => spawn(true));
    };
    window.addEventListener('resize', resize);

    let frame = 0;
    let t = 0;
    const tick = () => {
      if (t === 0) {
        accent = cssVar('--mc-accent');
        second = cssVar('--mc-arrow-hint');
        fg = cssVar('--mc-fg');
        resize();
      }
      t += 1;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + (kind === 'petals' ? Math.sin(t * 0.02 + p.phase) * 0.4 : 0);
        p.y += p.vy;
        p.phase += p.spin;
        if (p.y > h + 30 || p.y < -30 || p.x > w + 30 || p.x < -30) particles[i] = spawn(false);
        ctx.fillStyle = p.color;
        if (kind === 'petals') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.phase);
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (kind === 'pixels') {
          ctx.globalAlpha = 0.35;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        } else {
          const twinkle =
            kind === 'stars' ? 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.03 + p.phase)) : 0.5;
          ctx.globalAlpha = twinkle;
          if (kind === 'neon') {
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [kind]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1] h-full w-full"
    />
  );
}
