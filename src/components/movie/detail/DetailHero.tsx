'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR } from '@/lib/tokens';
import { formatRuntime, yearOf } from '@/lib/utils';
import { SIZES, tmdbImage } from '@/lib/tmdb/images';
import { languageName } from '@/lib/tmdb/languages';
import { genreBySlug, GENRES } from '@/lib/tmdb/genres';
import { toSnapshot } from '@/lib/snapshot';
import { lastDetail, PAGE_INTRO_EVENT } from '@/lib/transition';
import type { MovieDetail, TmdbImage as TmdbImageT, Video } from '@/lib/tmdb/types';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { RatingRing } from '@/components/ui/RatingRing';
import { Pill } from '@/components/ui/Pill';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { WatchlistButton } from '../WatchlistButton';
import { PlayTrailerButton } from '../PlayTrailerButton';
import { RateButton } from './RateButton';
import { ShareButton } from './ShareButton';

const DustField = dynamic(() => import('@/components/gl/DustField').then((m) => m.DustField), {
  ssr: false,
});

interface Props {
  movie: MovieDetail;
  logo: TmdbImageT | null;
  videos: Video[];
  color: string;
  blur: string | null;
  certification: string | null;
}

/**
 * Detail backdrop hero (spec 24.1): ambient light tinted by the poster's dominant colour bleeding
 * into the page, Ken Burns backdrop (L3), shared-element poster target, dust in the projector
 * light (WebGL), meta, genres and actions.
 */
export function DetailHero({ movie, logo, videos, color, blur, certification }: Props) {
  const root = useRef<HTMLElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const { reduced, webglEnabled } = useMotionPrefs();
  const snap = toSnapshot(movie);

  // Remember poster rect for the reverse flight on back navigation (spec 35).
  useEffect(() => {
    const el = poster.current;
    const update = () => {
      if (!el) return;
      lastDetail.id = movie.id;
      lastDetail.rect = el.getBoundingClientRect();
      lastDetail.src = el.querySelector('img')?.currentSrc ?? tmdbImage(movie.poster_path, 'w500');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('popstate', update, { capture: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('popstate', update, { capture: true });
    };
  }, [movie.id, movie.poster_path]);

  useGSAP(
    () => {
      if (reduced || !root.current) return;
      gsap.fromTo(
        '[data-kenburns]',
        { scale: 1 },
        { scale: 1.08, duration: 20, ease: 'none', repeat: -1, yoyo: true },
      );
      gsap.to('[data-detail-backdrop]', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      const intro = () =>
        gsap.from('[data-detail-meta] > *', {
          y: 24,
          opacity: 0,
          duration: DUR.slow,
          ease: 'reel',
          stagger: 0.05,
        });
      window.addEventListener(PAGE_INTRO_EVENT, intro, { once: true });
      return () => window.removeEventListener(PAGE_INTRO_EVENT, intro);
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  const year = yearOf(movie.release_date);
  const genreLinks = movie.genres
    .slice(0, 4)
    .map((g) => ({ ...g, slug: GENRES.find((x) => x.id === g.id)?.slug }));

  return (
    <header ref={root} data-hero className="relative isolate min-h-[92svh] overflow-hidden">
      {/* Ambient light bleeding into the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[140%] opacity-35"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 30% 30%, ${color}, transparent 70%)`,
        }}
      />
      <div data-detail-backdrop className="absolute inset-0 -z-10">
        <div data-kenburns className="absolute inset-0 origin-[60%_40%]">
          <TmdbImage
            path={movie.backdrop_path ?? movie.poster_path}
            kind={movie.backdrop_path ? 'backdrop' : 'poster'}
            alt=""
            sizes="100vw"
            priority
            plain
          />
        </div>
        <div aria-hidden="true" className="vignette absolute inset-0" />
        <div
          aria-hidden="true"
          className="from-void via-void/55 to-void/10 absolute inset-0 bg-gradient-to-t"
        />
      </div>
      {webglEnabled && !reduced && <DustField color={color} />}

      <div className="px-gutter relative mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-end gap-8 pt-32 pb-14 md:flex-row md:items-end md:gap-12">
        <div
          ref={poster}
          data-shared-poster={movie.id}
          className="rounded-poster relative aspect-[2/3] w-[min(46vw,300px)] shrink-0 overflow-hidden shadow-[0_40px_90px_rgb(0_0_0/0.6)] max-md:mx-auto"
        >
          <TmdbImage
            path={movie.poster_path}
            kind="poster"
            alt={`${movie.title} poster`}
            sizes={SIZES.detailPoster}
            blurDataURL={blur}
            priority
            fallbackTitle={movie.title}
          />
        </div>

        <div
          data-detail-meta
          className="flex min-w-0 flex-1 flex-col gap-5 max-md:items-center max-md:text-center"
        >
          {logo ? (
            <>
              <h1 className="sr-only">{movie.title}</h1>
              <div
                className="relative w-[min(80vw,480px)]"
                style={{ aspectRatio: `${Math.max(1.4, logo.aspect_ratio)}` }}
              >
                <TmdbImage
                  path={logo.file_path}
                  kind="logo"
                  alt=""
                  sizes={SIZES.logo}
                  priority
                  className="object-contain object-left-bottom max-md:object-bottom"
                />
              </div>
            </>
          ) : (
            <SplitHeading
              as="h1"
              by="chars"
              trigger="mount"
              delay={0.3}
              className="font-display text-h1"
            >
              {movie.title}
            </SplitHeading>
          )}
          {movie.tagline && (
            <p className="font-display text-h3 text-reel/80 italic [font-variation-settings:'SOFT'_100]">
              {movie.tagline}
            </p>
          )}
          <div className="text-small text-reel/85 flex flex-wrap items-center gap-x-4 gap-y-2 max-md:justify-center">
            <RatingRing value={movie.vote_average} size={52} label="TMDB rating" />
            {year && <span>{year}</span>}
            {certification && (
              <span className="border-reel/40 rounded border px-1.5 text-[0.75rem]">
                {certification}
              </span>
            )}
            {movie.runtime ? <ScrambleText text={formatRuntime(movie.runtime)} /> : null}
            <span className="text-dim">{languageName(movie.original_language)}</span>
          </div>
          {genreLinks.length > 0 && (
            <ul className="flex flex-wrap gap-2 max-md:justify-center" aria-label="Genres">
              {genreLinks.map((g) => (
                <li key={g.id}>
                  <Pill
                    href={g.slug && genreBySlug(g.slug) ? `/browse/${g.slug}` : '/browse'}
                    size="sm"
                  >
                    {g.name}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3 max-md:justify-center">
            {videos.length > 0 && (
              <PlayTrailerButton movie={snap} videos={videos} color={color} size="lg" />
            )}
            <WatchlistButton movie={snap} size="lg" />
            <RateButton movieId={movie.id} title={movie.title} tmdbAverage={movie.vote_average} />
            <ShareButton title={movie.title} />
          </div>
          {videos.length === 0 && <p className="text-small text-dim">No trailer available.</p>}
        </div>
      </div>
    </header>
  );
}
