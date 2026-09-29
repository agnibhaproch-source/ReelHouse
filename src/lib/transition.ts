'use client';

/**
 * Page-transition coordinator (spec 35). A tiny event bus between TransitionLink / MovieCard
 * (which request navigations), TransitionLayer (which animates), and template.tsx (which
 * signals that the new route has mounted).
 */

export type TransitionKind = 'shutter' | 'poster' | 'burn' | 'fade';

export interface SharedPoster {
  id: number;
  src: string;
  rect: DOMRect;
  radius: number;
}

export interface TransitionRequest {
  href: string;
  kind: TransitionKind;
  poster?: SharedPoster;
  /** Route push supplied by the caller (Next router). */
  push: (href: string) => void;
}

type Listener = (req: TransitionRequest) => void;

let listener: Listener | null = null;
let readyWaiters: Array<(path: string) => void> = [];
let busy = false;

/** Last detail poster rect — used for the reverse flight on back navigation. */
export const lastDetail: { id: number | null; rect: DOMRect | null; src: string | null } = {
  id: null,
  rect: null,
  src: null,
};

export function onTransitionRequest(l: Listener): () => void {
  listener = l;
  return () => {
    if (listener === l) listener = null;
  };
}

export function isTransitioning(): boolean {
  return busy;
}

export function setTransitioning(v: boolean): void {
  busy = v;
}

/** Ask the layer to run a transition. Returns false when one is already running (no stacking). */
export function requestTransition(req: TransitionRequest): boolean {
  if (busy) return false;
  if (!listener) {
    req.push(req.href);
    return true;
  }
  listener(req);
  return true;
}

/** Called from template.tsx when a route mounts. */
export function signalPageReady(path: string): void {
  const waiters = readyWaiters;
  readyWaiters = [];
  for (const w of waiters) w(path);
}

/** Resolves when the next page signals ready, or after `timeout` ms (never block navigation). */
export function waitForPage(timeout = 1500): Promise<'ready' | 'timeout'> {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      readyWaiters = readyWaiters.filter((w) => w !== done);
      resolve('timeout');
    }, timeout);
    const done = () => {
      clearTimeout(t);
      resolve('ready');
    };
    readyWaiters.push(done);
  });
}

/** Intro timelines listen for this (fired at 60% of the shutter opening). */
export const PAGE_INTRO_EVENT = 'rh:page-intro';

export function shouldIntercept(e: React.MouseEvent<HTMLAnchorElement>, href: string): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return false;
  const target = e.currentTarget.getAttribute('target');
  if (target && target !== '_self') return false;
  if (!href.startsWith('/') || href.startsWith('//')) return false;
  const url = new URL(href, window.location.href);
  if (url.pathname === window.location.pathname && url.search === window.location.search)
    return false;
  if (url.pathname === window.location.pathname && url.hash) return false;
  return true;
}

export function transitionKindFor(href: string): TransitionKind {
  return /^\/(login|signup|forgot-password)(\/|\?|$)/.test(href) ? 'burn' : 'shutter';
}
