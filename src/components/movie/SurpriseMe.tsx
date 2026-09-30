'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dices, RotateCw } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { play } from '@/lib/sound';
import { SIZES } from '@/lib/tmdb/images';
import type { Movie, Paginated } from '@/lib/tmdb/types';
import { toSnapshot } from '@/lib/snapshot';
import { yearOf } from '@/lib/utils';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RatingRing } from '@/components/ui/RatingRing';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { FilmReelSpinner } from '@/components/ui/FilmReelSpinner';
import { WatchlistButton } from './WatchlistButton';

const STRIP_LENGTH = 18;
/** Left and right reels stop first, the centre one last — the slot-machine beat. */
const REELS = [
  { duration: 1.6, side: true },
  { duration: 2.4, side: false },
  { duration: 2.0, side: true },
] as const;

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** A strip of posters that ends on `last`. */
function strip(pool: Movie[], last: Movie): Movie[] {
  const others = shuffled(pool.filter((m) => m.id !== last.id));
  const body = Array.from(
    { length: STRIP_LENGTH - 1 },
    (_, i) => others[i % others.length] ?? last,
  );
  return [...body, last];
}

async function fetchPool(query: string): Promise<Movie[]> {
  const get = async (page: number) => {
    const res = await fetch(`/api/tmdb/discover/movie?${query}&page=${page}&with_meta=1`);
    if (!res.ok) throw new Error('discover');
    return (await res.json()) as Paginated<Movie>;
  };
  const first = await get(1);
  const pages = Math.min(first.total_pages, 5);
  const extra =
    pages > 1 ? await get(2 + Math.floor(Math.random() * (pages - 1))).catch(() => null) : null;
  return [...first.results, ...(extra?.results ?? [])];
}

/**
 * "Surprise me": picks a random title from the current filters (or a mood, or what's popular)
 * and reveals it on three spinning poster reels. Reduced motion shows the pick straight away.
 */
export function SurpriseMe({
  query = 'sort_by=popularity.desc&vote_count.gte=200',
  size = 'md',
  variant = 'secondary',
  className,
}: {
  /** TMDB discover params (without page). */
  query?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pool, setPool] = useState<Movie[] | null>(null);
  const [error, setError] = useState(false);
  const [strips, setStrips] = useState<Movie[][] | null>(null);
  const [landed, setLanded] = useState(false);
  const reels = useRef<(HTMLDivElement | null)[]>([]);

  const pick = strips?.[1]?.[STRIP_LENGTH - 1] ?? null;

  const spin = useCallback((list: Movie[]) => {
    const choices = shuffled(list);
    const [left, center, right] = [choices[1], choices[0], choices[2]];
    if (!center) return;
    setLanded(isReducedNow());
    setStrips([strip(list, left ?? center), strip(list, center), strip(list, right ?? center)]);
  }, []);

  // Load a fresh pool whenever the dialog opens (the filters may have changed).
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetchPool(query)
      .then((list) => {
        if (!alive) return;
        if (list.length === 0) return setError(true);
        setPool(list);
        spin(list);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [open, query, spin]);

  // Run the reels.
  useEffect(() => {
    if (!strips) return;
    const els = reels.current.filter((e): e is HTMLDivElement => Boolean(e));
    // Each reel's last poster ends centred in the window.
    const geometry = els.map((el) => {
      const item = el.firstElementChild as HTMLElement | null;
      const h = item?.offsetHeight ?? 0;
      const step = h + 12;
      const offset = ((el.parentElement?.parentElement?.clientHeight ?? h) - h) / 2;
      return { step, start: offset, end: offset - (STRIP_LENGTH - 1) * step };
    });
    if (isReducedNow()) {
      els.forEach((el, i) => gsap.set(el, { y: geometry[i]?.end ?? 0 }));
      return;
    }
    let lastIndex = 0;
    const tweens = els.map((el, i) =>
      gsap.fromTo(
        el,
        { y: geometry[i]?.start ?? 0 },
        {
          y: geometry[i]?.end ?? 0,
          duration: REELS[i]?.duration ?? 2,
          ease: 'power4.out',
          onUpdate() {
            if (i !== 1) return;
            const g = geometry[1];
            if (!g) return;
            const idx = Math.round((g.start - Number(gsap.getProperty(el, 'y'))) / g.step);
            if (idx !== lastIndex) {
              lastIndex = idx;
              void play('tick');
            }
          },
          onComplete() {
            if (i !== 1) return;
            setLanded(true);
            void play('pop');
          },
        },
      ),
    );
    return () => tweens.forEach((t) => t.kill());
  }, [strips]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        icon={<Dices />}
        iconAnim="spin"
        magnetic={false}
        onClick={() => {
          setError(false);
          setPool(null);
          setStrips(null);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className={className}
      >
        Surprise me
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tonight’s pick"
        className="md:w-[min(92vw,640px)]"
      >
        <div aria-live="polite" className="sr-only">
          {landed && pick
            ? `Tonight’s pick: ${pick.title}, ${yearOf(pick.release_date) ?? ''}`
            : ''}
        </div>
        {error ? (
          <p className="text-dim py-10 text-center">
            Couldn’t find anything to pick from. Try widening the filters.
          </p>
        ) : !strips || !pool ? (
          <div className="grid place-items-center py-16">
            <FilmReelSpinner />
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="relative mt-4 flex items-center justify-center gap-3 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
              style={{ height: 'min(46vh, 340px)' }}
            >
              {strips.map((list, r) => (
                <div
                  key={r}
                  className={
                    REELS[r]?.side
                      ? 'h-full w-[26%] max-w-[140px] opacity-55'
                      : 'z-[1] h-full w-[34%] max-w-[190px]'
                  }
                >
                  <div
                    ref={(el) => {
                      reels.current[r] = el;
                    }}
                    className="flex flex-col gap-3 will-change-transform"
                  >
                    {list.map((m, k) => (
                      <div
                        key={`${m.id}-${k}`}
                        className="rounded-poster bg-seat relative aspect-[2/3] shrink-0 overflow-hidden"
                      >
                        <TmdbImage
                          path={m.poster_path}
                          kind="poster"
                          alt=""
                          sizes={SIZES.card}
                          fallbackTitle={m.title}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <span
                aria-hidden="true"
                className="border-violet/60 rounded-poster pointer-events-none absolute top-1/2 left-1/2 z-[2] aspect-[2/3] w-[34%] max-w-[190px] -translate-x-1/2 -translate-y-1/2 border-2 shadow-[0_0_40px_color-mix(in_oklab,var(--marquee-violet)_45%,transparent)]"
              />
            </div>
            <div
              className={`duration-base ease-reel mt-6 flex flex-col items-center gap-3 text-center transition-opacity ${landed ? 'opacity-100' : 'opacity-0'}`}
            >
              {pick && (
                <>
                  <p className="font-display text-h3">{pick.title}</p>
                  <p className="meta-caps text-dim flex items-center gap-3">
                    {pick.vote_average > 0 && (
                      <RatingRing value={pick.vote_average} size={32} label="Audience rating" />
                    )}
                    <span>{yearOf(pick.release_date)}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    <Button href={`/movie/${pick.id}`} onClick={() => setOpen(false)}>
                      See details
                    </Button>
                    <WatchlistButton movie={toSnapshot(pick)} />
                    <Button
                      variant="secondary"
                      icon={<RotateCw />}
                      iconAnim="spin"
                      magnetic={false}
                      onClick={() => spin(pool)}
                      disabled={!landed}
                    >
                      Spin again
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
