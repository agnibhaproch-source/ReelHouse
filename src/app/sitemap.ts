import type { MetadataRoute } from 'next';
import { getPopular } from '@/lib/tmdb/endpoints';
import { usingFixtures } from '@/lib/tmdb/client';
import { GENRES } from '@/lib/tmdb/genres';
import { LANGUAGES } from '@/lib/tmdb/languages';
import { MOODS } from '@/lib/moods';
import {
  CATALOGUE,
  CATALOGUE_COLLECTIONS,
  CATALOGUE_DIRECTORS,
} from '@/lib/tmdb/fixture-catalogue';
import { SITE_URL } from '@/lib/site';

export const revalidate = 86400;

/** Top 1,000 movies + genres + languages (spec 63). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/browse`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...GENRES.map((g) => ({
      url: `${SITE_URL}/browse/${g.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...MOODS.map((m) => ({
      url: `${SITE_URL}/mood/${m.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...LANGUAGES.map((l) => ({
      url: `${SITE_URL}/language/${l.code}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
  if (!usingFixtures())
    staticRoutes.push({
      url: `${SITE_URL}/coming-soon`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  if (usingFixtures()) {
    const entry = (path: string, priority: number) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority,
    });
    return [
      ...staticRoutes,
      ...CATALOGUE.map((_, i) => entry(`/movie/${1001 + i}`, 0.6)),
      ...CATALOGUE_DIRECTORS.map((_, i) => entry(`/person/${5001 + i}`, 0.4)),
      ...CATALOGUE_COLLECTIONS.map((c) => entry(`/collection/${c.id}`, 0.5)),
    ];
  }
  const pages = await Promise.all(
    Array.from({ length: 50 }, (_, i) => getPopular(i + 1).catch(() => null)),
  );
  const seen = new Set<number>();
  const movies = pages
    .flatMap((p) => p?.results ?? [])
    .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
    .slice(0, 1000)
    .map((m) => ({
      url: `${SITE_URL}/movie/${m.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  return [...staticRoutes, ...movies];
}
