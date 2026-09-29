import { NextResponse, type NextRequest } from 'next/server';
import { tmdbFetch, REVALIDATE, type Params } from '@/lib/tmdb/client';
import { ALLOWED_PARAMS, isAllowedPath } from '@/lib/tmdb/allowlist';
import { isTmdbError } from '@/lib/tmdb/errors';
import { kidsParams, searchMulti } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { MovieDetailSchema, MovieListSchema, GenreListSchema } from '@/lib/tmdb/schemas';
import { PREFS_COOKIES } from '@/lib/rows';
import { KIDS_EXCLUDED_GENRES } from '@/lib/tmdb/genres';

const LIST_TO_DISCOVER: Record<string, string> = {
  'trending/movie/day': 'popularity.desc',
  'trending/movie/week': 'popularity.desc',
  'movie/popular': 'popularity.desc',
  'movie/top_rated': 'vote_average.desc',
  'movie/upcoming': 'primary_release_date.desc',
  'movie/now_playing': 'primary_release_date.desc',
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  let path = segments.join('/');
  if (!isAllowedPath(path)) return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const params: Params = {};
  for (const [k, v] of sp) if (ALLOWED_PARAMS.has(k)) params[k] = v.slice(0, 200);
  const wantMeta = sp.get('with_meta') === '1';
  const kids = req.cookies.get(PREFS_COOKIES.kids)?.value === '1';
  const region = req.cookies.get(PREFS_COOKIES.region)?.value ?? 'IN';
  const lang = req.cookies.get(PREFS_COOKIES.language)?.value;
  const language = lang && /^[a-z]{2}-[A-Z]{2}$/.test(lang) ? lang : 'en-US';

  if (kids && LIST_TO_DISCOVER[path]) {
    params.sort_by = LIST_TO_DISCOVER[path];
    path = 'discover/movie';
  }
  if (kids && path === 'discover/movie') Object.assign(params, kidsParams(region));

  try {
    let body: unknown;
    if (path === 'search/multi') {
      body = await searchMulti(String(params.query ?? ''), Number(params.page ?? 1), { language, kids });
    } else if (/^movie\/\d+$/.test(path)) {
      body = await tmdbFetch(`/${path}`, { append_to_response: 'videos,images', include_image_language: 'en,null' }, {
        schema: MovieDetailSchema, revalidate: REVALIDATE.details, language,
      });
    } else if (path === 'genre/movie/list') {
      body = await tmdbFetch(`/${path}`, {}, { schema: GenreListSchema, revalidate: REVALIDATE.genres, language });
    } else {
      const raw = await tmdbFetch(`/${path}`, params, { schema: MovieListSchema, revalidate: REVALIDATE.lists, language });
      // Defence in depth for kids profiles: every list response drops adult/excluded genres.
      const list = kids
        ? { ...raw, results: raw.results.filter((m) => !m.adult && !m.genre_ids.some((g) => (KIDS_EXCLUDED_GENRES as readonly number[]).includes(g))) }
        : raw;
      body = wantMeta ? { ...list, results: await withMeta(list.results) } : list;
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600', Vary: 'Cookie' },
    });
  } catch (err) {
    if (isTmdbError(err)) {
      const status = err.kind === 'not_found' ? 404 : err.kind === 'rate_limit' ? 429 : 502;
      return NextResponse.json({ error: err.message, kind: err.kind }, { status });
    }
    console.error('[api/tmdb]', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
