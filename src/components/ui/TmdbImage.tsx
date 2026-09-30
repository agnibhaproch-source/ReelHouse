'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { encodeSrc, tmdbLoader, type ImageKind } from '@/lib/tmdb/images';
import { fallbackGlow } from '@/lib/tmdb/color';

interface TmdbImageProps {
  path: string | null | undefined;
  kind: ImageKind;
  alt: string;
  sizes: string;
  /** Title shown on the designed fallback. */
  fallbackTitle?: string;
  /** Full-bleed decorative image: the fallback is a plain surface with no icon or title. */
  plain?: boolean;
  blurDataURL?: string | null;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

/**
 * TMDB image through `next/image` + custom loader (nearest TMDB size), blur placeholder,
 * fade + unblur on load, and a designed film-frame fallback instead of a broken icon (spec 39).
 */
export function TmdbImage({
  path,
  kind,
  alt,
  sizes,
  fallbackTitle,
  plain,
  blurDataURL,
  priority,
  fill = true,
  width,
  height,
  className,
  imgClassName,
  loading,
  style,
}: TmdbImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  if (!path || state === 'error') {
    const frame = cn(fill && 'absolute inset-0', className);
    // Missing poster: a designed title card (seeded colour, title in the display face) rather
    // than an empty tile — common for regional and older films on TMDB.
    if (!plain && kind === 'poster' && fallbackTitle) {
      const glow = fallbackGlow(fallbackTitle);
      return (
        <div
          className={cn('bg-seat @container relative overflow-hidden', frame)}
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          style={style}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(130% 75% at 20% 0%, color-mix(in oklab, ${glow} 55%, transparent), transparent 62%), radial-gradient(90% 60% at 100% 100%, color-mix(in oklab, ${glow} 22%, transparent), transparent 70%)`,
            }}
          />
          <span aria-hidden="true" className="sprockets absolute inset-x-0 top-0 opacity-50" />
          <span aria-hidden="true" className="sprockets absolute inset-x-0 bottom-0 opacity-50" />
          <span
            aria-hidden="true"
            className="absolute inset-x-[9cqw] top-[12cqw] h-px"
            style={{ background: `color-mix(in oklab, ${glow} 70%, transparent)` }}
          />
          <span
            aria-hidden="true"
            className="font-display text-reel absolute inset-x-[9cqw] bottom-[14cqw] line-clamp-4 text-[clamp(0.85rem,13cqw,2.4rem)] leading-[0.95] font-semibold [text-wrap:balance] [font-variation-settings:'SOFT'_60]"
          >
            {fallbackTitle}
          </span>
        </div>
      );
    }
    // Missing portrait: initials on the person's seeded colour.
    if (!plain && kind === 'profile' && fallbackTitle) {
      const glow = fallbackGlow(fallbackTitle);
      const initials = fallbackTitle
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('');
      return (
        <div
          className={cn(
            'bg-seat @container relative grid place-items-center overflow-hidden',
            frame,
          )}
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          style={{
            ...style,
            background: `radial-gradient(circle at 30% 20%, color-mix(in oklab, ${glow} 45%, var(--bg-seat)), var(--bg-seat) 75%)`,
          }}
        >
          <span
            aria-hidden="true"
            className="font-display text-reel text-[clamp(1rem,36cqw,3rem)] leading-none font-semibold"
          >
            {initials}
          </span>
        </div>
      );
    }
    return (
      <div
        className={cn(
          'bg-seat text-dim flex flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center',
          frame,
        )}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        style={style}
      >
        {!plain && (
          <>
            <span aria-hidden="true" className="sprockets absolute inset-x-0 top-0 opacity-60" />
            <Film className="size-7 opacity-70" aria-hidden="true" />
            <span aria-hidden="true" className="sprockets absolute inset-x-0 bottom-0 opacity-60" />
          </>
        )}
      </div>
    );
  }

  return (
    <Image
      loader={tmdbLoader}
      src={encodeSrc(kind, path)}
      alt={alt}
      sizes={sizes}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      preload={priority}
      fetchPriority={priority ? 'high' : undefined}
      loading={priority ? undefined : (loading ?? 'lazy')}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      blurDataURL={blurDataURL ?? undefined}
      data-loaded={state === 'loaded'}
      onLoad={() => setState('loaded')}
      onError={() => setState('error')}
      className={cn('img-unblur object-cover', className, imgClassName)}
      style={style}
      draggable={false}
    />
  );
}
