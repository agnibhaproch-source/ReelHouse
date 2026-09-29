'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { loadSplitText } from '@/lib/split';
import { DUR } from '@/lib/tokens';
import { markPreloaderDone } from '@/lib/intro';
import { readJSON, writeJSON } from '@/lib/storage';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { play, stopProjector } from '@/lib/sound';

const SEEN_KEY = 'intro-seen';
const MIN_MS = 1200;
const MAX_MS = 2000; // countdown cap → whole sequence ≤ 2.8s

/** Real progress: fonts (40%) + above-the-fold priority images (60%). */
function trackProgress(onProgress: (p: number) => void): () => void {
  let fonts = 0;
  let images = 0;
  let cancelled = false;
  const emit = () => !cancelled && onProgress(fonts * 0.4 + images * 0.6);
  void document.fonts?.ready.then(() => {
    fonts = 1;
    emit();
  });
  const imgs = Array.from(
    document.querySelectorAll<HTMLImageElement>('main img[fetchpriority="high"]'),
  );
  if (!imgs.length) images = 1;
  else {
    let done = 0;
    const one = () => {
      done++;
      images = done / imgs.length;
      emit();
    };
    imgs.forEach((img) =>
      img.complete
        ? one()
        : (img.addEventListener('load', one, { once: true }),
          img.addEventListener('error', one, { once: true })),
    );
  }
  emit();
  return () => {
    cancelled = true;
  };
}

/**
 * First-visit preloader (spec 36): countdown leader tied to real loading (≥1.2s), projector
 * flash, wordmark reveal/exit, shutter open → hero intro. Returning visits in the session get a
 * 400ms fade; reduced motion a 300ms fade. Skippable (button after 600ms, or Esc).
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const seen = readJSON<boolean>(SEEN_KEY, false, 'session');
    writeJSON(SEEN_KEY, true, 'session');
    const finish = () => {
      markPreloaderDone();
      stopProjector();
      setDone(true);
    };

    if (seen || isReducedNow()) {
      gsap.to(el, { autoAlpha: 0, duration: seen ? 0.4 : 0.3, ease: 'none', onComplete: finish });
      return;
    }

    void play('projector');
    const q = gsap.utils.selector(el);
    const arc = q('[data-arc]')[0] as HTMLElement | undefined;
    const num = q('[data-num]')[0] as HTMLElement | undefined;
    const start = performance.now();
    let target = 0;
    let shown = 0;
    let raf = 0;
    let finished = false;
    const skipTimer = setTimeout(() => setShowSkip(true), 600);
    const stopTracking = trackProgress((p) => (target = p));
    const splitReady = loadSplitText();

    const outro = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      stopTracking();
      void splitReady.then(
        (SplitText) => {
          const split = SplitText.create(q('[data-wordmark]'), {
            type: 'chars',
            mask: 'chars',
            aria: 'hidden',
          });
          gsap
            .timeline({ onComplete: finish })
            .to(q('[data-leader]'), { scale: 0, duration: 0.35, ease: 'shutter' })
            .fromTo(
              q('[data-flash]'),
              { opacity: 0 },
              { opacity: 0.9, duration: 0.1, yoyo: true, repeat: 1, ease: 'none' },
              '>-0.05',
            )
            .set(q('[data-wordmark]'), { autoAlpha: 1 })
            .from(split.chars, { yPercent: 110, duration: 0.45, ease: 'reel', stagger: 0.03 })
            .to(
              split.chars,
              { yPercent: -110, duration: 0.35, ease: 'shutter', stagger: 0.02 },
              '+=0.15',
            )
            .to(
              q('[data-panel-top]'),
              { yPercent: -100, duration: DUR.slow, ease: 'projector' },
              '-=0.1',
            )
            .to(
              q('[data-panel-bottom]'),
              { yPercent: 100, duration: DUR.slow, ease: 'projector' },
              '<',
            )
            .call(markPreloaderDone, [], '<0.35');
        },
        () => gsap.to(el, { autoAlpha: 0, duration: 0.3, onComplete: finish }),
      );
    };
    skipRef.current = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      stopTracking();
      gsap.killTweensOf(el);
      gsap.to(el, { autoAlpha: 0, duration: 0.3, onComplete: finish });
    };

    const tick = (t: number) => {
      const elapsed = t - start;
      const timeCap = Math.min(1, elapsed / MIN_MS);
      const force = elapsed > MAX_MS ? 1 : 0;
      const goal = Math.max(force, Math.min(target, timeCap));
      shown += (goal - shown) * 0.12;
      if (goal >= 1 && shown > 0.985) shown = 1;
      if (arc) arc.style.setProperty('--p', `${shown * 360}deg`);
      if (num) {
        const n = String(Math.max(1, 3 - Math.floor(shown * 3)));
        if (num.textContent !== n) {
          num.textContent = n;
          gsap.fromTo(
            num,
            { opacity: 0.35 },
            { opacity: 1, duration: 0.18, ease: 'none', repeat: 1, yoyo: false },
          );
        }
      }
      if (shown >= 1) outro();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skipRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(skipTimer);
      stopTracking();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      data-preloader
      className="fixed inset-0 z-(--z-preloader)"
      role="status"
      aria-label="Loading Reelhouse"
    >
      <div data-panel-top className="bg-ink absolute inset-x-0 top-0 h-[50.5%]" />
      <div data-panel-bottom className="bg-ink absolute inset-x-0 bottom-0 h-[50.5%]" />
      <div className="absolute inset-0 grid place-items-center">
        <div data-leader className="relative grid size-[min(52vw,260px)] place-items-center">
          <div
            data-arc
            className="absolute inset-0 rounded-full [--p:0deg]"
            style={{
              background:
                'conic-gradient(from 0deg, rgb(237 232 223 / 0.18) var(--p), transparent var(--p))',
            }}
          />
          <svg viewBox="0 0 100 100" className="text-reel/60 absolute inset-0" aria-hidden="true">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <path d="M50 0v100M0 50h100" stroke="currentColor" strokeWidth="0.4" />
          </svg>
          <span
            data-num
            className="font-display text-reel relative text-[clamp(4rem,14vw,7.5rem)] leading-none [font-variation-settings:'SOFT'_100,'wght'_700]"
          >
            3
          </span>
        </div>
        <p
          data-wordmark
          aria-hidden="true"
          className="font-display text-reel invisible absolute text-[clamp(3rem,10vw,7rem)] leading-none tracking-tight"
        >
          Reelhouse
        </p>
      </div>
      <div data-flash className="bg-reel pointer-events-none absolute inset-0 opacity-0" />
      {showSkip && (
        <button
          type="button"
          onClick={() => skipRef.current()}
          className="rounded-pill text-small text-dim duration-fast hover:text-reel absolute right-6 bottom-6 min-h-11 px-4 font-semibold transition-colors"
        >
          Skip intro
        </button>
      )}
    </div>
  );
}
