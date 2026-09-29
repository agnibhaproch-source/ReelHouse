'use client';

import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/Toaster';
import { PreviewLayer } from '@/components/movie/PreviewLayer';
import { TransitionLayer } from './TransitionLayer';
import { ScrollProgress } from './ScrollProgress';
import { SearchOverlay } from './SearchOverlay';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { MicroInteractions } from './MicroInteractions';
import { ShareQuote } from './ShareQuote';

const Cursor = dynamic(() => import('@/components/motion/Cursor').then((m) => m.Cursor), {
  ssr: false,
});
const TrailerPlayer = dynamic(
  () => import('@/components/movie/TrailerPlayer').then((m) => m.TrailerPlayer),
  { ssr: false },
);
const GLLayer = dynamic(() => import('@/components/gl/GLLayer').then((m) => m.GLLayer), {
  ssr: false,
});

/** Client-only chrome mounted once in the root layout (never re-mounts between navigations). */
export function GlobalLayer() {
  return (
    <>
      <ScrollProgress />
      <PreviewLayer />
      <TrailerPlayer />
      <SearchOverlay />
      <ShortcutsOverlay />
      <ShareQuote />
      <MicroInteractions />
      <TransitionLayer />
      <Toaster />
      <GLLayer />
      <Cursor />
    </>
  );
}
