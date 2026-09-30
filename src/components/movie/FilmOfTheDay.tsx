'use client';

import { useEffect, useRef, useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import type { Movie } from '@/lib/tmdb/types';
import { SIZES } from '@/lib/tmdb/images';
import { toSnapshot } from '@/lib/snapshot';
import { genreNames } from '@/lib/tmdb/genres';
import { yearOf } from '@/lib/utils';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Button } from '@/components/ui/Button';
import { RatingRing } from '@/components/ui/RatingRing';
import { WatchlistButton } from './WatchlistButton';

function untilMidnightUtc(now: number): string {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((next.getTime() - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/**
 * Film of the Day: one pick per UTC day, a wide art banner that wipes open on scroll, and a
 * live countdown to tomorrow's pick.
 */
export function FilmOfTheDay({ movie }: { movie: Movie }) {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  const [left, setLeft] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLeft(untilMidnightUtc(Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useGSAP(
    () => {
      if (reduced || !root.current) return;
      const banner = root.current.querySelector('[data-fotd-banner]');
      const art = root.current.querySelector('[data-fotd-art]');
      if (!banner || !art) return;
      gsap.fromTo(
        banner,
        { clipPath: 'inset(12% 8% 12% 8% round 24px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 16px)',
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top 35%', scrub: 0.6 },
        },
      );
      gsap.fromTo(
        art,
        { yPercent: -8, scale: 1.12 },
        {
          yPercent: 8,
          scale: 1.12,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  const genres = genreNames(movie.genre_ids, 3);
  return (
    <section ref={root} aria-labelledby="fotd-h" className="px-gutter my-16 md:my-24">
      <div data-fotd-banner className="rounded-modal lit-edge relative isolate overflow-hidden">
        <div data-fotd-art aria-hidden="true" className="absolute inset-0 -z-10">
          <TmdbImage path={movie.backdrop_path} kind="backdrop" alt="" sizes="100vw" plain />
        </div>
        <div
          aria-hidden="true"
          className="from-void via-void/80 absolute inset-0 -z-[5] bg-gradient-to-r to-transparent"
        />
        <div className="grid items-end gap-8 p-6 md:grid-cols-[220px_1fr] md:p-12">
          <div className="rounded-poster relative aspect-[2/3] w-40 overflow-hidden shadow-[0_30px_60px_rgb(0_0_0/0.55)] md:w-full">
            <TmdbImage
              path={movie.poster_path}
              kind="poster"
              alt={`${movie.title} poster`}
              sizes={SIZES.card}
              fallbackTitle={movie.title}
            />
          </div>
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="meta-caps text-amber flex items-center gap-2">
              <Clapperboard className="size-4" aria-hidden="true" /> Film of the day
            </p>
            <h2 id="fotd-h" className="font-display text-h1">
              {movie.title}
            </h2>
            <p className="meta-caps text-reel/80 flex flex-wrap items-center gap-3">
              {movie.vote_average > 0 && (
                <RatingRing value={movie.vote_average} size={36} label="Audience rating" />
              )}
              <span>{yearOf(movie.release_date)}</span>
              {genres.length > 0 && <span className="text-dim">{genres.join(' · ')}</span>}
            </p>
            {movie.overview && <p className="text-reel/85 line-clamp-3">{movie.overview}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button href={`/movie/${movie.id}`}>See details</Button>
              <WatchlistButton movie={toSnapshot(movie)} />
            </div>
            <p className="text-dim text-small" aria-live="off">
              Next pick in{' '}
              <span className="text-reel font-semibold tabular-nums" suppressHydrationWarning>
                {left ?? '--:--:--'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
