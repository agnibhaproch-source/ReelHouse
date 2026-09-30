'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { useUiStore } from '@/stores/ui';
import { usePreviewStore } from '@/stores/preview';
import { useTrailerStore } from '@/stores/trailer';
import { TransitionLayer } from './TransitionLayer';
import { ScrollProgress } from './ScrollProgress';
import { MicroInteractions } from './MicroInteractions';

const Cursor = dynamic(() => import('@/components/motion/Cursor').then((m) => m.Cursor), {
  ssr: false,
});
const GLLayer = dynamic(() => import('@/components/gl/GLLayer').then((m) => m.GLLayer), {
  ssr: false,
});
const ReminderWatcher = dynamic(() => import('./ReminderWatcher').then((m) => m.ReminderWatcher), {
  ssr: false,
});
const ShareQuote = dynamic(() => import('./ShareQuote').then((m) => m.ShareQuote), { ssr: false });
const SearchOverlay = dynamic(() => import('./SearchOverlay').then((m) => m.SearchOverlay), {
  ssr: false,
});
const ShortcutsOverlay = dynamic(
  () => import('./ShortcutsOverlay').then((m) => m.ShortcutsOverlay),
  { ssr: false },
);
const PreviewLayer = dynamic(
  () => import('@/components/movie/PreviewLayer').then((m) => m.PreviewLayer),
  { ssr: false },
);
const TrailerPlayer = dynamic(
  () => import('@/components/movie/TrailerPlayer').then((m) => m.TrailerPlayer),
  { ssr: false },
);

/** True once the main thread is idle after hydration (keeps ambient chrome off the critical path). */
function useIdle(timeout = 1500): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const done = () => setIdle(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(done, { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(done, 300);
    return () => clearTimeout(t);
  }, [timeout]);
  return idle;
}

/** Latches to true the first time `value` is truthy — mount on first use, keep mounted after. */
function useOnce(value: boolean): boolean {
  const [seen, setSeen] = useState(value);
  if (value && !seen) setSeen(true);
  return seen || value;
}

/**
 * Client-only chrome mounted once in the root layout (never re-mounts between navigations).
 * Overlays load on first use; ambient layers (cursor, WebGL grain) wait for idle (spec 61).
 */
export function GlobalLayer() {
  const idle = useIdle();
  const search = useOnce(useUiStore((s) => s.searchOpen));
  const shortcuts = useOnce(useUiStore((s) => s.shortcutsOpen));
  const preview = useOnce(usePreviewStore((s) => s.movie !== null));
  const trailer = useOnce(useTrailerStore((s) => s.movie !== null));

  return (
    <>
      <ScrollProgress />
      <MicroInteractions />
      <TransitionLayer />
      <Toaster />
      {preview && <PreviewLayer />}
      {trailer && <TrailerPlayer />}
      {search && <SearchOverlay />}
      {shortcuts && <ShortcutsOverlay />}
      {idle && (
        <>
          <ShareQuote />
          <ReminderWatcher />
          <GLLayer />
          <Cursor />
        </>
      )}
    </>
  );
}
