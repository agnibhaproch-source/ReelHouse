'use client';

import { isTransitioning, PAGE_INTRO_EVENT } from './transition';

/** First-visit preloader coordination (spec 36): L1 moments never overlap. */
const state = { preloaderDone: false };
const waiters: Array<() => void> = [];

export function markPreloaderDone(): void {
  if (state.preloaderDone) return;
  state.preloaderDone = true;
  waiters.splice(0).forEach((w) => w());
}

export function isPreloaderDone(): boolean {
  return state.preloaderDone;
}

/**
 * Runs `cb` when this page's intro timeline may start: after the preloader (first visit), or at
 * 60% of the page-transition opening, or immediately. Returns a cancel function.
 */
export function whenIntroReady(cb: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (!cancelled) cb();
  };
  if (!state.preloaderDone) {
    waiters.push(run);
    return () => {
      cancelled = true;
    };
  }
  if (isTransitioning()) {
    const onIntro = () => run();
    window.addEventListener(PAGE_INTRO_EVENT, onIntro, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener(PAGE_INTRO_EVENT, onIntro);
    };
  }
  queueMicrotask(run);
  return () => {
    cancelled = true;
  };
}
