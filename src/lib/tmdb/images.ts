import type { ImageLoaderProps } from 'next/image';
import type { TmdbImage } from './types';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

export type ImageKind = 'poster' | 'backdrop' | 'logo' | 'profile' | 'still';

/** Sizes TMDB serves per image type (from /configuration). */
export const TMDB_SIZES: Record<ImageKind, readonly string[]> = {
  poster: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
  backdrop: ['w300', 'w780', 'w1280', 'original'],
  logo: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
  profile: ['w45', 'w185', 'h632', 'original'],
  still: ['w92', 'w185', 'w300', 'original'],
};

/** Named sizes used across the app (spec 11). */
export const IMAGE_SIZE = {
  card: 'w342',
  detailPoster: 'w500',
  retinaPoster: 'w780',
  backdrop: 'w1280',
  hero: 'original',
  logo: 'w500',
  profile: 'w185',
  blur: 'w92',
} as const;

export function tmdbImage(path: string | null | undefined, size: string): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Nearest TMDB size ≥ requested width (falls back to `original`). */
export function nearestSize(kind: ImageKind, width: number): string {
  const sizes = TMDB_SIZES[kind];
  for (const s of sizes) {
    if (s === 'original') return s;
    const px = Number.parseInt(s.slice(1), 10);
    // h632 profiles are ~421px wide
    const effective = s.startsWith('h') ? Math.round(px * (2 / 3)) : px;
    if (effective >= width) return s;
  }
  return 'original';
}

/**
 * `next/image` loader. `src` is encoded as `kind:/path.jpg` so the loader can pick
 * a size valid for that image type.
 */
export function tmdbLoader({ src, width }: ImageLoaderProps): string {
  const match = /^(poster|backdrop|logo|profile|still):(\/.+)$/.exec(src);
  if (!match) return src;
  const kind = match[1] as ImageKind;
  const path = match[2] as string;
  return `${TMDB_IMAGE_BASE}${nearestSize(kind, width)}${path}`;
}

export const encodeSrc = (kind: ImageKind, path: string): string => `${kind}:${path}`;

/** Prefer English, then language-neutral; highest vote; PNG (transparent) over others. */
export function getBestLogo(images: { logos?: TmdbImage[] } | null | undefined): TmdbImage | null {
  const logos = images?.logos ?? [];
  if (!logos.length) return null;
  const score = (l: TmdbImage): number =>
    (l.iso_639_1 === 'en' ? 1000 : l.iso_639_1 === null ? 500 : 0) +
    (l.file_path.endsWith('.png') ? 100 : 0) +
    l.vote_average * 5 +
    Math.min(l.vote_count, 20);
  return [...logos].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** Common `sizes` strings. */
export const SIZES = {
  card: '(max-width: 480px) 42vw, (max-width: 768px) 30vw, (max-width: 1280px) 18vw, 220px',
  gridCard: '(max-width: 480px) 45vw, (max-width: 1024px) 25vw, 200px',
  hero: '100vw',
  detailPoster: '(max-width: 768px) 50vw, 320px',
  backdropThumb: '(max-width: 768px) 80vw, 480px',
  profile: '120px',
  logo: '(max-width: 768px) 70vw, 480px',
} as const;
