import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('sharp', () => ({
  default: () => ({
    resize: () => ({ webp: () => ({ toBuffer: async () => Buffer.from('tiny') }) }),
  }),
}));
vi.mock('fast-average-color-node', () => ({ getAverageColor: async () => ({ hex: '#123456' }) }));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (k: string) =>
      ({ 'rh-lang': { value: 'hi-IN' }, 'rh-kids': { value: '1' }, 'rh-region': { value: 'US' } })[
        k
      ],
  }),
}));

import { getDominantColor, getPosterMeta, withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { TmdbError } from '@/lib/tmdb/errors';
import { getRequestPrefs } from '@/lib/prefs.server';
import { getHeroSlides } from '@/lib/hero';
import { qk } from '@/lib/tmdb/query-keys';
import { captureError } from '@/lib/monitoring';
import { SITE_NAME } from '@/lib/site';

describe('poster meta', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('computes colour + blur from the w92 poster and memoises per path', async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
    vi.stubGlobal('fetch', fetchMock);
    const meta = await getPosterMeta('/memo.jpg');
    expect(meta).toEqual({
      color: '#123456',
      blur: `data:image/webp;base64,${Buffer.from('tiny').toString('base64')}`,
    });
    await getPosterMeta('/memo.jpg');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await getDominantColor('/memo.jpg')).toBe('#123456');
  });

  it('falls back to a palette colour when the poster is missing or fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    );
    expect((await getPosterMeta('/broken.jpg')).blur).toBeNull();
    expect((await getPosterMeta(null)).color).toMatch(/^#/);
  });

  it('attaches meta to the first N movies only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array([1]))),
    );
    const movies = Array.from(
      { length: 5 },
      (_, i) => ({ id: i, poster_path: `/m${i}.jpg` }) as never,
    );
    const out = await withMeta(movies, 3, 2);
    expect(out.filter((m: { meta?: unknown }) => m.meta)).toHaveLength(3);
  });
});

describe('safe()', () => {
  it('wraps TMDB errors and rethrows others', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await safe(Promise.resolve(1))).toEqual({ data: 1, error: null });
    const r = await safe(Promise.reject(new TmdbError('http', 'down', 500)));
    expect(r.data).toBeNull();
    expect(r.error?.kind).toBe('http');
    expect((await safe(Promise.reject(new TmdbError('not_found', 'x', 404)))).error?.kind).toBe(
      'not_found',
    );
    await expect(safe(Promise.reject(new Error('bug')))).rejects.toThrow('bug');
  });
});

describe('request prefs', () => {
  it('reads language, kids and region cookies', async () => {
    expect(await getRequestPrefs()).toEqual({ language: 'hi-IN', kids: true, region: 'US' });
  });
});

describe('hero slides (fixtures)', () => {
  it('builds up to 5 slides even without artwork', async () => {
    vi.stubEnv('TMDB_READ_TOKEN', '');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array([1]))),
    );
    const slides = await getHeroSlides();
    expect(slides.length).toBeGreaterThan(0);
    expect(slides.length).toBeLessThanOrEqual(5);
    expect(slides[0]).toHaveProperty('runtime');
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});

describe('misc', () => {
  it('query keys are stable tuples', () => {
    expect(qk.movie(1)).toEqual(['movie', 1]);
    expect(qk.search('x')).toEqual(['search', 'x']);
    expect(qk.discover({ a: 1 })).toEqual(['discover', { a: 1 }]);
    expect(qk.row('r')[0]).toBe('row');
    expect(qk.watchlist('p')).toEqual(['watchlist', 'p']);
    expect(qk.history('p')[0]).toBe('history');
    expect(qk.ratings('p')[0]).toBe('ratings');
    expect(qk.rating('p', 1)).toEqual(['rating', 'p', 1]);
    expect(qk.siteReviews(1)[0]).toBe('site-reviews');
    expect(qk.siteAverage(1)[0]).toBe('site-average');
    expect(qk.profiles('u')[0]).toBe('profiles');
    expect(qk.recommendations('p')[0]).toBe('recommendations');
    expect(qk.searchPage('q', {})[0]).toBe('search-page');
  });
  it('monitoring logs with context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureError(new Error('x'), { a: 1 });
    expect(spy).toHaveBeenCalled();
    expect(SITE_NAME).toBe('Reelhouse');
  });
});
