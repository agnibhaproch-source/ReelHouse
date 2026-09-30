import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { MOODS, moodBySlug } from '@/lib/moods';
import { discover } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { getRequestPrefs } from '@/lib/prefs.server';
import { BrowseHeader } from '@/components/movie/BrowseHeader';
import { DiscoverGrid } from '@/components/movie/DiscoverGrid';
import { MoodTile } from '@/components/movie/MoodTile';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { StatusBanner } from '@/components/layout/StatusBanner';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MOODS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mood = moodBySlug((await params).slug);
  if (!mood) return { title: 'Mood not found' };
  return {
    title: `${mood.name} movies`,
    description: mood.blurb,
    alternates: { canonical: `/mood/${mood.slug}` },
  };
}

/** Mood browse: a curated discover query with the regular sort chips and filter drawer. */
export default async function MoodPage({ params }: Props) {
  const mood = moodBySlug((await params).slug);
  if (!mood) notFound();
  const prefs = await getRequestPrefs();
  const first = await safe(
    discover({ sort: 'popularity.desc', raw: mood.query }, prefs).then(async (p) => ({
      ...p,
      results: await withMeta(p.results),
    })),
  );
  const backdrops = (first.data?.results ?? [])
    .map((m) => m.backdrop_path)
    .filter((b): b is string => Boolean(b));
  const others = MOODS.filter((m) => m.slug !== mood.slug).slice(0, 4);

  return (
    <>
      <BrowseHeader eyebrow="Mood" title={mood.name} sub={mood.blurb} backdrops={backdrops} />
      {first.error && <StatusBanner kind="down" />}
      <Suspense
        fallback={
          <div className="px-gutter">
            <GridSkeleton count={18} />
          </div>
        }
      >
        <DiscoverGrid
          fixed={{ extra: mood.query }}
          initial={first.data ?? undefined}
          label={`${mood.name} movies`}
        />
      </Suspense>
      <section aria-labelledby="more-moods" className="px-gutter mt-20 pb-10">
        <h2 id="more-moods" className="font-display text-h2 mb-6">
          Another mood?
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((m) => (
            <li key={m.slug}>
              <MoodTile mood={m} compact />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
