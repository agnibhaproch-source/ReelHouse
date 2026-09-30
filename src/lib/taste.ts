import type { HistoryItem, MovieSnapshot, WatchItem } from '@/lib/data/types';
import { genreById } from '@/lib/tmdb/genres';
import { languageName } from '@/lib/tmdb/languages';

export interface Bar {
  key: string;
  label: string;
  value: number;
}

export interface Taste {
  films: number;
  rated: number;
  averageRating: number | null;
  genres: Bar[];
  languages: Bar[];
  decades: Bar[];
  year: { year: number; views: number; topGenre: string | null; films: MovieSnapshot[] };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function tally(map: Map<string, Bar>, key: string, label: string, w: number) {
  const b = map.get(key);
  if (b) b.value += w;
  else map.set(key, { key, label, value: w });
}

/**
 * Taste profile from what a profile viewed, listed and rated. Each film is weighted once:
 * viewed +1, on the list +1, rated +score/5 (a 10/10 counts like two views).
 */
export function buildTaste(
  history: HistoryItem[],
  watchlist: WatchItem[],
  ratings: Record<number, number>,
  now = new Date(),
): Taste {
  const films = new Map<number, { snap: MovieSnapshot; weight: number }>();
  const add = (snap: MovieSnapshot, w: number) => {
    const f = films.get(snap.movie_id);
    if (f) f.weight += w;
    else films.set(snap.movie_id, { snap, weight: w });
  };
  for (const h of history) add(h, 1);
  for (const w of watchlist) add(w, 1);
  for (const [id, score] of Object.entries(ratings)) {
    const f = films.get(Number(id));
    if (f) f.weight += score / 5;
  }

  const genres = new Map<string, Bar>();
  const languages = new Map<string, Bar>();
  const decades = new Map<string, Bar>();
  for (const { snap, weight } of films.values()) {
    for (const g of snap.genre_ids ?? []) {
      const name = genreById(g)?.name;
      if (name) tally(genres, String(g), name, weight);
    }
    if (snap.original_language)
      tally(languages, snap.original_language, languageName(snap.original_language), weight);
    const y = Number(snap.release_date?.slice(0, 4));
    if (y > 1900) {
      const d = Math.floor(y / 10) * 10;
      tally(decades, String(d), `${d}s`, weight);
    }
  }
  const top = (m: Map<string, Bar>, n: number) =>
    [...m.values()]
      .map((b) => ({ ...b, value: round1(b.value) }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, n);

  const scores = Object.values(ratings);
  const year = now.getFullYear();
  const thisYear = history.filter((h) => h.kind === 'view' && h.at.startsWith(String(year)));
  const yearGenres = new Map<string, Bar>();
  for (const h of thisYear)
    for (const g of h.genre_ids ?? []) {
      const name = genreById(g)?.name;
      if (name) tally(yearGenres, String(g), name, 1);
    }

  return {
    films: films.size,
    rated: scores.length,
    averageRating: scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    genres: top(genres, 8),
    languages: top(languages, 6),
    decades: top(decades, 12).sort((a, b) => a.key.localeCompare(b.key)),
    year: {
      year,
      views: thisYear.length,
      topGenre: top(yearGenres, 1)[0]?.label ?? null,
      films: [...thisYear].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
    },
  };
}
