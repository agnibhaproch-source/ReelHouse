'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { encodeSrc, tmdbLoader, type ImageKind } from '@/lib/tmdb/images';

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
    return (
      <div
        className={cn(
          'bg-seat text-dim flex flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center',
          fill && 'absolute inset-0',
          className,
        )}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        style={style}
      >
        {!plain && (
          <>
            <span aria-hidden="true" className="sprockets absolute inset-x-0 top-0 opacity-60" />
            <Film className="size-7 opacity-70" aria-hidden="true" />
            {fallbackTitle && kind === 'poster' && (
              <span
                aria-hidden="true"
                className="font-display text-small text-reel/80 line-clamp-3 leading-tight"
              >
                {fallbackTitle}
              </span>
            )}
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
