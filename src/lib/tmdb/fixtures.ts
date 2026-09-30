/**
 * Offline demo catalogue used when TMDB_READ_TOKEN is missing or TMDB_FIXTURES=1
 * (local demos, CI, Playwright). Real films (see fixture-catalogue.ts) with approximate
 * runtimes, ratings and dates, and no artwork, trailers, cast, reviews or availability —
 * those come from TMDB with a token. People are the films' directors.
 */
import type { Params } from './client';
import { genreById } from './genres';
import { CATALOGUE, CATALOGUE_COLLECTIONS, CATALOGUE_DIRECTORS } from './fixture-catalogue';
import { artPaths, STILLS_PER_FILM } from '@/lib/art/catalogue';

const pad = (n: number) => String(n).padStart(2, '0');

function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const MOVIES = CATALOGUE.map(([title, year, lang, genres, , , rating, overview], i) => ({
  id: 1001 + i,
  title,
  original_title: title,
  overview,
  poster_path: artPaths.poster(1001 + i),
  backdrop_path: artPaths.backdrop(1001 + i),
  // Approximate: the year is real, the day isn't (the demo banner says so).
  release_date: `${year}-${pad(1 + Math.floor(rand(i) * 12))}-${pad(1 + Math.floor(rand(i + 7) * 27))}`,
  vote_average: rating,
  vote_count: Math.floor(2000 + rand(i + 3) * 20000),
  // Newer films trend higher; list order breaks ties.
  popularity: Math.round((Math.max(0, year - 1950) * 12 + (90 - i) * 3) * 10) / 10,
  genre_ids: genres,
  original_language: lang,
  adult: false,
}));

const DIRECTORS = CATALOGUE_DIRECTORS;
const PEOPLE = DIRECTORS.map((name, i) => ({
  id: 5001 + i,
  name,
  profile_path: artPaths.profile(5001 + i),
  known_for_department: 'Directing',
  popularity: CATALOGUE.filter((r) => r[4] === name).length * 10 + (DIRECTORS.length - i),
}));
const directorOf = (movieIndex: number) =>
  PEOPLE.find((p) => p.name === CATALOGUE[movieIndex]?.[4]) ?? null;

function page<T>(items: T[], p: number, size = 20) {
  const total_pages = Math.max(1, Math.ceil(items.length / size));
  const pg = Math.min(Math.max(1, p), total_pages);
  return {
    page: pg,
    results: items.slice((pg - 1) * size, pg * size),
    total_pages,
    total_results: items.length,
  };
}

function rotate<T>(items: T[], by: number): T[] {
  const k = by % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

const COLLECTIONS = CATALOGUE_COLLECTIONS.map((c) => ({
  ...c,
  parts: c.titles.map((t) => MOVIES.find((m) => m.title === t)).filter((m) => m !== undefined),
}));

function collectionOf(id: number) {
  const c = COLLECTIONS.find((x) => x.parts.some((m) => m.id === id));
  const first = c?.parts[0];
  return c
    ? {
        id: c.id,
        name: c.name,
        poster_path: first?.poster_path ?? null,
        backdrop_path: first?.backdrop_path ?? null,
      }
    : null;
}

function collection(id: number) {
  const c = COLLECTIONS.find((x) => x.id === id);
  if (!c) return null;
  const first = c.parts[0];
  return {
    id: c.id,
    name: c.name,
    overview: '',
    poster_path: first?.poster_path ?? null,
    backdrop_path: first?.backdrop_path ?? null,
    parts: c.parts,
  };
}

/** Recommendations: films sharing the most genres (then the same language), best rated first. */
function similarTo(base: (typeof MOVIES)[number]) {
  return MOVIES.filter((m) => m.id !== base.id)
    .map((m) => ({
      m,
      score:
        m.genre_ids.filter((g) => base.genre_ids.includes(g)).length * 2 +
        (m.original_language === base.original_language ? 1 : 0) +
        m.vote_average / 10,
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

function detail(id: number) {
  const i = id - 1001;
  const base = MOVIES[i];
  const row = CATALOGUE[i];
  if (!base || !row) return null;
  const director = directorOf(i);
  const similar = similarTo(base);
  return {
    ...base,
    genres: base.genre_ids.map((gid) => ({ id: gid, name: genreById(gid)?.name ?? 'Drama' })),
    runtime: row[5],
    tagline: null,
    status: 'Released',
    budget: 0,
    revenue: 0,
    imdb_id: null,
    homepage: null,
    spoken_languages: [],
    production_companies: [],
    videos: { results: [] },
    credits: {
      cast: [],
      crew: director
        ? [
            {
              id: director.id,
              name: director.name,
              job: 'Director',
              department: 'Directing',
              profile_path: null,
            },
          ]
        : [],
    },
    images: {
      backdrops: Array.from({ length: STILLS_PER_FILM }, (_, n) => ({
        file_path: artPaths.still(id, n + 1),
        width: 1280,
        height: 720,
        aspect_ratio: 16 / 9,
        iso_639_1: null,
        vote_average: 0,
        vote_count: 0,
      })),
      posters: [],
      logos: [],
    },
    similar: page(similar.slice(12), 1),
    recommendations: page(similar.slice(0, 12), 1),
    release_dates: { results: [] },
    'watch/providers': { results: {} },
    belongs_to_collection: collectionOf(id),
    reviews: { page: 1, total_pages: 1, total_results: 0, results: [] },
  };
}

function personDetail(id: number) {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) return null;
  const films = MOVIES.filter((_, i) => CATALOGUE[i]?.[4] === p.name);
  const credits = films.map((m) => ({ ...m, job: 'Director', credit_id: `pd${id}-${m.id}` }));
  return {
    ...p,
    biography: '',
    birthday: null,
    deathday: null,
    place_of_birth: null,
    imdb_id: null,
    movie_credits: { cast: [], crew: credits },
    images: { profiles: [] },
  };
}

function discover(params: Params) {
  let items = [...MOVIES];
  const genres = String(params.with_genres ?? '')
    .split(/[,|]/)
    .filter(Boolean)
    .map(Number);
  if (genres.length) items = items.filter((m) => genres.some((g) => m.genre_ids.includes(g)));
  const langs = String(params.with_original_language ?? '')
    .split('|')
    .filter(Boolean);
  if (langs.length) items = items.filter((m) => langs.includes(m.original_language));
  const without = String(params.without_genres ?? '')
    .split(/[,|]/)
    .filter(Boolean)
    .map(Number);
  if (without.length) items = items.filter((m) => !m.genre_ids.some((g) => without.includes(g)));
  const min = Number(params['vote_average.gte'] ?? 0);
  if (min) items = items.filter((m) => m.vote_average >= min);
  const from = params['primary_release_date.gte'];
  const to = params['primary_release_date.lte'];
  if (from) items = items.filter((m) => m.release_date >= String(from));
  if (to) items = items.filter((m) => m.release_date <= String(to));
  const sort = String(params.sort_by ?? 'popularity.desc');
  items.sort((a, b) => {
    if (sort.startsWith('vote_average')) return b.vote_average - a.vote_average;
    if (sort === 'primary_release_date.asc') return a.release_date.localeCompare(b.release_date);
    if (sort.startsWith('primary_release_date'))
      return b.release_date.localeCompare(a.release_date);
    if (sort.startsWith('title')) return a.title.localeCompare(b.title);
    return b.popularity - a.popularity;
  });
  return page(items, Number(params.page ?? 1));
}

export function fixtureResponse(path: string, params: Params): unknown {
  const p = Number(params.page ?? 1);
  let m: RegExpExecArray | null;

  if ((m = /^\/trending\/movie\/(day|week)$/.exec(path)))
    return page(rotate(MOVIES, m[1] === 'day' ? 0 : 5), p);
  if (path === '/movie/popular') return page(rotate(MOVIES, 10), p);
  if (path === '/movie/top_rated')
    return page(
      [...MOVIES].sort((a, b) => b.vote_average - a.vote_average),
      p,
    );
  // No real release schedule offline: "upcoming" is empty in demo mode.
  if (path === '/movie/upcoming') return page([], p);
  if (path === '/movie/now_playing')
    return page(
      [...MOVIES].sort((a, b) => b.release_date.localeCompare(a.release_date)).slice(0, 20),
      p,
    );
  if (path === '/genre/movie/list')
    return {
      genres: [...new Set(MOVIES.flatMap((m) => m.genre_ids))].map((id) => ({
        id,
        name: genreById(id)?.name ?? 'Drama',
      })),
    };
  if (path === '/discover/movie') return discover(params);
  if (path === '/search/multi' || path === '/search/movie') {
    const q = String(params.query ?? '')
      .toLowerCase()
      .trim();
    const movies = MOVIES.filter((x) => x.title.toLowerCase().includes(q)).map((x) => ({
      ...x,
      media_type: 'movie',
    }));
    const people =
      path === '/search/multi'
        ? PEOPLE.filter((x) => x.name.toLowerCase().includes(q)).map((x) => ({
            ...x,
            media_type: 'person',
          }))
        : [];
    return page([...movies, ...people], p);
  }
  if ((m = /^\/movie\/(\d+)\/(recommendations|similar)$/.exec(path))) {
    const d = detail(Number(m[1]));
    return d ? (m[2] === 'similar' ? d.similar : d.recommendations) : null;
  }
  if ((m = /^\/movie\/(\d+)$/.exec(path))) return detail(Number(m[1]));
  if ((m = /^\/person\/(\d+)$/.exec(path))) return personDetail(Number(m[1]));
  if ((m = /^\/collection\/(\d+)$/.exec(path))) return collection(Number(m[1]));
  if ((m = /^\/person\/(\d+)\/movie_credits$/.exec(path)))
    return personDetail(Number(m[1]))?.movie_credits ?? null;
  return null;
}

export const FIXTURE_MOVIE_IDS = MOVIES.map((m) => m.id);
