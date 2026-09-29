/**
 * Offline demo catalogue used when TMDB_READ_TOKEN is missing or TMDB_FIXTURES=1
 * (local demos, CI, Playwright). All titles and people are invented; there are no image
 * paths or video keys, so the UI's designed fallbacks render instead of real artwork.
 */
import type { Params } from './client';
import { genreById } from './genres';

const A = [
  'Last',
  'Silent',
  'Neon',
  'Midnight',
  'Paper',
  'Velvet',
  'Hollow',
  'Golden',
  'Crimson',
  'Distant',
];
const B = [
  'Projectionist',
  'Matinee',
  'Harbor',
  'Monsoon',
  'Signal',
  'Orchard',
  'Frontier',
  'Lantern',
  'Echo',
  'Reel',
];
const LANGS = ['en', 'hi', 'ta', 'te', 'ml', 'ko', 'ja', 'kn', 'es', 'fr', 'bn', 'mr'];
const GENRE_POOL = [28, 12, 16, 35, 80, 18, 14, 27, 9648, 10749, 878, 53, 10751, 99];
const FIRST = [
  'Asha',
  'Min-jun',
  'Kenji',
  'Lucía',
  'Arjun',
  'Priya',
  'Élodie',
  'Tomás',
  'Meera',
  'Soo-ah',
];
const LAST = ['Varma', 'Park', 'Sato', 'Moreau', 'Iyer', 'Kapoor', 'Reyes', 'Nair', 'Kim', 'Duval'];

const MOVIE_COUNT = 90;
const PERSON_COUNT = 40;

function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const pad = (n: number) => String(n).padStart(2, '0');

function isoDaysAgo(days: number): string {
  const d = new Date(Date.UTC(2026, 8, 1) - days * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function movie(i: number) {
  const id = 1001 + i;
  const title = `The ${A[i % A.length]} ${B[Math.floor(i / A.length) % B.length]}`;
  const g1 = GENRE_POOL[i % GENRE_POOL.length] as number;
  const g2 = GENRE_POOL[(i * 7 + 3) % GENRE_POOL.length] as number;
  const days = i < 8 ? i * 3 : Math.floor(rand(i) * 9000);
  return {
    id,
    title,
    original_title: title,
    overview: `A demo synopsis for ${title}. When the last reel goes missing, a small-town projectionist follows a trail of torn frames across three cities — and discovers the film was never meant to be finished.`,
    poster_path: null,
    backdrop_path: null,
    release_date: isoDaysAgo(days),
    vote_average: Math.round((5.2 + rand(i + 11) * 3.6) * 10) / 10,
    vote_count: Math.floor(200 + rand(i + 3) * 9000),
    popularity: Math.round((1000 - i * 9 + rand(i) * 40) * 10) / 10,
    genre_ids: g1 === g2 ? [g1] : [g1, g2],
    original_language: LANGS[i % LANGS.length] as string,
    adult: false,
  };
}

const MOVIES = Array.from({ length: MOVIE_COUNT }, (_, i) => movie(i));

function person(i: number) {
  return {
    id: 5001 + i,
    name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
    profile_path: null,
    known_for_department: i % 5 === 0 ? 'Directing' : 'Acting',
    popularity: 100 - i,
  };
}

const PEOPLE = Array.from({ length: PERSON_COUNT }, (_, i) => person(i));

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

function detail(id: number) {
  const base = MOVIES.find((m) => m.id === id);
  if (!base) return null;
  const i = id - 1001;
  const cast = Array.from({ length: 10 }, (_, k) => {
    const p = PEOPLE[(i + k) % PEOPLE.length]!;
    return {
      id: p.id,
      name: p.name,
      character: `Role ${k + 1}`,
      profile_path: null,
      order: k,
      credit_id: `c${id}-${k}`,
    };
  });
  const director = PEOPLE[(i * 3) % PEOPLE.length]!;
  const rec = rotate(MOVIES, i + 1).slice(0, 12);
  return {
    ...base,
    genres: base.genre_ids.map((gid) => ({ id: gid, name: genreById(gid)?.name ?? 'Drama' })),
    runtime: 92 + (i % 60),
    tagline: 'Every frame remembers.',
    status: 'Released',
    budget: 1_000_000 * (5 + (i % 40)),
    revenue: 1_000_000 * (12 + (i % 90)),
    imdb_id: null,
    homepage: null,
    spoken_languages: [
      { english_name: 'English', iso_639_1: base.original_language, name: 'English' },
    ],
    production_companies: [],
    videos: { results: [] },
    credits: {
      cast,
      crew: [
        {
          id: director.id,
          name: director.name,
          job: 'Director',
          department: 'Directing',
          profile_path: null,
        },
        {
          id: director.id + 1,
          name: PEOPLE[(i * 3 + 1) % PEOPLE.length]!.name,
          job: 'Screenplay',
          department: 'Writing',
          profile_path: null,
        },
      ],
    },
    images: { backdrops: [], posters: [], logos: [] },
    similar: page(rotate(MOVIES, i + 20), 1),
    recommendations: page(rec, 1),
    release_dates: {
      results: [
        {
          iso_3166_1: 'IN',
          release_dates: [
            { certification: 'U/A', release_date: `${base.release_date}T00:00:00.000Z`, type: 3 },
          ],
        },
      ],
    },
    'watch/providers': { results: {} },
    reviews: {
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [
        {
          id: `r${id}`,
          author: 'demo_critic',
          content:
            'A demo review. The pacing is patient, the score is gorgeous, and the final reel lands.',
          created_at: '2026-01-10T10:00:00.000Z',
          author_details: { rating: 8, avatar_path: null, username: 'demo_critic' },
        },
      ],
    },
  };
}

function personDetail(id: number) {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) return null;
  const i = id - 5001;
  const credits = rotate(MOVIES, i * 2)
    .slice(0, 14)
    .map((m, k) => ({ ...m, character: `Role ${k + 1}`, credit_id: `pc${id}-${k}` }));
  return {
    ...p,
    biography: `${p.name} is an invented performer in the Reelhouse demo catalogue. Their work spans festival dramas, genre thrillers and one very long musical.`,
    birthday: `19${70 + (i % 25)}-0${(i % 9) + 1}-1${i % 9}`,
    deathday: null,
    place_of_birth: ['Mumbai, India', 'Seoul, South Korea', 'Chennai, India', 'Lyon, France'][
      i % 4
    ],
    imdb_id: null,
    movie_credits: { cast: credits, crew: [] },
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
  if (params.with_original_language)
    items = items.filter((m) => m.original_language === params.with_original_language);
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
  if (path === '/movie/upcoming') return page(rotate(MOVIES, 30), p);
  if (path === '/movie/now_playing') return page(MOVIES.slice(0, 20), p);
  if (path === '/genre/movie/list')
    return { genres: GENRE_POOL.map((id) => ({ id, name: genreById(id)?.name ?? 'Drama' })) };
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
  return null;
}

export const FIXTURE_MOVIE_IDS = MOVIES.map((m) => m.id);
