import type { MovieSnapshot } from './data/types';
import type { Movie, MovieDetail } from './tmdb/types';

export function toSnapshot(m: Movie | MovieDetail): MovieSnapshot {
  return {
    movie_id: m.id,
    title: m.title,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    vote_average: m.vote_average,
    release_date: m.release_date,
    genre_ids: 'genres' in m && m.genres.length ? m.genres.map((g) => g.id) : (m.genre_ids ?? []),
    original_language: m.original_language,
  };
}

/** Minimal Movie from a stored snapshot (watchlist/history rows render without TMDB calls). */
export function fromSnapshot(s: MovieSnapshot): Movie {
  return {
    id: s.movie_id,
    title: s.title,
    overview: '',
    poster_path: s.poster_path,
    backdrop_path: s.backdrop_path ?? null,
    release_date: s.release_date ?? null,
    vote_average: s.vote_average ?? 0,
    vote_count: 0,
    popularity: 0,
    genre_ids: s.genre_ids ?? [],
    original_language: s.original_language ?? 'en',
    adult: false,
  };
}

export function cardLabel(m: Pick<Movie, 'title' | 'release_date' | 'vote_average'>): string {
  const year = m.release_date?.slice(0, 4);
  const rating = m.vote_average ? `rated ${m.vote_average.toFixed(1)}` : 'not yet rated';
  return [m.title, year, rating].filter(Boolean).join(', ');
}
