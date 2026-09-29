import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Reelhouse',
    short_name: 'Reelhouse',
    description: 'Cinematic movie discovery.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08080d',
    theme_color: '#08080d',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
