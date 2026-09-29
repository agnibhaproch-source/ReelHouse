'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { tmdbFetch } from '@/lib/tmdb/client';
import { discover, kidsParams } from '@/lib/tmdb/endpoints';
import { MovieListSchema } from '@/lib/tmdb/schemas';
import { withMeta } from '@/lib/tmdb/meta';
import { genreAffinity, languageAffinity, rankRecommendations } from '@/lib/recommendations';
import { genreById } from '@/lib/tmdb/genres';
import { languageName } from '@/lib/tmdb/languages';
import { PREFS_COOKIES } from '@/lib/rows';
import type { Movie } from '@/lib/tmdb/types';

const SIX_HOURS = 6 * 60 * 60;

const SeedSchema = z.object({
  movie_id: z.number().int().positive(),
  title: z.string().max(300),
  genre_ids: z.array(z.number().int()).max(20).optional(),
  original_language: z.string().max(8).optional(),
});

const InputSchema = z.object({
  seeds: z.array(SeedSchema).max(40),
  exclude: z.array(z.number().int()).max(500),
});

export interface RecRow {
  key: string;
  title: string;
  href?: string;
  movies: Movie[];
}

/**
 * Personal rows (spec 53): "Because you added X", "More [genre] for you", "Popular in [language]".
 * Seeds come from the profile's watchlist + likes (client-held for guests); TMDB calls are cached
 * for 6h per seed. Titles already in the list are excluded.
 */
export async function getRecommendationRows(input: z.input<typeof InputSchema>): Promise<RecRow[]> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return [];
  const { seeds, exclude } = parsed.data;
  if (!seeds.length) return [];
  const jar = await cookies();
  const kids = jar.get(PREFS_COOKIES.kids)?.value === '1';
  const excluded = new Set([...exclude, ...seeds.map((s) => s.movie_id)]);
  const rows: RecRow[] = [];

  try {
    const recent = seeds.slice(0, 5);
    const lists = await Promise.all(
      recent.map((s) =>
        tmdbFetch(
          `/movie/${s.movie_id}/recommendations`,
          { page: 1 },
          { schema: MovieListSchema, revalidate: SIX_HOURS },
        )
          .then((r) => r.results)
          .catch(() => [] as Movie[]),
      ),
    );
    const merged = rankRecommendations(lists, excluded).filter((m) => !kids || !m.adult);
    if (merged.length >= 4 && recent[0]) {
      rows.push({
        key: `because-${recent[0].movie_id}`,
        title: `Because you added ${recent[0].title}`,
        movies: await withMeta(merged),
      });
      merged.forEach((m) => excluded.add(m.id));
    }

    const [g1] = genreAffinity(seeds, 2);
    if (g1 !== undefined) {
      const g = genreById(g1);
      const res = await discover({ genre: g1, sort: 'popularity.desc', page: 2, kids });
      const movies = res.results.filter((m) => !excluded.has(m.id));
      if (g && movies.length >= 4) {
        rows.push({
          key: `more-${g.slug}`,
          title: `More ${g.name.toLowerCase()} for you`,
          href: `/browse/${g.slug}`,
          movies: await withMeta(movies),
        });
        movies.forEach((m) => excluded.add(m.id));
      }
    }

    const lang = languageAffinity(seeds);
    if (lang) {
      const res = await tmdbFetch(
        '/discover/movie',
        {
          with_original_language: lang,
          sort_by: 'popularity.desc',
          page: 1,
          include_adult: false,
          ...(kids ? kidsParams() : {}),
        },
        { schema: MovieListSchema, revalidate: SIX_HOURS },
      );
      const movies = res.results.filter((m) => !excluded.has(m.id));
      if (movies.length >= 4)
        rows.push({
          key: `lang-rec-${lang}`,
          title: `Popular in ${languageName(lang)}`,
          href: `/language/${lang}`,
          movies: await withMeta(movies),
        });
    }
  } catch (err) {
    console.error('[recommendations]', err);
  }
  return rows;
}
