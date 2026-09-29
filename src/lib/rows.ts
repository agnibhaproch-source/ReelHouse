import { GENRES, HOME_GENRE_ROWS } from './tmdb/genres';
import { HOME_LANGUAGE_ROWS, getLanguage } from './tmdb/languages';

export interface RowSource {
  /** TMDB path without leading slash; must be in the proxy allowlist. */
  path: string;
  params?: Record<string, string | number>;
}

export interface RowDescriptor {
  key: string;
  title: string;
  href?: string;
  source: RowSource;
  ranked?: boolean;
}

export const PREFS_COOKIES = { language: 'rh-lang', kids: 'rh-kids', region: 'rh-region' } as const;

export function homeRows(): RowDescriptor[] {
  const rows: RowDescriptor[] = [
    { key: 'trending', title: 'Trending now', source: { path: 'trending/movie/week' } },
    { key: 'top10', title: 'Top 10 today', source: { path: 'trending/movie/day' }, ranked: true },
    {
      key: 'popular-in',
      title: 'Popular in India',
      href: '/language/hi',
      source: {
        path: 'discover/movie',
        params: {
          region: 'IN',
          with_original_language: 'hi|ta|te|ml|kn',
          sort_by: 'popularity.desc',
        },
      },
    },
    { key: 'new', title: 'New releases', source: { path: 'movie/now_playing' } },
    { key: 'top-rated', title: 'Top rated', source: { path: 'movie/top_rated' } },
  ];
  for (const code of HOME_LANGUAGE_ROWS) {
    const lang = getLanguage(code);
    if (!lang) continue;
    rows.push({
      key: `lang-${code}`,
      title: `${lang.name} cinema`,
      href: `/language/${code}`,
      source: {
        path: 'discover/movie',
        params: { with_original_language: code, sort_by: 'popularity.desc' },
      },
    });
  }
  for (const slug of HOME_GENRE_ROWS) {
    const g = GENRES.find((x) => x.slug === slug);
    if (!g) continue;
    rows.push({
      key: `genre-${slug}`,
      title: g.name,
      href: `/browse/${slug}`,
      source: { path: 'discover/movie', params: { with_genres: g.id, sort_by: 'popularity.desc' } },
    });
  }
  return rows;
}

export function rowUrl(source: RowSource, page = 1): string {
  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(source.params ?? {}).map(([k, v]) => [k, String(v)])),
    page: String(page),
    with_meta: '1',
  });
  return `/api/tmdb/${source.path}?${qs.toString()}`;
}
