import type { Movie } from './tmdb/types';

export interface Seed {
  movie_id: number;
  title: string;
  genre_ids?: number[];
  original_language?: string;
}

/** Merge recommendation lists, dedupe, rank by frequency × popularity (spec 53). */
export function rankRecommendations(
  lists: Movie[][],
  exclude: ReadonlySet<number>,
  limit = 20,
): Movie[] {
  const freq = new Map<number, { movie: Movie; count: number }>();
  for (const list of lists) {
    const seen = new Set<number>();
    for (const m of list) {
      if (exclude.has(m.id) || seen.has(m.id)) continue;
      seen.add(m.id);
      const hit = freq.get(m.id);
      if (hit) hit.count++;
      else freq.set(m.id, { movie: m, count: 1 });
    }
  }
  const score = (x: { movie: Movie; count: number }) =>
    x.count * Math.log10(10 + x.movie.popularity) * (0.5 + x.movie.vote_average / 20);
  return [...freq.values()]
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
    .map((x) => x.movie);
}

/** Top genres by count across seeds. */
export function genreAffinity(seeds: readonly Seed[], top = 2): number[] {
  const counts = new Map<number, number>();
  for (const s of seeds) for (const g of s.genre_ids ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, top)
    .map(([g]) => g);
}

/** Dominant original language, if it covers at least 30% of seeds. */
export function languageAffinity(seeds: readonly Seed[]): string | null {
  const counts = new Map<string, number>();
  for (const s of seeds)
    if (s.original_language)
      counts.set(s.original_language, (counts.get(s.original_language) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] / Math.max(1, seeds.length) < 0.3) return null;
  return best[0];
}
