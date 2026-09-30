'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR, STAGGER } from '@/lib/tokens';
import { cn, clamp } from '@/lib/utils';
import { rowUrl, type RowSource } from '@/lib/rows';
import { qk } from '@/lib/tmdb/query-keys';
import type { Movie, Paginated } from '@/lib/tmdb/types';
import { useMotionPrefs, isReducedNow } from '@/hooks/useMotionPrefs';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { MovieCard } from './MovieCard';

export interface RowProps {
  title: string;
  /** Stable key for caching (e.g. "trending"). */
  rowKey: string;
  href?: string;
  /** Lazy source (fetched when within 600px of the viewport). */
  source?: RowSource;
  /** Server-rendered first page. */
  initial?: Paginated<Movie>;
  /** Static items (watchlist / history rows). */
  items?: Movie[];
  ranked?: boolean;
  /** Eager-load posters for the first N cards (first row only). */
  priorityCount?: number;
  progress?: Record<number, number>;
  onRemove?: (movieId: number) => void;
  sprockets?: boolean;
  className?: string;
  /** Titles to hide (e.g. already in the list). */
  exclude?: ReadonlySet<number>;
}

const CARD_W = 'w-[42vw] sm:w-[30vw] md:w-[22vw] lg:w-[17vw] xl:w-[13.5vw] 2xl:w-[12vw]';

async function fetchPage(source: RowSource, page: number): Promise<Paginated<Movie>> {
  const res = await fetch(rowUrl(source, page));
  if (!res.ok) throw new Error(`row ${res.status}`);
  return (await res.json()) as Paginated<Movie>;
}

/**
 * Carousel row (spec 23): native scroll-snap on touch; arrows, drag-with-inertia and trackpad on
 * desktop; velocity skew while dragging; page bars; sprocket strip parallax; lazy + infinite data.
 */
export function Row({
  title,
  rowKey,
  href,
  source,
  initial,
  items,
  ranked,
  priorityCount = 0,
  progress,
  onRemove,
  sprockets,
  className,
  exclude,
}: RowProps) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(Boolean(initial || items));
  const [pages, setPages] = useState({ current: 0, total: 1 });
  const dragging = useRef(false);
  const { reduced, finePointer } = useMotionPrefs();

  // Lazy: only fetch when within 600px of the viewport.
  useEffect(() => {
    if (near || !section.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(section.current);
    return () => io.disconnect();
  }, [near]);

  const query = useInfiniteQuery({
    queryKey: qk.row(rowKey),
    queryFn: ({ pageParam }) => fetchPage(source as RowSource, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 5) ? last.page + 1 : undefined,
    initialData: initial ? { pages: [initial], pageParams: [1] } : undefined,
    enabled: Boolean(source) && near && !items,
    staleTime: 60 * 60_000,
  });

  const seen = new Set<number>();
  const movies = (items ?? query.data?.pages.flatMap((p) => p.results) ?? []).filter((m) => {
    if (seen.has(m.id) || exclude?.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  const list = ranked ? movies.slice(0, 10) : movies;
  const loading = !items && (query.isPending || !near);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05));
    const current = clamp(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)), 0, total - 1);
    setPages((p) => (p.current === current && p.total === total ? p : { current, total }));
    if (strip.current) strip.current.style.transform = `translate3d(${-el.scrollLeft * 0.2}px,0,0)`;
    // Infinite: load the next page near the end.
    if (
      !ranked &&
      el.scrollLeft + el.clientWidth > el.scrollWidth - el.clientWidth * 0.6 &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      void query.fetchNextPage();
    }
  }, [query, ranked]);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, list.length]);

  const pageBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const target = clamp(
      el.scrollLeft + dir * el.clientWidth * 0.9,
      0,
      el.scrollWidth - el.clientWidth,
    );
    if (isReducedNow()) el.scrollLeft = target;
    else gsap.to(el, { scrollLeft: target, duration: 0.8, ease: 'projector', overwrite: true });
  };

  // Mouse drag with inertia + velocity skew (touch keeps native scroll-snap).
  useEffect(() => {
    const el = track.current;
    if (!el || !finePointer || !el.querySelector('[data-card]')) return;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    let lastX = 0;
    let lastT = 0;
    let v = 0;
    const skewTo = gsap.quickTo(el.querySelectorAll('[data-card] > * > *'), 'skewX', {
      duration: 0.35,
      ease: 'power3.out',
    });

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      dragging.current = false;
      startX = lastX = e.clientX;
      startLeft = el.scrollLeft;
      lastT = performance.now();
      v = 0;
      gsap.killTweensOf(el);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragging.current && Math.abs(dx) > 6) {
        dragging.current = true;
        el.setPointerCapture(e.pointerId);
        el.style.scrollSnapType = 'none';
      }
      if (!dragging.current) return;
      const now = performance.now();
      v = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
      el.scrollLeft = startLeft - dx;
      if (!isReducedNow()) skewTo(clamp(-v * 4, -6, 6));
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      skewTo(0);
      if (dragging.current) {
        const target = clamp(el.scrollLeft - v * 350, 0, el.scrollWidth - el.clientWidth);
        gsap.to(el, {
          scrollLeft: target,
          duration: isReducedNow() ? 0 : 0.9,
          ease: 'power3.out',
          onComplete: () => (el.style.scrollSnapType = ''),
        });
        // Let the click that follows a drag be swallowed by the card.
        setTimeout(() => (dragging.current = false), 0);
      }
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [finePointer, list.length]);

  // Scroll entrance: title wipes in, cards rise (max 8 staggered). Top 10 numerals parallax.
  useGSAP(
    () => {
      const el = section.current;
      if (!el || !list.length) return;
      const titleEl = el.querySelector('[data-row-title]');
      const cards = Array.from(el.querySelectorAll('[data-card]')).slice(0, 12);
      // Reduced motion: no entrance at all. A fade that never finishes would hide the content.
      if (reduced) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top bottom-=60', once: true },
      });
      tl.fromTo(
        titleEl,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.slow, ease: 'projector' },
      );
      tl.from(
        cards.slice(0, STAGGER.maxItems),
        { y: 40, opacity: 0, duration: DUR.slow, ease: 'reel', stagger: STAGGER.base },
        '<0.1',
      );
      if (cards.length > STAGGER.maxItems)
        tl.from(
          cards.slice(STAGGER.maxItems),
          { y: 40, opacity: 0, duration: DUR.slow, ease: 'reel' },
          '<0.2',
        );
      if (ranked) {
        gsap.fromTo(
          el.querySelectorAll('[data-rank-numeral]'),
          { yPercent: 18 },
          {
            yPercent: -18,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
    },
    { scope: section, dependencies: [reduced, list.length > 0], revertOnUpdate: true },
  );

  const onTrackKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('[data-card]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const cards = Array.from(
        track.current?.querySelectorAll<HTMLAnchorElement>('[data-card] a[data-poster-id]') ?? [],
      );
      const i = cards.findIndex((c) => c === document.activeElement);
      const next = cards[clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, cards.length - 1)];
      if (next) {
        e.preventDefault();
        next.focus({ preventScroll: false });
        next.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: isReducedNow() ? 'instant' : 'smooth',
        });
      }
    }
  };

  if (!loading && !list.length) return null;
  const headingId = `row-${rowKey}`;

  return (
    <section
      ref={section}
      aria-labelledby={headingId}
      className={cn('group/row relative overflow-x-clip py-5 md:py-7', className)}
    >
      <div className="px-gutter mb-3 flex items-end justify-between gap-4">
        <div className="group/title flex items-baseline gap-4">
          <h2 id={headingId} data-row-title className="font-display text-h2">
            {title}
          </h2>
          {href && (
            <TransitionLink
              href={href}
              className="text-small text-cyan duration-base ease-reel flex min-h-11 items-center gap-1 font-semibold transition-[opacity,translate] focus-visible:translate-x-0 focus-visible:opacity-100 pointer-fine:-translate-x-3 pointer-fine:opacity-0 pointer-fine:group-hover/title:translate-x-0 pointer-fine:group-hover/title:opacity-100"
            >
              See all<span className="sr-only"> {title}</span>
              <svg viewBox="0 0 24 12" className="h-3 w-5" aria-hidden="true">
                <path
                  d="M1 6h20M16 1l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  pathLength={1}
                  strokeDasharray="1"
                  className="duration-slow ease-reel transition-[stroke-dashoffset] delay-100 [stroke-dashoffset:1] group-focus-within/title:[stroke-dashoffset:0] group-hover/title:[stroke-dashoffset:0]"
                />
              </svg>
            </TransitionLink>
          )}
        </div>
        {pages.total > 1 && (
          <div className="hidden items-center gap-1 md:flex" aria-hidden="true">
            {Array.from({ length: Math.min(pages.total, 10) }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'rounded-pill duration-base h-0.5 w-4 transition-colors',
                  i === pages.current ? 'bg-reel' : 'bg-line',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {sprockets && (
        <div className="mb-2 overflow-hidden" aria-hidden="true">
          <div ref={strip} className="sprockets h-2.5 w-[200%]" />
        </div>
      )}

      <div className="relative">
        <ul
          ref={track}
          onScroll={measure}
          onKeyDown={onTrackKey}
          data-cursor="drag"
          data-lenis-prevent-horizontal
          aria-label={`${title} — use arrow keys to move between titles`}
          className="row-track no-scrollbar px-gutter flex snap-x snap-mandatory scroll-px-(--gutter) gap-3 overflow-x-auto overscroll-x-contain pt-3 pb-12 md:gap-4"
        >
          {loading
            ? Array.from({ length: 8 }, (_, i) => (
                <li key={i} className={cn('shrink-0', CARD_W)}>
                  <CardSkeleton />
                </li>
              ))
            : list.map((m, i) => (
                <li
                  key={m.id}
                  data-card
                  className={cn(
                    'duration-base ease-reel shrink-0 snap-start transition-transform',
                    ranked ? 'w-[62vw] sm:w-[42vw] md:w-[30vw] lg:w-[24vw] xl:w-[19vw]' : CARD_W,
                  )}
                >
                  <div className={reduced ? undefined : 'row-skew'}>
                    <MovieCard
                      movie={m}
                      rank={ranked ? i + 1 : undefined}
                      priority={i < priorityCount}
                      progress={progress?.[m.id]}
                      onRemove={onRemove ? () => onRemove(m.id) : undefined}
                      isDragging={() => dragging.current}
                    />
                  </div>
                </li>
              ))}
          {query.isFetchingNextPage &&
            Array.from({ length: 6 }, (_, i) => (
              <li key={`s${i}`} className={cn('shrink-0', CARD_W)} aria-hidden="true">
                <CardSkeleton />
              </li>
            ))}
        </ul>

        {finePointer && pages.total > 1 && (
          <>
            <div className="duration-base ease-reel pointer-events-none absolute inset-y-0 left-0 z-20 flex -translate-x-2 items-center pl-2 opacity-0 transition-[opacity,translate] group-hover/row:pointer-events-auto group-hover/row:translate-x-0 group-hover/row:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
              <Button
                variant="icon"
                label={`Scroll ${title} left`}
                icon={<ChevronLeft />}
                iconAnim="nudge-left"
                magnetic
                onClick={() => pageBy(-1)}
                disabled={pages.current === 0}
                className="bg-void/70"
              />
            </div>
            <div className="duration-base ease-reel pointer-events-none absolute inset-y-0 right-0 z-20 flex translate-x-2 items-center pr-2 opacity-0 transition-[opacity,translate] group-hover/row:pointer-events-auto group-hover/row:translate-x-0 group-hover/row:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
              <Button
                variant="icon"
                label={`Scroll ${title} right`}
                icon={<ChevronRight />}
                iconAnim="nudge-right"
                magnetic
                onClick={() => pageBy(1)}
                disabled={pages.current >= pages.total - 1 && !query.hasNextPage}
                className="bg-void/70"
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
