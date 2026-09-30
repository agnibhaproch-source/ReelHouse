/** URL ⇄ filter state for browse, language and search pages (spec 26: filters live in the URL). */

export const SORTS = [
  { id: 'popular', label: 'Popular', tmdb: 'popularity.desc' },
  { id: 'top', label: 'Top rated', tmdb: 'vote_average.desc' },
  { id: 'new', label: 'Newest', tmdb: 'primary_release_date.desc' },
  { id: 'az', label: 'A–Z', tmdb: 'title.asc' },
] as const;

export type SortId = (typeof SORTS)[number]['id'];

export const YEAR_MIN = 1950;
export const YEAR_MAX = new Date().getFullYear() + 1;
export const RUNTIME_MAX = 240;

export interface Filters {
  sort: SortId;
  from: number;
  to: number;
  rating: number;
  runtimeMin: number;
  runtimeMax: number;
  lang: string | null;
  genre: number | null;
}

export const DEFAULT_FILTERS: Filters = {
  sort: 'popular',
  from: YEAR_MIN,
  to: YEAR_MAX,
  rating: 0,
  runtimeMin: 0,
  runtimeMax: RUNTIME_MAX,
  lang: null,
  genre: null,
};

const num = (v: string | null, fallback: number, min: number, max: number) => {
  const n = v === null ? Number.NaN : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function parseFilters(sp: URLSearchParams): Filters {
  const sort = SORTS.find((s) => s.id === sp.get('sort'))?.id ?? DEFAULT_FILTERS.sort;
  const lang = sp.get('lang');
  const genre = sp.get('genre');
  return {
    sort,
    from: num(sp.get('from'), YEAR_MIN, YEAR_MIN, YEAR_MAX),
    to: num(sp.get('to'), YEAR_MAX, YEAR_MIN, YEAR_MAX),
    rating: num(sp.get('rating'), 0, 0, 9),
    runtimeMin: num(sp.get('rmin'), 0, 0, RUNTIME_MAX),
    runtimeMax: num(sp.get('rmax'), RUNTIME_MAX, 0, RUNTIME_MAX),
    lang: lang && /^[a-z]{2}$/.test(lang) ? lang : null,
    genre: genre && /^\d+$/.test(genre) ? Number(genre) : null,
  };
}

export function filtersToSearch(f: Filters, base?: URLSearchParams): URLSearchParams {
  const sp = new URLSearchParams(base);
  const set = (k: string, v: string | number | null, def: string | number | null) =>
    v === def || v === null ? sp.delete(k) : sp.set(k, String(v));
  set('sort', f.sort, DEFAULT_FILTERS.sort);
  set('from', f.from, YEAR_MIN);
  set('to', f.to, YEAR_MAX);
  set('rating', f.rating, 0);
  set('rmin', f.runtimeMin, 0);
  set('rmax', f.runtimeMax, RUNTIME_MAX);
  set('lang', f.lang, null);
  set('genre', f.genre, null);
  return sp;
}

export interface FixedDiscover {
  genre?: number;
  lang?: string;
  /** Raw TMDB params (a mood's query); the viewer's own filters override them. */
  extra?: Readonly<Record<string, string>>;
}

/** TMDB discover params for the proxy. */
export function discoverQuery(f: Filters, fixed: FixedDiscover, page: number): URLSearchParams {
  const sort = SORTS.find((s) => s.id === f.sort)?.tmdb ?? 'popularity.desc';
  const q = new URLSearchParams({ ...fixed.extra, sort_by: sort, page: String(page) });
  const genre = fixed.genre ?? f.genre;
  const lang = fixed.lang ?? f.lang;
  if (genre) q.set('with_genres', String(genre));
  if (lang) q.set('with_original_language', lang);
  if (f.from > YEAR_MIN) q.set('primary_release_date.gte', `${f.from}-01-01`);
  if (f.to < YEAR_MAX) q.set('primary_release_date.lte', `${f.to}-12-31`);
  else if (f.sort === 'new')
    q.set('primary_release_date.lte', new Date().toISOString().slice(0, 10));
  if (f.rating > 0) q.set('vote_average.gte', String(f.rating));
  if (f.sort === 'top') q.set('vote_count.gte', '300');
  else if (f.sort === 'az') q.set('vote_count.gte', '50');
  else if (f.sort === 'new') q.set('vote_count.gte', '5');
  if (f.runtimeMin > 0) q.set('with_runtime.gte', String(f.runtimeMin));
  if (f.runtimeMax < RUNTIME_MAX) q.set('with_runtime.lte', String(f.runtimeMax));
  return q;
}

export function activeFilterCount(f: Filters): number {
  return [
    f.from > YEAR_MIN || f.to < YEAR_MAX,
    f.rating > 0,
    f.runtimeMin > 0 || f.runtimeMax < RUNTIME_MAX,
    f.lang !== null,
    f.genre !== null,
  ].filter(Boolean).length;
}
