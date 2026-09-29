'use client';

import { useUiStore } from '@/stores/ui';
import { QUERIES, useMediaQuery } from './useMediaQuery';

export interface MotionPrefs {
  /** OS setting OR in-app toggle — the single switch every animation respects. */
  reduced: boolean;
  osReduced: boolean;
  /** Mouse/trackpad with hover. */
  finePointer: boolean;
  touch: boolean;
  /** Custom cursor allowed (fine pointer, not reduced, not "classic cursor"). */
  cursorEnabled: boolean;
  /** Smooth scroll (Lenis) allowed. */
  smoothScroll: boolean;
  webglEnabled: boolean;
}

export function useMotionPrefs(): MotionPrefs {
  const osReduced = useMediaQuery(QUERIES.reducedMotion);
  const finePointer = useMediaQuery(QUERIES.finePointer);
  const appReduced = useUiStore((s) => s.reducedMotion);
  const classicCursor = useUiStore((s) => s.classicCursor);
  const webgl = useUiStore((s) => s.webgl);
  const reduced = osReduced || appReduced;
  return {
    reduced,
    osReduced,
    finePointer,
    touch: !finePointer,
    cursorEnabled: finePointer && !reduced && !classicCursor,
    smoothScroll: finePointer && !reduced,
    webglEnabled: webgl && !reduced,
  };
}

/** Non-hook read for event handlers / GSAP callbacks. */
export function isReducedNow(): boolean {
  if (typeof window === 'undefined') return true;
  return useUiStore.getState().reducedMotion || window.matchMedia(QUERIES.reducedMotion).matches;
}
