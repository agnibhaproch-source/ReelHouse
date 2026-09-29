'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap, Flip, ScrollTrigger } from '@/lib/gsap';
import { DUR, STAGGER } from '@/lib/tokens';
import { SIZES } from '@/lib/tmdb/images';
import type { Movie } from '@/lib/tmdb/types';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  /** Appends 6 skeleton cards (infinite scroll). */
  loadingMore?: boolean;
  onEndReached?: () => void;
  hasMore?: boolean;
  className?: string;
  /** Per-card extra UI (e.g. remove button on My list). */
  renderExtra?: (m: Movie) => ReactNode;
  onRemove?: (m: Movie) => void;
  label: string;
}

const FLIP_LIMIT = 60;
type Item = { m: Movie; leaving: boolean };

const ids = (list: { id: number }[]) => list.map((m) => m.id).join(',');

/**
 * Grid (auto-fill, min 160px) with batch reveals, infinite scroll sentinel, and GSAP Flip on
 * reorder: items glide, new ones fade/scale in, removed ones scale out (fade if > 60 items).
 */
export function MovieGrid({
  movies,
  loadingMore,
  onEndReached,
  hasMore,
  className,
  renderExtra,
  onRemove,
  label,
}: MovieGridProps) {
  const root = useRef<HTMLUListElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>(() => movies.map((m) => ({ m, leaving: false })));
  const flipState = useRef<Flip.FlipState | null>(null);
  const revealed = useRef(new Set<number>());
  const key = ids(movies);

  // New list: measure the old layout (still on screen), then swap — Flip plays after the commit.
  useLayoutEffect(() => {
    const current = items.filter((i) => !i.leaving).map((i) => i.m);
    if (ids(current) === key) return;
    const appended = current.length > 0 && key.startsWith(ids(current));
    const next = new Set(movies.map((m) => m.id));
    const leaving = appended
      ? []
      : current.filter((m) => !next.has(m.id)).map((m) => ({ m, leaving: true }));
    if (!appended && root.current && !isReducedNow() && movies.length <= FLIP_LIMIT) {
      flipState.current = Flip.getState(root.current.querySelectorAll('[data-flip-id]'));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measure-then-swap is how Flip works
    setItems([...movies.map((m) => ({ m, leaving: false })), ...leaving]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the id list only
  }, [key]);

  useLayoutEffect(() => {
    const el = root.current;
    const state = flipState.current;
    const clearLeaving = () =>
      setItems((cur) => (cur.some((i) => i.leaving) ? cur.filter((i) => !i.leaving) : cur));
    if (!el) return;
    if (!state) {
      if (items.some((i) => i.leaving)) clearLeaving();
      return;
    }
    flipState.current = null;
    Flip.from(state, {
      targets: el.querySelectorAll('[data-flip-id]'),
      duration: DUR.slow,
      ease: 'projector',
      absolute: true,
      nested: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: DUR.base, ease: 'reel' },
        ),
      onLeave: (els) =>
        gsap.to(els, { opacity: 0, scale: 0.8, duration: DUR.fast, ease: 'shutter' }),
      onComplete: clearLeaving,
    });
  }, [items]);

  // Batch reveal for newly mounted cards (ScrollTrigger.batch).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fresh = Array.from(el.querySelectorAll<HTMLElement>('[data-flip-id]')).filter((n) => {
      const id = Number(n.dataset.flipId);
      if (revealed.current.has(id)) return false;
      revealed.current.add(id);
      return true;
    });
    if (!fresh.length || isReducedNow()) return;
    gsap.set(fresh, { opacity: 0, y: 30 });
    const triggers = ScrollTrigger.batch(fresh, {
      start: 'top 95%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: DUR.slow,
          ease: 'reel',
          stagger: { each: STAGGER.base, amount: STAGGER.base * STAGGER.maxItems },
        }),
    });
    return () => triggers.forEach((t) => t.kill());
  }, [items]);

  // Infinite scroll sentinel.
  useEffect(() => {
    const s = sentinel.current;
    if (!s || !hasMore || !onEndReached) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && onEndReached(), {
      rootMargin: '800px 0px',
    });
    io.observe(s);
    return () => io.disconnect();
  }, [hasMore, onEndReached, items.length]);

  return (
    <>
      <ul
        ref={root}
        aria-label={label}
        className={cn(
          'relative grid grid-cols-[repeat(auto-fill,minmax(min(160px,42vw),1fr))] gap-x-4 gap-y-6',
          className,
        )}
      >
        {items.map(({ m, leaving }, i) => (
          <li
            key={m.id}
            data-flip-id={m.id}
            aria-hidden={leaving || undefined}
            className={cn('relative', leaving && 'pointer-events-none')}
          >
            <MovieCard
              movie={m}
              priority={i < 6}
              sizes={SIZES.gridCard}
              onRemove={onRemove && !leaving ? () => onRemove(m) : undefined}
            />
            {renderExtra?.(m)}
          </li>
        ))}
        {loadingMore &&
          Array.from({ length: 6 }, (_, i) => (
            <li key={`sk${i}`} aria-hidden="true">
              <CardSkeleton />
            </li>
          ))}
      </ul>
      <div ref={sentinel} aria-hidden="true" className="h-px" />
    </>
  );
}
