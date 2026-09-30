import type { Metadata } from 'next';
import { getMovieBasic } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { getRequestPrefs } from '@/lib/prefs.server';
import { cleanListName, decodeListIds, encodeListIds } from '@/lib/shared-list';
import type { Movie } from '@/lib/tmdb/types';
import { BrowseHeader } from '@/components/movie/BrowseHeader';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { AddAllButton } from '@/components/movie/AddAllButton';
import { EmptyState } from '@/components/layout/EmptyState';

type Props = { searchParams: Promise<{ i?: string; n?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const ids = decodeListIds(sp.i);
  const name = cleanListName(sp.n);
  const og = `/api/og/list?${new URLSearchParams({ i: encodeListIds(ids.slice(0, 6)), n: name })}`;
  return {
    title: name,
    description: `${ids.length} films, shared from Reelhouse.`,
    robots: { index: false },
    openGraph: { title: name, description: `${ids.length} films on Reelhouse`, images: [og] },
    twitter: { card: 'summary_large_image', title: name, images: [og] },
  };
}

/** A list someone shared: read-only, with "add all to my list". */
export default async function SharedListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ids = decodeListIds(sp.i);
  const name = cleanListName(sp.n);
  const prefs = await getRequestPrefs();
  const results = await Promise.all(ids.map((id) => safe(getMovieBasic(id, prefs))));
  const movies = await withMeta(
    results.map((r) => r.data).filter((m) => m !== null) as Movie[],
    12,
  );
  const backdrops = movies.map((m) => m.backdrop_path).filter((b): b is string => Boolean(b));

  return (
    <>
      <BrowseHeader
        eyebrow={`Shared list · ${movies.length} film${movies.length === 1 ? '' : 's'}`}
        title={name}
        backdrops={backdrops}
      />
      {movies.length === 0 ? (
        <EmptyState
          title="This list is empty or the link is broken."
          body="Ask for a fresh link, or start your own list."
          action={{ href: '/', label: 'Browse films' }}
        />
      ) : (
        <div className="px-gutter pb-16">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <AddAllButton movies={movies} />
          </div>
          <MovieGrid movies={movies} label={name} />
        </div>
      )}
    </>
  );
}
