import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUrl, tmdbFetch, usingFixtures } from '@/lib/tmdb/client';
import { MovieListSchema, MovieDetailSchema, PersonSchema } from '@/lib/tmdb/schemas';
import { TmdbError, isTmdbError } from '@/lib/tmdb/errors';
import { discover, discoverParams, getMovie, getPerson, getTrending, kidsParams, searchMulti, getGenres, getTopRated, getUpcoming, getNowPlaying, getPopular, getRecommendations } from '@/lib/tmdb/endpoints';

const movie = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  title: `Movie ${id}`,
  overview: 'x',
  poster_path: `/p${id}.jpg`,
  backdrop_path: null,
  release_date: '2024-01-01',
  vote_average: 7.1,
  vote_count: 10,
  popularity: 50,
  genre_ids: [18],
  original_language: 'en',
  adult: false,
  ...extra,
});
const list = (items: unknown[]) => ({ page: 1, results: items, total_pages: 1, total_results: items.length });
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

describe('tmdb client', () => {
  beforeEach(() => {
    vi.stubEnv('TMDB_READ_TOKEN', 'test-token');
    vi.stubEnv('TMDB_FIXTURES', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('builds URLs with language and skips empty params', () => {
    const url = new URL(buildUrl('/discover/movie', { page: 2, with_genres: 28, region: undefined, x: '' }, 'hi-IN'));
    expect(url.pathname).toBe('/3/discover/movie');
    expect(url.searchParams.get('language')).toBe('hi-IN');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.has('region')).toBe(false);
    expect(url.searchParams.has('x')).toBe(false);
  });

  it('sends the bearer token and validates the response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(list([movie(1)])));
    const res = await tmdbFetch('/trending/movie/day', {}, { schema: MovieListSchema, fetchImpl });
    expect(res.results[0]?.title).toBe('Movie 1');
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
  });

  it('normalises TMDB nulls and empty strings', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(list([movie(2, { poster_path: '', release_date: '', overview: null })])));
    const res = await tmdbFetch('/movie/popular', {}, { schema: MovieListSchema, fetchImpl });
    expect(res.results[0]?.poster_path).toBeNull();
    expect(res.results[0]?.release_date).toBeNull();
    expect(res.results[0]?.overview).toBe('');
  });

  it('throws a typed validation error on invalid payloads', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ nope: true }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(tmdbFetch('/movie/popular', {}, { schema: MovieListSchema, fetchImpl })).rejects.toMatchObject({ kind: 'validation' });
  });

  it('maps HTTP errors to typed errors', async () => {
    await expect(tmdbFetch('/movie/1', {}, { schema: MovieDetailSchema, fetchImpl: vi.fn().mockResolvedValue(json({}, 404)) })).rejects.toMatchObject({ kind: 'not_found', status: 404 });
    await expect(tmdbFetch('/movie/1', {}, { schema: MovieDetailSchema, fetchImpl: vi.fn().mockResolvedValue(json({}, 500)) })).rejects.toMatchObject({ kind: 'http', status: 500 });
    await expect(tmdbFetch('/movie/1', {}, { schema: MovieDetailSchema, fetchImpl: vi.fn().mockRejectedValue(new Error('offline')) })).rejects.toMatchObject({ kind: 'network' });
  });

  it('retries once on 429 then succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json({}, 429, { 'retry-after': '0' })).mockResolvedValueOnce(json(list([movie(3)])));
    vi.useFakeTimers();
    const p = tmdbFetch('/movie/popular', {}, { schema: MovieListSchema, fetchImpl });
    await vi.runAllTimersAsync();
    const res = await p;
    vi.useRealTimers();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(res.results).toHaveLength(1);
  });

  it('surfaces rate limits after the retry', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({}, 429, { 'retry-after': '0' }));
    vi.useFakeTimers();
    const p = tmdbFetch('/movie/popular', {}, { schema: MovieListSchema, fetchImpl }).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    const err = await p;
    vi.useRealTimers();
    expect(isTmdbError(err) && err.kind).toBe('rate_limit');
  });

  it('errors with a config error when the token is missing and fixtures are off', async () => {
    vi.stubEnv('TMDB_READ_TOKEN', '');
    await expect(tmdbFetch('/movie/popular', {}, { schema: MovieListSchema, fetchImpl: vi.fn() })).rejects.toBeInstanceOf(TmdbError);
  });
});

describe('tmdb endpoints (mocked fetch)', () => {
  const calls: string[] = [];
  beforeEach(() => {
    calls.length = 0;
    vi.stubEnv('TMDB_READ_TOKEN', 'test-token');
    vi.stubEnv('TMDB_FIXTURES', '');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        const u = new URL(url);
        if (u.pathname.startsWith('/3/search/multi'))
          return json(list([{ ...movie(1), media_type: 'movie' }, { id: 9, name: 'Actor', profile_path: null, known_for_department: 'Acting', popularity: 1, media_type: 'person' }, { id: 5, name: 'Show', media_type: 'tv' }]));
        if (u.pathname === '/3/genre/movie/list') return json({ genres: [{ id: 28, name: 'Action' }] });
        if (/^\/3\/movie\/\d+$/.test(u.pathname)) return json({ ...movie(7), genres: [{ id: 18, name: 'Drama' }], runtime: 120, videos: { results: [] } });
        if (/^\/3\/person\/\d+$/.test(u.pathname)) return json({ id: 9, name: 'Actor', biography: null, profile_path: null, movie_credits: { cast: [movie(1)], crew: [] } });
        return json(list([movie(1), movie(2)]));
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('fetches every list endpoint', async () => {
    for (const fn of [() => getTrending('day'), () => getPopular(), () => getTopRated(), () => getUpcoming(), () => getNowPlaying(), () => getRecommendations(1)]) {
      expect((await fn()).results).toHaveLength(2);
    }
    expect(calls.some((c) => c.includes('/trending/movie/day'))).toBe(true);
    expect(calls.some((c) => c.includes('/movie/1/recommendations'))).toBe(true);
  });

  it('getMovie appends the detail sub-resources', async () => {
    const m = await getMovie(7);
    expect(m.runtime).toBe(120);
    const url = new URL(calls[0] as string);
    expect(url.searchParams.get('append_to_response')).toContain('watch/providers');
    expect(url.searchParams.get('include_image_language')).toBe('en,null');
  });

  it('searchMulti splits movies and people and drops TV', async () => {
    const r = await searchMulti('x');
    expect(r.movies).toHaveLength(1);
    expect(r.people).toHaveLength(1);
  });

  it('getPerson and getGenres parse', async () => {
    expect((await getPerson(9)).biography).toBe('');
    expect((await getGenres())[0]?.name).toBe('Action');
  });

  it('kids profiles route lists through discover with certification limits', async () => {
    await getTrending('day', 1, { kids: true });
    const url = new URL(calls[0] as string);
    expect(url.pathname).toBe('/3/discover/movie');
    expect(url.searchParams.get('certification.lte')).toBe('U/A');
    expect(url.searchParams.get('without_genres')).toContain('27');
  });

  it('discover maps filters and sort floors', async () => {
    await discover({ genre: 28, lang: 'hi', sort: 'vote_average.desc', yearFrom: 2000, yearTo: 2010 });
    const url = new URL(calls[0] as string);
    expect(url.searchParams.get('with_genres')).toBe('28');
    expect(url.searchParams.get('with_original_language')).toBe('hi');
    expect(url.searchParams.get('vote_count.gte')).toBe('300');
    expect(url.searchParams.get('primary_release_date.gte')).toBe('2000-01-01');
  });
});

describe('fixtures mode', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('falls back to offline fixtures without a token', async () => {
    vi.stubEnv('TMDB_READ_TOKEN', '');
    expect(usingFixtures()).toBe(true);
    const res = await getTrending('week');
    expect(res.results.length).toBeGreaterThan(0);
    const detail = await getMovie(res.results[0]!.id);
    expect(detail.credits.cast.length).toBeGreaterThan(0);
    expect((await getPerson(5001)).name).toBeTruthy();
    await expect(getMovie(1)).rejects.toMatchObject({ kind: 'not_found' });
  });

  it('fixture discover honours genre and language filters', async () => {
    vi.stubEnv('TMDB_FIXTURES', '1');
    const res = await discover({ lang: 'hi' });
    expect(res.results.every((m) => m.original_language === 'hi')).toBe(true);
  });
});

describe('discover params', () => {
  it('adds kids restrictions', () => {
    expect(discoverParams({ kids: true })).toMatchObject(kidsParams());
    expect(kidsParams('US')['certification.lte']).toBe('PG');
  });
  it('clamps newest to today', () => {
    expect(discoverParams({ sort: 'primary_release_date.desc' })['primary_release_date.lte']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('schemas', () => {
  it('person schema tolerates missing sub-resources', () => {
    const p = PersonSchema.parse({ id: 1, name: 'X' });
    expect(p.movie_credits.cast).toEqual([]);
    expect(p.images.profiles).toEqual([]);
  });
});
