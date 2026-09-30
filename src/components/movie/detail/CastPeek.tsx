'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { qk } from '@/lib/tmdb/query-keys';
import type { Movie } from '@/lib/tmdb/types';
import { useHoverIntent } from '@/hooks/useHoverIntent';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';

const FAN = [-7, 0, 7];

/**
 * Hovering a cast member (fine pointers) peeks at three titles they're known for, fanned above
 * the portrait. Decorative — the same films are on the person page the link opens — so it is
 * aria-hidden and never takes focus. Rendered in a portal: the cast strip scrolls sideways and
 * would clip it.
 */
export function CastPeek({
  personId,
  excludeMovieId,
  children,
}: {
  personId: number;
  excludeMovieId: number;
  children: ReactNode;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const { finePointer, reduced } = useMotionPrefs();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const intent = useHoverIntent(() => {
    if (anchor.current) setRect(anchor.current.getBoundingClientRect());
  }, 350);

  const q = useQuery({
    queryKey: qk.personCredits(personId),
    enabled: rect !== null,
    staleTime: 60 * 60_000,
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/tmdb/person/${personId}/movie_credits`, { signal });
      if (!res.ok) throw new Error('credits');
      return ((await res.json()) as { cast: Movie[] }).cast;
    },
  });
  const films = (q.data ?? []).filter((f) => f.id !== excludeMovieId).slice(0, 3);

  const close = () => {
    intent.cancel();
    setRect(null);
  };

  return (
    <div
      ref={anchor}
      onPointerEnter={(e) => finePointer && e.pointerType === 'mouse' && intent.start()}
      onPointerLeave={close}
      onPointerDown={close}
    >
      {children}
      {hydrated &&
        createPortal(
          <AnimatePresence>
            {rect && films.length > 0 && (
              <m.div
                aria-hidden="true"
                className="rounded-modal bg-aisle lit-edge pointer-events-none fixed z-(--z-preview) w-56 p-3"
                style={{
                  left: Math.min(
                    Math.max(8, rect.left + rect.width / 2 - 112),
                    window.innerWidth - 232,
                  ),
                  top: rect.top - 8,
                  translateY: '-100%',
                }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="meta-caps text-dim mb-2">Known for</p>
                <div className="flex justify-center gap-2">
                  {films.map((f, i) => (
                    <m.div
                      key={f.id}
                      className="rounded-poster bg-seat relative aspect-[2/3] w-16 overflow-hidden shadow-lg"
                      initial={reduced ? false : { rotate: 0, y: 8 }}
                      animate={{ rotate: FAN[i] ?? 0, y: i === 1 ? -4 : 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      <TmdbImage
                        path={f.poster_path}
                        kind="poster"
                        alt=""
                        sizes="64px"
                        fallbackTitle={f.title}
                      />
                    </m.div>
                  ))}
                </div>
                <p className="text-small mt-2 truncate text-center">{films[0]?.title}</p>
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
