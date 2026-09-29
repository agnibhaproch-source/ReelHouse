'use client';

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

export const QUERIES = {
  reducedMotion: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
  mobile: '(max-width: 767px)',
} as const;
