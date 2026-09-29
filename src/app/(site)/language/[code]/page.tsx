import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getLanguage } from '@/lib/tmdb/languages';
import { discover } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { getRequestPrefs } from '@/lib/prefs.server';
import { BrowseHeader } from '@/components/movie/BrowseHeader';
import { DiscoverGrid } from '@/components/movie/DiscoverGrid';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { StatusBanner } from '@/components/layout/StatusBanner';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = getLanguage((await params).code);
  if (!l) return { title: 'Language not found' };
  return {
    title: `${l.name} movies`,
    description: `Popular, top-rated and new ${l.name} cinema (${l.native}).`,
    alternates: { canonical: `/language/${l.code}` },
  };
}

export default async function LanguagePage({ params }: Props) {
  const l = getLanguage((await params).code);
  if (!l) notFound();
  const prefs = await getRequestPrefs();
  const first = await safe(
    discover({ lang: l.code, sort: 'popularity.desc' }, prefs).then(async (p) => ({
      ...p,
      results: await withMeta(p.results),
    })),
  );
  const backdrops = (first.data?.results ?? [])
    .map((m) => m.backdrop_path)
    .filter((b): b is string => Boolean(b));

  return (
    <>
      <BrowseHeader
        eyebrow="Cinema in"
        title={l.name}
        sub={l.native !== l.name ? l.native : undefined}
        backdrops={backdrops}
      />
      {first.error && <StatusBanner kind="down" />}
      <Suspense
        fallback={
          <div className="px-gutter">
            <GridSkeleton count={18} />
          </div>
        }
      >
        <DiscoverGrid
          fixed={{ lang: l.code }}
          initial={first.data ?? undefined}
          label={`${l.name} movies`}
        />
      </Suspense>
    </>
  );
}
