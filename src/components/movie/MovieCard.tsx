'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { X } from 'lucide-react';
import { cn, isNewRelease, yearOf } from '@/lib/utils';
import { SIZES } from '@/lib/tmdb/images';
import { fallbackGlow } from '@/lib/tmdb/color';
import type { Movie } from '@/lib/tmdb/types';
import { cardLabel } from '@/lib/snapshot';
import { requestTransition, shouldIntercept } from '@/lib/transition';
import { play } from '@/lib/sound';
import { gsap } from '@/lib/gsap';
import { DUR } from '@/lib/tokens';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { RatingRing } from '@/components/ui/RatingRing';
import { useTilt } from '@/hooks/useTilt';
import { useHoverIntent } from '@/hooks/useHoverIntent';
import { usePrefetchMovie } from '@/hooks/useMovieDetail';
import { useMotionPrefs, isReducedNow } from '@/hooks/useMotionPrefs';
import { usePress } from '@/hooks/usePress';
import { usePreviewStore } from '@/stores/preview';

export interface MovieCardProps {
  movie: Movie;
  rank?: number;
  priority?: boolean;
  className?: string;
  /** 0–1 trailer-watched line (Continue exploring). */
  progress?: number;
  onRemove?: () => void;
  /** Disable navigation while a carousel drag is in progress. */
  isDragging?: () => boolean;
  sizes?: string;
}

const PREVIEW_DELAY = 450;
const PREFETCH_DELAY = 150;
const LONG_PRESS = 500;

/**
 * Movie card (spec 22). Stage 1 hover: lift, 3D tilt, poster-colour glow, glare, neighbour
 * shift (CSS :has on the row), cursor "Preview". Stage 2 (450ms intent): expands into the preview
 * panel (portal). Click: press + shared-poster flight to /movie/[id]. Keyboard: Enter opens,
 * Space previews. Touch: tap navigates, long-press opens the preview sheet.
 */
export function MovieCard({
  movie,
  rank,
  priority,
  className,
  progress,
  onRemove,
  isDragging,
  sizes = SIZES.card,
}: MovieCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const { reduced, finePointer } = useMotionPrefs();
  const prefetch = usePrefetchMovie();
  const openPreview = usePreviewStore((s) => s.open);
  const press = usePress<HTMLAnchorElement>({
    accent: 'var(--text-reel)',
    scale: 0.97,
    sound: false,
  });
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  useTilt(cardRef, 8, finePointer && !reduced);

  const href = `/movie/${movie.id}`;
  const glow = movie.meta?.color ?? fallbackGlow(movie.id);
  const isNew = isNewRelease(movie.release_date);

  const showPreview = (source: 'hover' | 'keyboard' | 'touch') => {
    const el = cardRef.current;
    if (!el) return;
    openPreview(movie, el.getBoundingClientRect(), source, linkRef.current);
  };
  const intent = useHoverIntent(() => showPreview('hover'), PREVIEW_DELAY);
  const prefetchIntent = useHoverIntent(() => prefetch(movie.id), PREFETCH_DELAY);

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    setHovered(true);
    void play('tick');
    intent.start();
    prefetchIntent.start();
  };
  const onLeave = () => {
    setHovered(false);
    intent.cancel();
    prefetchIntent.cancel();
  };

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    intent.cancel();
    if (isDragging?.() || longPressed.current) {
      e.preventDefault();
      longPressed.current = false;
      return;
    }
    if (!shouldIntercept(e, href)) return;
    e.preventDefault();
    usePreviewStore.getState().close();
    const img = cardRef.current?.querySelector('img');
    const rect = cardRef.current?.querySelector('[data-poster]')?.getBoundingClientRect();
    const src = img?.currentSrc;
    const push = (h: string) => router.push(h, { scroll: false });
    if (img && rect && src && !isReducedNow()) {
      requestTransition({
        href,
        kind: 'poster',
        push,
        poster: { id: movie.id, src, rect, radius: 6 },
      });
    } else {
      requestTransition({ href, kind: 'shutter', push });
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      showPreview('keyboard');
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLAnchorElement>) => {
    press.onPointerDown(e);
    if (e.pointerType === 'mouse') return;
    longPressed.current = false;
    longPress.current = setTimeout(() => {
      longPressed.current = true;
      if ('vibrate' in navigator) navigator.vibrate?.(8);
      showPreview('touch');
    }, LONG_PRESS);
  };
  const clearLong = () => {
    if (longPress.current) clearTimeout(longPress.current);
  };

  return (
    <div
      className={cn('group/card relative', rank !== undefined && 'flex items-end', className)}
      data-card-hover={hovered || undefined}
    >
      {rank !== undefined && (
        <span
          aria-hidden="true"
          data-rank-numeral
          className="font-display duration-base rank-numeral pointer-events-none -mr-[0.18em] shrink-0 text-[clamp(5rem,11vw,9.5rem)] leading-[0.78] font-black tracking-[-0.08em] select-none"
        >
          {rank}
        </span>
      )}
      <div className="relative min-w-0 flex-1">
        <div
          ref={cardRef}
          className="relative will-change-auto [transform-style:preserve-3d] group-hover/card:will-change-transform"
          style={{ ['--glow' as string]: glow }}
        >
          {/* Glow — dominant poster colour on a pseudo layer, opacity only */}
          <span
            aria-hidden="true"
            className="rounded-poster duration-base ease-reel pointer-events-none absolute inset-2 -z-10 opacity-0 blur-[40px] transition-opacity group-focus-within/card:opacity-55 group-hover/card:opacity-55"
            style={{ background: 'var(--glow)' }}
          />
          <Link
            ref={linkRef}
            href={href}
            prefetch={false}
            aria-label={cardLabel(movie)}
            data-cursor="play"
            data-cursor-label="Preview"
            data-poster-id={movie.id}
            data-pressable
            onClick={onClick}
            onKeyDown={onKeyDown}
            onPointerEnter={onEnter}
            onPointerLeave={(e) => {
              onLeave();
              press.onPointerLeave(e);
              clearLong();
            }}
            onPointerDown={onPointerDown}
            onPointerUp={(e) => {
              press.onPointerUp(e);
              clearLong();
            }}
            onPointerCancel={clearLong}
            onContextMenu={(e) => longPressed.current && e.preventDefault()}
            onFocus={() => prefetch(movie.id)}
            draggable={false}
            className="rounded-poster duration-base ease-reel block outline-offset-4 transition-transform [-webkit-touch-callout:none] group-hover/card:scale-[1.06] focus-visible:scale-[1.06]"
          >
            <div
              data-poster
              className="rounded-poster bg-seat relative aspect-[2/3] overflow-hidden shadow-[0_10px_30px_rgb(0_0_0/0.35)]"
            >
              <TmdbImage
                path={movie.poster_path}
                kind="poster"
                alt={`${movie.title} poster`}
                sizes={sizes}
                blurDataURL={movie.meta?.blur}
                priority={priority}
                fallbackTitle={movie.title}
              />
              {/* Glare following the pointer */}
              <span
                aria-hidden="true"
                className="duration-base pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity group-hover/card:opacity-100"
                style={{
                  background:
                    'radial-gradient(circle at var(--mx, 50%) var(--my, 30%), rgb(255 255 255 / 0.45), transparent 55%)',
                }}
              />
              {/* Lit edge: a hairline highlight so posters read as objects, not flat tiles */}
              <span
                aria-hidden="true"
                className="rounded-poster ring-reel/[0.07] duration-base group-hover/card:ring-reel/15 pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 transition-[box-shadow] ring-inset"
              />
              {isNew && (
                <span className="rounded-pill bg-amber text-void absolute top-2 left-2 px-2 py-0.5 text-[0.7rem] font-extrabold">
                  New
                </span>
              )}
              {progress !== undefined && (
                <span aria-hidden="true" className="bg-void/70 absolute inset-x-0 bottom-0 h-1">
                  <span
                    className="bg-violet block h-full origin-left"
                    style={{ transform: `scaleX(${Math.max(0.04, progress)})` }}
                  />
                </span>
              )}
            </div>
          </Link>
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                if (cardRef.current && !isReducedNow())
                  gsap.to(cardRef.current, {
                    opacity: 0,
                    scale: 0.9,
                    duration: DUR.fast,
                    onComplete: onRemove,
                  });
                else onRemove();
              }}
              aria-label={`Remove ${movie.title} from this row`}
              className="bg-void/80 text-reel duration-fast absolute top-2 right-2 z-10 grid size-9 place-items-center rounded-full opacity-0 backdrop-blur transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {/* Meta: hover-only on desktop, always on touch */}
        <div
          aria-hidden="true"
          className="duration-base ease-reel mt-2 flex items-start justify-between gap-2 transition-[opacity,translate] pointer-fine:translate-y-1 pointer-fine:opacity-0 pointer-fine:group-focus-within/card:translate-y-0 pointer-fine:group-focus-within/card:opacity-100 pointer-fine:group-hover/card:translate-y-0 pointer-fine:group-hover/card:opacity-100"
        >
          <div className="min-w-0">
            <p className="text-small truncate font-semibold">{movie.title}</p>
            <p className="text-dim text-[0.75rem]">{yearOf(movie.release_date)}</p>
          </div>
          {movie.vote_average > 0 && <RatingRing value={movie.vote_average} size={30} />}
        </div>
      </div>
    </div>
  );
}
