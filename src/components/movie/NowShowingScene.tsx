'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { COLORS } from '@/lib/tokens';
import { fallbackGlow } from '@/lib/tmdb/color';
import { SIZES } from '@/lib/tmdb/images';
import type { Movie } from '@/lib/tmdb/types';
import { cardLabel } from '@/lib/snapshot';
import { PinScene } from '@/components/motion/PinScene';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { TransitionLink } from '@/components/layout/TransitionLink';

/**
 * "Now showing" pinned scene (spec 32.3): scroll scrubs a 3D stack of 5 posters that fan out,
 * rotate and settle into a line while the background shifts through each poster's colour.
 * Below 768px / reduced motion it is a simple revealed line of posters.
 */
export function NowShowingScene({ movies }: { movies: Movie[] }) {
  const five = movies.slice(0, 5);
  const bg = useRef<HTMLDivElement>(null);
  if (five.length < 3) return null;
  const colors = five.map((m) => m.meta?.color ?? fallbackGlow(m.id));

  return (
    <PinScene
      length={2.2}
      className="flex min-h-svh items-center overflow-hidden"
      build={(tl, el) => {
        const cards = el.querySelectorAll<HTMLElement>('[data-ns-card]');
        const n = cards.length;
        gsap.set(cards, { transformPerspective: 1200, transformOrigin: '50% 100%' });
        // Stack
        cards.forEach((c, i) => gsap.set(c, { xPercent: -50, x: 0, y: i * -8, z: -i * 60, rotateY: -12, rotateZ: (i - n / 2) * 1.5, autoAlpha: 1 }));
        gsap.set(el.querySelector('[data-ns-title]'), { autoAlpha: 0, y: 30 });
        // Fan out
        tl.to(cards, { rotateZ: (i) => (i - (n - 1) / 2) * 14, x: (i) => (i - (n - 1) / 2) * 60, y: (i) => Math.abs(i - (n - 1) / 2) * 24, z: 0, rotateY: 0, duration: 1, ease: 'power2.inOut' }, 0);
        // Rotate + settle into a line
        tl.to(cards, { rotateZ: 0, rotateY: 360, x: (i) => (i - (n - 1) / 2) * (Math.min(window.innerWidth, 1400) / n), y: 0, duration: 1.4, ease: 'power3.inOut', stagger: 0.05 }, 1);
        tl.to(el.querySelector('[data-ns-title]'), { autoAlpha: 1, y: 0, duration: 0.6 }, 1.8);
        // Background colour journey
        colors.forEach((c, i) => tl.to(bg.current, { backgroundColor: c, duration: 0.5, ease: 'none' }, (i / colors.length) * 2.4));
        tl.to(bg.current, { backgroundColor: COLORS.void, duration: 0.4 }, 2.4);
      }}
      fallback={(el) => {
        gsap.from(el.querySelectorAll('[data-ns-card]'), { autoAlpha: 0, y: 30, stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
      }}
    >
      <div ref={bg} aria-hidden="true" className="absolute inset-0 -z-10 bg-void opacity-25 transition-none" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-void via-transparent to-void" aria-hidden="true" />
      <div className="relative w-full">
        <h2 className="mb-8 px-gutter text-center font-display text-h1">
          Now <em className="font-normal text-violet not-italic [font-variation-settings:'SOFT'_100]">showing</em>
        </h2>
        <ul className="relative mx-auto flex h-[min(52vh,440px)] w-full items-center justify-center max-md:h-auto max-md:snap-x max-md:justify-start max-md:gap-3 max-md:overflow-x-auto max-md:px-gutter max-md:pb-4 md:block">
          {five.map((m, i) => (
            <li key={m.id} data-ns-card className="aspect-[2/3] w-[clamp(140px,16vw,240px)] shrink-0 md:absolute md:top-0 md:left-1/2" style={{ zIndex: five.length - i }}>
              <TransitionLink href={`/movie/${m.id}`} aria-label={cardLabel(m)} data-cursor="play" data-cursor-label="Open" className="relative block size-full overflow-hidden rounded-poster shadow-[0_30px_60px_rgb(0_0_0/0.5)]">
                <TmdbImage path={m.poster_path} kind="poster" alt={`${m.title} poster`} sizes={SIZES.card} blurDataURL={m.meta?.blur} fallbackTitle={m.title} />
              </TransitionLink>
            </li>
          ))}
        </ul>
        <p data-ns-title className="mt-8 text-center text-small text-dim max-md:hidden">In cinemas this week — scroll to spin the reel.</p>
      </div>
    </PinScene>
  );
}
