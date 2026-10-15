import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Pages render behind the client-side player gate (ADR 0002); only validate
    // instant navigation for segments that opt in with `export const instant = true`.
    instantInsights: { validationLevel: 'manual-warning' },
  },
  async headers() {
    return [
      {
        // The service worker must never be served stale.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

// Lessons are MDX (content/learn/<locale>/<id>.mdx). Plugins are passed by name for Turbopack.
const withMDX = createMDX({
  options: { remarkPlugins: ['remark-gfm'] },
});

export default withMDX(nextConfig);
