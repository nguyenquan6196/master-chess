import type { MetadataRoute } from 'next';

/** Installable app (PWA). Colours match the Classic theme and the app icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Master Chess',
    short_name: 'Master Chess',
    description: 'Học, luyện tập và đấu cờ vua — chạy cả khi offline.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f3f1ea',
    theme_color: '#5d8c3b',
    lang: 'vi',
    categories: ['games', 'education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
