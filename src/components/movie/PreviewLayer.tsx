'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Info } from 'lucide-react';
import { usePreviewStore } from '@/stores/preview';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { EASES, DUR } from '@/lib/tokens';
import { getBestLogo } from '@/lib/tmdb/images';
import { genreNames } from '@/lib/tmdb/genres';
import { pickVideos } from '@/lib/tmdb/videos';
import { fallbackGlow } from '@/lib/tmdb/color';
import { formatRuntime, matchPercent, yearOf } from '@/lib/utils';
import { toSnapshot } from '@/lib/snapshot';
import { track } from '@/lib/analytics';
import type { Movie } from '@/lib/tmdb/types';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { WatchlistButton } from './WatchlistButton';
import { LikeButton } from './LikeButton';
import { PlayTrailerButton } from './PlayTrailerButton';

const W = 340;

function PreviewBody({ movie, compact }: { movie: Movie; compact?: boolean }) {
  const { data: detail } = useMovieDetail(movie.id);
  const logo = getBestLogo(detail?.images);
  const videos = pickVideos(detail?.videos.results);
  const genres = detail ? detail.genres.slice(0, 3).map((g) => g.name) : genreNames(movie.genre_ids);
  const snapshot = toSnapshot(detail ?? movie);
  const color = movie.meta?.color ?? fallbackGlow(movie.id);

  return (
    <>
      <div className="relative aspect-video overflow-hidden bg-seat">
        <TmdbImage path={movie.backdrop_path ?? detail?.backdrop_path} kind="backdrop" alt="" sizes={`${W}px`} fallbackTitle={movie.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-aisle via-aisle/10 to-transparent" />
        <div className="absolute inset-x-4 bottom-3 flex h-12 items-end">
          {logo ? (
            <div className="relative h-full w-3/5">
              <TmdbImage path={logo.file_path} kind="logo" alt={movie.title} sizes="200px" className="object-contain object-left-bottom" />
            </div>
          ) : (
            <p className="font-display text-h3 leading-tight">{movie.title}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          {detail && videos.length > 0 ? (
            <PlayTrailerButton movie={snapshot} videos={videos} color={color} variant="icon" size="sm" />
          ) : null}
          <WatchlistButton movie={snapshot} iconOnly size="sm" />
          <LikeButton movieId={movie.id} title={movie.title} size="sm" />
          <Button href={`/movie/${movie.id}`} variant="icon" size="sm" label={`More info about ${movie.title}`} icon={<Info />} iconAnim="spin" className="ml-auto" />
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-small">
          <span className="font-bold text-success">{matchPercent(movie.vote_average)}% match</span>
          <span className="text-dim">{yearOf(movie.release_date)}</span>
          {detail?.runtime ? <span className="text-dim">{formatRuntime(detail.runtime)}</span> : null}
        </p>
        {genres.length > 0 && (
          <ul className="flex flex-wrap gap-x-2 text-small text-reel/80">
            {genres.map((g, i) => (
              <li key={g}>
                {i > 0 && <span aria-hidden="true" className="mr-2 text-line">•</span>}
                {g}
              </li>
            ))}
          </ul>
        )}
        {compact ? null : <p className="line-clamp-3 text-small text-dim">{movie.overview || detail?.overview}</p>}
      </div>
    </>
  );
}

/**
 * Stage-2 card preview (spec 22). Desktop: panel portalled to <body> (never clipped by row
 * overflow) that grows out of the card rect with transforms; stays while the pointer is on it.
 * Touch: bottom sheet (drag to dismiss).
 */
export function PreviewLayer() {
  const { movie, anchor, source, returnFocus, close } = usePreviewStore();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const { reduced } = useMotionPrefs();
  const keyboard = source === 'keyboard';
  useFocusTrap(panel, Boolean(movie) && keyboard, close);

  useEffect(() => close(), [pathname, close]);

  useEffect(() => {
    if (movie) track('card_preview', { movie_id: movie.id });
  }, [movie]);

  useLayoutEffect(() => {
    if (!movie || !anchor || source === 'touch') return;
    const left = Math.min(Math.max(12, anchor.left + anchor.width / 2 - W / 2), window.innerWidth - W - 12);
    const top = Math.max(window.scrollY + 76, anchor.top + window.scrollY + anchor.height / 2 - 210);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measuring the anchor before paint
    setPos({ left, top });
  }, [movie, anchor, source]);

  // Close when the pointer leaves both card and panel; restore focus for keyboard users.
  useEffect(() => {
    if (!movie || source !== 'hover') return;
    const onMove = (e: PointerEvent) => {
      const el = panel.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inPanel = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      const inAnchor =
        anchor && e.clientX >= anchor.left && e.clientX <= anchor.right && e.clientY >= anchor.top && e.clientY <= anchor.bottom;
      if (!inPanel && !inAnchor) close();
    };
    const onScroll = () => close();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('wheel', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('wheel', onScroll);
    };
  }, [movie, source, anchor, close]);

  useEffect(() => {
    if (!movie && returnFocus && document.activeElement === document.body) returnFocus.focus({ preventScroll: true });
  }, [movie, returnFocus]);

  if (typeof document === 'undefined') return null;

  if (source === 'touch') {
    return (
      <Modal open={Boolean(movie)} onClose={close} title={movie?.title ?? 'Preview'} hideTitle variant="sheet" className="p-0">
        {movie && <PreviewBody movie={movie} />}
      </Modal>
    );
  }

  const scaleFrom = anchor ? { scaleX: anchor.width / W, scaleY: anchor.height / 420 } : { scaleX: 0.6, scaleY: 0.6 };

  return createPortal(
    <AnimatePresence>
      {movie && pos && (
        <motion.div
          key={movie.id}
          ref={panel}
          role="dialog"
          aria-label={`${movie.title} preview`}
          data-cursor="default"
          className="absolute z-(--z-preview) overflow-hidden rounded-[10px] border border-line bg-aisle shadow-[0_30px_80px_rgb(0_0_0/0.65)]"
          style={{ left: pos.left, top: pos.top, width: W, ['--glow' as string]: movie.meta?.color ?? fallbackGlow(movie.id) }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, ...scaleFrom }}
          animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, ...scaleFrom, transition: { duration: DUR.fast, ease: EASES.shutter } }}
          transition={{ duration: DUR.base, ease: EASES.reel }}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <span aria-hidden="true" className="pointer-events-none absolute -inset-10 -z-10 opacity-40 blur-3xl" style={{ background: 'var(--glow)' }} />
          <PreviewBody movie={movie} compact={false} />
          {keyboard && (
            <p className="sr-only" aria-live="polite">
              Preview open. Press Escape to close.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
