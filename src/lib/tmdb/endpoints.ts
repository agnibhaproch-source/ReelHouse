import 'server-only';
import { REVALIDATE, tmdbFetch, type Params } from './client';
import { KIDS_EXCLUDED_GENRES } from './genres';
import {
  CollectionSchema,
  GenreListSchema,
  MovieDetailSchema,
  MovieListSchema,
  MovieSchema,
  MultiListSchema,
  PersonResultSchema,
  PersonSchema,
} from './schemas';
import type {
  Collection,
  DiscoverParams,
  Genre,
  Movie,
  MovieDetail,
  MultiResults,
  Paginated,
  Person,
  TrendingWindow,
} from './types';

export interface RequestPrefs {
  language?: string;
  kids?: boolean;
  region?: string;
}

/** Parameters that keep kids profiles safe on every discover-based call (spec 51). */
export function kidsParams(region = 'IN'): Params {
  return {
    include_adult: false,
    certification_country: region === 'US' ? 'US' : 'IN',
    'certification.lte': region === 'US' ? 'PG' : 'U/A',
    without_genres: KIDS_EXCLUDED_GENRES.join(','),
  };
}

export function discoverParams(p: DiscoverParams): Params {
  const params: Params = {
    sort_by: p.sort ?? 'popularity.desc',
    include_adult: false,
    include_video: false,
    page: p.page ?? 1,
    with_genres: p.genre,
    with_original_language: p.lang,
    primary_release_year: p.year,
    'primary_release_date.gte': p.yearFrom ? `${p.yearFrom}-01-01` : undefined,
    'primary_release_date.lte': p.yearTo ? `${p.yearTo}-12-31` : undefined,
    'vote_average.gte': p.ratingMin,
    'with_runtime.gte': p.runtimeMin,
    'with_runtime.lte': p.runtimeMax,
    region: p.region,
  };
  // Rating/title sorts are noisy without a vote floor.
  if (p.sort === 'vote_average.desc') params['vote_count.gte'] = 300;
  if (p.sort === 'primary_release_date.desc') {
    params['primary_release_date.lte'] ??= new Date().toISOString().slice(0, 10);
    params['vote_count.gte'] = 10;
  }
  if (p.sort === 'title.asc') params['vote_count.gte'] = 50;
  if (p.raw) Object.assign(params, p.raw);
  return p.kids ? { ...params, ...kidsParams(p.region) } : params;
}

const listOf = (path: string, params: Params, prefs: RequestPrefs, revalidate: number) =>
  tmdbFetch(path, params, {
    schema: MovieListSchema,
    revalidate,
    language: prefs.language,
  }) as Promise<Paginated<Movie>>;

export function discover(p: DiscoverParams, prefs: RequestPrefs = {}): Promise<Paginated<Movie>> {
  return listOf(
    '/discover/movie',
    discoverParams({ ...p, kids: p.kids ?? prefs.kids }),
    prefs,
    REVALIDATE.lists,
  );
}

export function getTrending(window: TrendingWindow = 'day', page = 1, prefs: RequestPrefs = {}) {
  if (prefs.kids) return discover({ sort: 'popularity.desc', page }, prefs);
  return listOf(`/trending/movie/${window}`, { page }, prefs, REVALIDATE.trending);
}

export function getPopular(page = 1, prefs: RequestPrefs = {}) {
  if (prefs.kids) return discover({ sort: 'popularity.desc', page: page + 1 }, prefs);
  return listOf('/movie/popular', { page, region: prefs.region }, prefs, REVALIDATE.lists);
}

export function getTopRated(page = 1, prefs: RequestPrefs = {}) {
  if (prefs.kids) return discover({ sort: 'vote_average.desc', page }, prefs);
  return listOf('/movie/top_rated', { page }, prefs, REVALIDATE.lists);
}

export function getUpcoming(page = 1, prefs: RequestPrefs = {}) {
  if (prefs.kids) return discover({ sort: 'primary_release_date.desc', page }, prefs);
  return listOf('/movie/upcoming', { page, region: prefs.region }, prefs, REVALIDATE.lists);
}

export function getNowPlaying(page = 1, prefs: RequestPrefs = {}) {
  if (prefs.kids) return discover({ sort: 'primary_release_date.desc', page }, prefs);
  return listOf('/movie/now_playing', { page, region: prefs.region }, prefs, REVALIDATE.lists);
}

export function getMovie(id: number, prefs: RequestPrefs = {}): Promise<MovieDetail> {
  return tmdbFetch(
    `/movie/${id}`,
    {
      append_to_response:
        'videos,credits,images,similar,recommendations,release_dates,watch/providers,reviews',
      include_image_language: 'en,null',
      include_video_language: 'en,null',
    },
    { schema: MovieDetailSchema, revalidate: REVALIDATE.details, language: prefs.language },
  );
}

/** The movie alone (no appended credits/images/…) — cheap enough to fetch a list of ids. */
export async function getMovieBasic(
  id: number,
  prefs: RequestPrefs = {},
): Promise<Movie & { runtime: number | null }> {
  const m = await tmdbFetch(
    `/movie/${id}`,
    {},
    { schema: MovieDetailSchema, revalidate: REVALIDATE.details, language: prefs.language },
  );
  return { ...m, genre_ids: m.genres.map((g) => g.id) };
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Theatrical/digital releases from today through the next ~4 months, soonest first. */
export function getComingSoon(page = 1, prefs: RequestPrefs = {}): Promise<Paginated<Movie>> {
  const today = new Date();
  const until = new Date(today.getTime() + 120 * 86_400_000);
  const params: Params = {
    sort_by: 'primary_release_date.asc',
    'primary_release_date.gte': isoDay(today),
    'primary_release_date.lte': isoDay(until),
    'popularity.gte': 4,
    with_release_type: '2|3|4',
    region: prefs.region,
    include_adult: false,
    page,
  };
  return listOf(
    '/discover/movie',
    prefs.kids ? { ...params, ...kidsParams(prefs.region) } : params,
    prefs,
    REVALIDATE.lists,
  );
}

export function getCollection(id: number, prefs: RequestPrefs = {}): Promise<Collection> {
  return tmdbFetch(
    `/collection/${id}`,
    {},
    { schema: CollectionSchema, revalidate: REVALIDATE.details, language: prefs.language },
  );
}

export function getRecommendations(id: number, prefs: RequestPrefs = {}) {
  return listOf(`/movie/${id}/recommendations`, { page: 1 }, prefs, REVALIDATE.details);
}

export async function getGenres(prefs: RequestPrefs = {}): Promise<Genre[]> {
  const res = await tmdbFetch(
    '/genre/movie/list',
    {},
    {
      schema: GenreListSchema,
      revalidate: REVALIDATE.genres,
      language: prefs.language,
    },
  );
  return res.genres;
}

export async function searchMulti(
  q: string,
  page = 1,
  prefs: RequestPrefs = {},
): Promise<MultiResults> {
  const res = await tmdbFetch(
    '/search/multi',
    { query: q, page, include_adult: false },
    { schema: MultiListSchema, revalidate: REVALIDATE.search, language: prefs.language },
  );
  const movies: Movie[] = [];
  const people: MultiResults['people'] = [];
  for (const item of res.results) {
    if (item.media_type === 'movie') {
      const m = MovieSchema.safeParse(item);
      if (
        m.success &&
        !(
          prefs.kids &&
          m.data.genre_ids.some((g) => (KIDS_EXCLUDED_GENRES as readonly number[]).includes(g))
        )
      )
        movies.push(m.data);
    } else if (item.media_type === 'person') {
      const p = PersonResultSchema.safeParse(item);
      if (p.success) people.push(p.data);
    }
  }
  return { page: res.page, total_pages: res.total_pages, movies, people };
}

export function getPerson(id: number, prefs: RequestPrefs = {}): Promise<Person> {
  return tmdbFetch(
    `/person/${id}`,
    { append_to_response: 'movie_credits,images' },
    { schema: PersonSchema, revalidate: REVALIDATE.details, language: prefs.language },
  );
}
