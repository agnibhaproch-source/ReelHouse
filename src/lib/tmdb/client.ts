import 'server-only';
import type { z } from 'zod';
import { TmdbError } from './errors';
import { fixtureResponse } from './fixtures';

const API_BASE = 'https://api.themoviedb.org/3';

/** Cache lifetimes in seconds (spec 11). */
export const REVALIDATE = {
  trending: 60 * 60,
  lists: 60 * 60,
  details: 60 * 60 * 24,
  genres: 60 * 60 * 24 * 7,
  search: 60 * 10,
} as const;

export type Params = Record<string, string | number | boolean | undefined | null>;

export interface FetchOptions<S extends z.ZodType> {
  schema: S;
  revalidate?: number;
  language?: string;
  /** Injected in tests. */
  fetchImpl?: typeof fetch;
}

/**
 * True when serving the built-in catalogue (the default). Live TMDB is opt-in: it needs
 * DATA_SOURCE=tmdb *and* TMDB_READ_TOKEN; TMDB_FIXTURES=1 forces the catalogue (tests).
 */
export function usingFixtures(): boolean {
  return (
    process.env.TMDB_FIXTURES === '1' ||
    process.env.DATA_SOURCE !== 'tmdb' ||
    !process.env.TMDB_READ_TOKEN
  );
}

export function buildUrl(path: string, params: Params, language: string): string {
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  url.searchParams.set('language', language);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function tmdbFetch<S extends z.ZodType>(
  path: string,
  params: Params,
  { schema, revalidate = REVALIDATE.lists, language = 'en-US', fetchImpl }: FetchOptions<S>,
): Promise<z.output<S>> {
  let raw: unknown;

  if (usingFixtures() && !fetchImpl) {
    raw = fixtureResponse(path, params);
    if (raw === null) throw new TmdbError('not_found', `Not found: ${path}`, 404, path);
  } else {
    const token = process.env.TMDB_READ_TOKEN;
    if (!token) throw new TmdbError('config', 'TMDB_READ_TOKEN is not set', undefined, path);
    const doFetch = fetchImpl ?? fetch;
    const url = buildUrl(path, params, language);
    const init: RequestInit & { next?: { revalidate: number; tags?: string[] } } = {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      next: { revalidate, tags: ['tmdb', `tmdb:${path}`] },
    };

    let res: Response | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await doFetch(url, init);
      } catch (err) {
        throw new TmdbError(
          'network',
          `Network error for ${path}: ${(err as Error).message}`,
          undefined,
          path,
        );
      }
      if (res.status !== 429 || attempt === 1) break;
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000);
    }
    if (!res) throw new TmdbError('network', `No response for ${path}`, undefined, path);
    if (res.status === 404) throw new TmdbError('not_found', `Not found: ${path}`, 404, path);
    if (res.status === 429)
      throw new TmdbError('rate_limit', 'TMDB rate limit exceeded', 429, path);
    if (!res.ok) throw new TmdbError('http', `TMDB ${res.status} for ${path}`, res.status, path);
    raw = await res.json();
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error('[tmdb] validation failed', path, parsed.error.issues.slice(0, 5));
    throw new TmdbError('validation', `Invalid TMDB response for ${path}`, undefined, path);
  }
  return parsed.data;
}
