import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { genreBySlug } from '@/lib/tmdb/genres';
import { discover } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { getRequestPrefs } from '@/lib/prefs.server';
import { BrowseHeader } from '@/components/movie/BrowseHeader';
import { DiscoverGrid } from '@/components/movie/DiscoverGrid';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { StatusBanner } from '@/components/layout/StatusBanner';

type Props = { params: Promise<{ genre: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = genreBySlug((await params).genre);
  if (!g) return { title: 'Genre not found' };
  return {
    title: `${g.name} movies`,
    description: `The best ${g.name.toLowerCase()} movies from around the world — sorted by popularity, rating or release date.`,
    alternates: { canonical: `/browse/${g.slug}` },
  };
}

export default async function GenrePage({ params }: Props) {
  const g = genreBySlug((await params).genre);
  if (!g) notFound();
  const prefs = await getRequestPrefs();
  const first = await safe(
    discover({ genre: g.id, sort: 'popularity.desc' }, prefs).then(async (p) => ({
      ...p,
      results: await withMeta(p.results),
    })),
  );
  const backdrops = (first.data?.results ?? [])
    .map((m) => m.backdrop_path)
    .filter((b): b is string => Boolean(b));

  return (
    <>
      <BrowseHeader eyebrow="Movies by genre" title={g.name} backdrops={backdrops} />
      {first.error && <StatusBanner kind="down" />}
      <Suspense
        fallback={
          <div className="px-gutter">
            <GridSkeleton count={18} />
          </div>
        }
      >
        <DiscoverGrid
          fixed={{ genre: g.id }}
          initial={first.data ?? undefined}
          label={`${g.name} movies`}
        />
      </Suspense>
    </>
  );
}
