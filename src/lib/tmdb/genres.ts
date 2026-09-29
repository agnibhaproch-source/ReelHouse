import { slugify } from '../utils';

export interface GenreConfig {
  id: number;
  name: string;
  slug: string;
}

/** TMDB movie genre ids are stable; kept static so routes and menus don't need a fetch. */
const RAW: ReadonlyArray<[number, string]> = [
  [28, 'Action'],
  [12, 'Adventure'],
  [16, 'Animation'],
  [35, 'Comedy'],
  [80, 'Crime'],
  [99, 'Documentary'],
  [18, 'Drama'],
  [10751, 'Family'],
  [14, 'Fantasy'],
  [36, 'History'],
  [27, 'Horror'],
  [10402, 'Music'],
  [9648, 'Mystery'],
  [10749, 'Romance'],
  [878, 'Science Fiction'],
  [10770, 'TV Movie'],
  [53, 'Thriller'],
  [10752, 'War'],
  [37, 'Western'],
];

export const GENRES: readonly GenreConfig[] = RAW.map(([id, name]) => ({
  id,
  name: name === 'Science Fiction' ? 'Sci-fi' : name,
  slug: name === 'Science Fiction' ? 'sci-fi' : slugify(name),
}));

export const HOME_GENRE_ROWS = ['action', 'comedy', 'horror', 'sci-fi', 'romance', 'animation', 'thriller'] as const;

/** Genres excluded for kids profiles. */
export const KIDS_EXCLUDED_GENRES = [27, 53, 80, 10752] as const;

export function genreBySlug(slug: string): GenreConfig | undefined {
  return GENRES.find((g) => g.slug === slug);
}

export function genreById(id: number): GenreConfig | undefined {
  return GENRES.find((g) => g.id === id);
}

export function genreNames(ids: readonly number[], max = 3): string[] {
  return ids
    .map((id) => genreById(id)?.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, max);
}
