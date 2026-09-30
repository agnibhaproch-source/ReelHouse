'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { play } from '@/lib/sound';
import { hasClientNavigated, isTransitioning, PAGE_INTRO_EVENT } from '@/lib/transition';
import { isReducedNow } from '@/hooks/useMotionPrefs';

const KEY = 'leader-seen';
const BEAT = 0.42;

/**
 * Academy-leader countdown (3·2·1 with a sweeping hand) the first time a film is opened in a
 * session. Only on in-app navigation — it continues the page transition — so it never stacks on
 * the first-visit preloader. Click or Esc skips; reduced motion never shows it. Decorative.
 */
export function FilmLeader() {
  const [show, setShow] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(3);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
    } catch {
      /* storage blocked: skip */
    }
    if (seen || isReducedNow() || !hasClientNavigated()) return;
    const start = () => {
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
      setShow(true);
    };
    // Continue the page transition; if it already finished, start right away.
    if (!isTransitioning()) {
      queueMicrotask(start);
      return;
    }
    window.addEventListener(PAGE_INTRO_EVENT, start, { once: true });
    return () => window.removeEventListener(PAGE_INTRO_EVENT, start);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!show || !el) return;
    const done = () => setShow(false);
    const tl = gsap.timeline({ onComplete: done });
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.12 });
    [3, 2, 1].forEach((k, i) => {
      tl.call(
        () => {
          setN(k);
          void play('tick');
        },
        undefined,
        0.12 + i * BEAT,
      );
      tl.fromTo(
        el.querySelector('[data-hand]'),
        { rotate: 0 },
        { rotate: 360, duration: BEAT, ease: 'none' },
        0.12 + i * BEAT,
      );
    });
    tl.to(el, { opacity: 0, duration: 0.2, ease: 'shutter' }, 0.12 + 3 * BEAT);
    const skip = (e: KeyboardEvent | PointerEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      tl.progress(1);
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      tl.kill();
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [show]);

  if (!show) return null;
  return (
    <div
      ref={root}
      aria-hidden="true"
      className="bg-void/92 pointer-events-none fixed inset-0 z-(--z-transition) grid place-items-center opacity-0"
    >
      <div className="text-reel/80 relative grid aspect-square w-[min(60vmin,420px)] place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.3" />
        </svg>
        <span
          data-hand
          className="absolute inset-[4%] origin-center"
          style={{
            background:
              'conic-gradient(from 0deg, color-mix(in oklab, var(--text-reel) 22%, transparent) 0deg, transparent 50deg)',
            borderRadius: '50%',
          }}
        />
        <span className="font-display relative text-[min(34vmin,240px)] leading-none font-semibold tabular-nums">
          {n}
        </span>
      </div>
    </div>
  );
}
