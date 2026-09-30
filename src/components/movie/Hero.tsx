'use client';

import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { Info } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { loadSplitText } from '@/lib/split';
import { DUR } from '@/lib/tokens';
import { cn, formatRuntime } from '@/lib/utils';
import { SIZES } from '@/lib/tmdb/images';
import { toSnapshot } from '@/lib/snapshot';
import { whenIntroReady } from '@/lib/intro';
import type { HeroSlide } from '@/lib/hero';
import { useMotionPrefs, isReducedNow } from '@/hooks/useMotionPrefs';
import { QUERIES, useMediaQuery } from '@/hooks/useMediaQuery';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Button } from '@/components/ui/Button';
import { RatingRing } from '@/components/ui/RatingRing';
import { WatchlistButton } from './WatchlistButton';
import { PlayTrailerButton } from './PlayTrailerButton';

const HeroCanvas = dynamic(() => import('@/components/gl/HeroCanvas').then((m) => m.HeroCanvas), {
  ssr: false,
});

const SLIDE_MS = 8000;

/**
 * Hero billboard (spec 21): rotating top-5, server-rendered first slide (LCP), intro timeline,
 * shutter slide change (WebGL displacement when enabled), scroll + mouse parallax, film-frame
 * progress bars that pause on hover/focus/hidden tab, ←/→ keys and swipe.
 */
export function Hero({ slides }: { slides: HeroSlide[] }) {
  const root = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const bars = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [paused, setPaused] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const progress = useRef<gsap.core.Tween | null>(null);
  const changing = useRef(false);
  const { reduced, finePointer, webglEnabled } = useMotionPrefs();
  const mobile = useMediaQuery(QUERIES.mobile, true);
  const slide = slides[shown];

  // Intro timeline — after the preloader / page transition (L1 moments never overlap).
  useGSAP(
    (context) => {
      const el = root.current;
      if (!el || !slide) return;
      const img = el.querySelector('[data-hero-media]');
      const logo = el.querySelector('[data-hero-logo]');
      const overview = el.querySelector('[data-hero-overview]');
      const buttons = el.querySelectorAll('[data-hero-btn]');
      if (reduced) return;
      gsap.set(img, { scale: 1.15 });
      gsap.set(logo, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(buttons, { opacity: 0, scale: 0.8 });
      gsap.set(overview, { opacity: 0 });
      const splitReady = loadSplitText();
      let cancelled = false;
      const cancelIntro = whenIntroReady(
        () =>
          void splitReady.then(
            (SplitText) =>
              !cancelled &&
              context.add(() => {
                const split = overview
                  ? SplitText.create(overview, { type: 'lines', mask: 'lines', aria: 'none' })
                  : null;
                const tl = gsap.timeline();
                tl.to(img, { scale: 1, duration: 1.8, ease: 'reel' }, 0)
                  .to(
                    logo,
                    { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.cinematic, ease: 'projector' },
                    0.2,
                  )
                  .set(overview, { opacity: 1 }, 0.5);
                if (split)
                  tl.from(
                    split.lines,
                    { yPercent: 110, duration: DUR.slow, ease: 'reel', stagger: 0.06 },
                    0.5,
                  );
                tl.to(
                  buttons,
                  { opacity: 1, scale: 1, duration: DUR.base, ease: 'snap', stagger: 0.06 },
                  0.8,
                );
              }),
          ),
      );
      return () => {
        cancelled = true;
        cancelIntro();
      };
    },
    { scope: root, dependencies: [reduced] },
  );

  // Scroll parallax: backdrop 0.4×, text 0.8× and fading out by 60%.
  useGSAP(
    () => {
      if (reduced || !root.current) return;
      const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to(media.current, { yPercent: 40 * 0.6, ease: 'none', scrollTrigger: st });
      gsap.to(text.current, {
        yPercent: 20,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { ...st, end: '60% top' },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  // Mouse parallax ±12px.
  useEffect(() => {
    const el = root.current;
    const target = media.current?.querySelector('[data-hero-shift]');
    if (!el || !target || reduced || !finePointer) return;
    const xTo = gsap.quickTo(target, 'x', { duration: 0.8, ease: 'power3.out' });
    const yTo = gsap.quickTo(target, 'y', { duration: 0.8, ease: 'power3.out' });
    const onMove = (e: globalThis.PointerEvent) => {
      xTo((e.clientX / window.innerWidth - 0.5) * -24);
      yTo((e.clientY / window.innerHeight - 0.5) * -24);
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [reduced, finePointer]);

  const go = useCallback(
    (next: number) => {
      if (changing.current || slides.length < 2) return;
      const n = (next + slides.length) % slides.length;
      if (n === index) return;
      changing.current = true;
      setIndex(n);
      const el = root.current;
      const done = () => {
        changing.current = false;
      };
      if (isReducedNow() || !el) {
        setShown(n);
        done();
        return;
      }
      const textEl = text.current;
      const shutters = el.querySelectorAll('[data-hero-shutter]');
      const tl = gsap.timeline({ onComplete: done });
      tl.to(textEl, { yPercent: -8, opacity: 0, duration: DUR.fast, ease: 'shutter' }, 0);
      if (glReady) {
        // WebGL displacement handles the image; swap the DOM image once it covers.
        tl.call(() => setShown(n), [], 0.9);
      } else {
        tl.to(shutters, { scaleY: 1, duration: 0.45, ease: 'shutter', stagger: 0 }, 0)
          .call(() => setShown(n), [], 0.45)
          .to(shutters, { scaleY: 0, duration: 0.7, ease: 'reel' }, 0.6);
      }
      tl.fromTo(
        textEl,
        { yPercent: 8, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: DUR.slow, ease: 'reel' },
        glReady ? 1 : 0.75,
      );
    },
    [index, slides.length, glReady],
  );

  // Auto-advance with film-frame progress (pauses on hover / focus / hidden tab).
  useEffect(() => {
    const bar = bars.current?.querySelectorAll<HTMLElement>('[data-fill]')[index];
    if (!bar || slides.length < 2) return;
    bars.current
      ?.querySelectorAll<HTMLElement>('[data-fill]')
      .forEach((b, i) => gsap.set(b, { scaleX: i < index ? 1 : 0 }));
    progress.current = gsap.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: 1, duration: SLIDE_MS / 1000, ease: 'none', onComplete: () => go(index + 1) },
    );
    return () => {
      progress.current?.kill();
    };
  }, [index, go, slides.length]);

  useEffect(() => {
    const hidden = () => document.hidden;
    const apply = () =>
      paused || hidden() ? progress.current?.pause() : progress.current?.resume();
    apply();
    document.addEventListener('visibilitychange', apply);
    return () => document.removeEventListener('visibilitychange', apply);
  }, [paused, index]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    }
  };

  // Touch swipe.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y))
      go(index + (dx < 0 ? 1 : -1));
  };

  if (!slide) return null;
  const snap = toSnapshot(slide.movie);

  return (
    <section
      ref={root}
      data-hero
      aria-roledescription="carousel"
      aria-label="Featured movies"
      tabIndex={0}
      onKeyDown={onKey}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="bg-void relative h-svh min-h-[560px] w-full overflow-hidden rounded-none outline-none"
    >
      <div ref={media} className="absolute inset-0">
        <div data-hero-media className="absolute inset-0 origin-center">
          <div data-hero-shift className="absolute -inset-4">
            {/* Desktop: backdrop · Mobile: portrait poster crop */}
            <div className="absolute inset-0 max-md:hidden">
              <TmdbImage
                key={`b${slide.id}`}
                path={slide.backdrop ?? slide.poster}
                kind={slide.backdrop ? 'backdrop' : 'poster'}
                alt=""
                sizes={SIZES.hero}
                priority={shown === 0}
                plain
              />
            </div>
            <div className="absolute inset-0 md:hidden">
              <TmdbImage
                key={`p${slide.id}`}
                path={slide.poster ?? slide.backdrop}
                kind={slide.poster ? 'poster' : 'backdrop'}
                alt=""
                sizes="100vw"
                priority={shown === 0}
                blurDataURL={slide.blur}
                plain
              />
            </div>
          </div>
          {webglEnabled && !reduced && !mobile && slides.length > 1 && (
            <HeroCanvas slides={slides} index={index} onReady={setGlReady} />
          )}
        </div>
      </div>

      {/* Shutter bars (slide change) */}
      <div
        aria-hidden="true"
        data-hero-shutter
        className="bg-void absolute inset-x-0 top-0 z-[2] h-1/2 origin-top scale-y-0"
      />
      <div
        aria-hidden="true"
        data-hero-shutter
        className="bg-void absolute inset-x-0 bottom-0 z-[2] h-1/2 origin-bottom scale-y-0"
      />

      <div aria-hidden="true" className="vignette absolute inset-0 z-[3]" />
      <div
        aria-hidden="true"
        className="from-void via-void/60 absolute inset-x-0 bottom-0 z-[3] h-2/3 bg-gradient-to-t to-transparent"
      />

      <div
        ref={text}
        className="px-gutter absolute inset-x-0 bottom-0 z-[4] pb-[max(14vh,96px)] max-md:text-center"
      >
        <div
          className="flex max-w-[min(92vw,620px)] flex-col gap-5 max-md:mx-auto max-md:items-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <h1 className="sr-only">{slide.title}</h1>
          {slide.logo ? (
            <div
              data-hero-logo
              className="relative w-[min(78vw,460px)]"
              style={{ aspectRatio: `${Math.max(1.2, slide.logo.ratio)}` }}
            >
              <TmdbImage
                path={slide.logo.path}
                kind="logo"
                alt=""
                sizes={SIZES.logo}
                priority={shown === 0}
                className="object-contain object-bottom-left max-md:object-bottom"
              />
            </div>
          ) : (
            <p
              data-hero-logo
              aria-hidden="true"
              className="font-display text-hero leading-[0.9] font-semibold [font-variation-settings:'SOFT'_50]"
            >
              {slide.title}
            </p>
          )}
          <p className="text-small text-reel/85 flex flex-wrap items-center gap-x-3 gap-y-1 max-md:justify-center">
            {slide.rating > 0 && <RatingRing value={slide.rating} size={36} label="TMDB rating" />}
            {slide.year && <span>{slide.year}</span>}
            {slide.runtime ? <span>{formatRuntime(slide.runtime)}</span> : null}
            {slide.genres.length > 0 && (
              <span className="text-dim">{slide.genres.join(' · ')}</span>
            )}
          </p>
          <p
            key={slide.id}
            data-hero-overview
            className="text-body text-reel/85 line-clamp-2 md:text-[1.05rem]"
          >
            {slide.overview}
          </p>
          <div className="flex flex-wrap gap-3">
            <span data-hero-btn className="inline-flex">
              {slide.videos.length > 0 ? (
                <PlayTrailerButton
                  movie={snap}
                  videos={slide.videos}
                  color={slide.color}
                  size="lg"
                />
              ) : (
                <Button href={`/movie/${slide.id}`} size="lg">
                  See details
                </Button>
              )}
            </span>
            <span data-hero-btn className="inline-flex">
              <Button
                href={`/movie/${slide.id}`}
                variant="secondary"
                size="lg"
                icon={<Info />}
                iconAnim="spin"
                magnetic={false}
              >
                More info
              </Button>
            </span>
            <span data-hero-btn className="inline-flex max-sm:hidden">
              <WatchlistButton movie={snap} iconOnly size="lg" />
            </span>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div
          ref={bars}
          className="right-gutter absolute bottom-[max(14vh,96px)] z-[5] flex gap-2 max-md:right-1/2 max-md:bottom-8 max-md:translate-x-1/2"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${s.title} (${i + 1} of ${slides.length})`}
              aria-current={i === index}
              data-cursor="link"
              className="group flex min-h-11 items-center"
            >
              <span
                className={cn(
                  'duration-base relative block h-8 w-10 overflow-hidden rounded-[3px] border transition-colors',
                  i === index ? 'border-reel/70' : 'border-reel/25 group-hover:border-reel/60',
                )}
              >
                <span data-fill className="bg-reel/25 absolute inset-0 origin-left scale-x-0" />
                <span
                  aria-hidden="true"
                  className="sprockets absolute inset-x-0 top-0 h-1 opacity-50"
                />
                <span
                  aria-hidden="true"
                  className="sprockets absolute inset-x-0 bottom-0 h-1 opacity-50"
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
