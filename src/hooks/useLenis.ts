'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import type Lenis from 'lenis';

export interface ScrollApi {
  lenis: Lenis | null;
  scrollTo: (
    target: number | string | HTMLElement,
    opts?: { offset?: number; duration?: number; immediate?: boolean; onComplete?: () => void },
  ) => void;
  stop: () => void;
  start: () => void;
  /** px/frame; 0 under native scroll. */
  velocity: () => number;
  direction: () => 1 | -1 | 0;
}

export const ScrollContext = createContext<ScrollApi | null>(null);

const nativeApi: ScrollApi = {
  lenis: null,
  scrollTo: (target, opts) => {
    const y =
      typeof target === 'number'
        ? target
        : ((typeof target === 'string'
            ? document.querySelector(target)
            : target
          )?.getBoundingClientRect().top ?? 0);
    const top = typeof target === 'number' ? y : y + window.scrollY + (opts?.offset ?? 0);
    window.scrollTo({ top, behavior: opts?.immediate ? 'instant' : 'smooth' });
    opts?.onComplete?.();
  },
  stop: () => {},
  start: () => {},
  velocity: () => 0,
  direction: () => 0,
};

export function useLenis(): ScrollApi {
  return useContext(ScrollContext) ?? nativeApi;
}

/** Subscribe to scroll ticks (Lenis or native), without re-rendering. */
export function useScrollListener(
  cb: (y: number, velocity: number, direction: 1 | -1 | 0) => void,
): void {
  const { lenis } = useLenis();
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  });
  useEffect(() => {
    if (lenis) {
      const handler = (l: Lenis) => ref.current(l.scroll, l.velocity, l.direction);
      lenis.on('scroll', handler);
      return () => lenis.off('scroll', handler);
    }
    let last = window.scrollY;
    const handler = () => {
      const y = window.scrollY;
      const d = y > last ? 1 : y < last ? -1 : 0;
      ref.current(y, y - last, d);
      last = y;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [lenis]);
}
