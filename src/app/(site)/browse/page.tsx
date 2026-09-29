import type { Metadata } from 'next';
import { GENRES } from '@/lib/tmdb/genres';
import { discover } from '@/lib/tmdb/endpoints';
import { getRequestPrefs } from '@/lib/prefs.server';
import { GenreTile } from '@/components/movie/GenreTile';
import { SplitHeading } from '@/components/motion/SplitHeading';

export const metadata: Metadata = {
  title: 'Browse genres',
  description: 'Every genre, from action to westerns — pick one and dive in.',
  alternates: { canonical: '/browse' },
};

/** Genre index (spec 26): big typographic tiles; hover fans out 3 posters behind the word. */
export default async function BrowseIndexPage() {
  const prefs = await getRequestPrefs();
  const genres = GENRES.filter((g) => g.slug !== 'tv-movie');
  const posters = await Promise.all(
    genres.map((g) =>
      discover({ genre: g.id, sort: 'popularity.desc' }, prefs)
        .then((p) => p.results.filter((m) => m.poster_path).slice(0, 3).map((m) => m.poster_path as string))
        .catch(() => [] as string[]),
    ),
  );
  return (
    <div className="px-gutter pt-32 pb-10">
      <SplitHeading as="h1" by="chars" trigger="mount" className="mb-12 font-display text-hero leading-[0.9]">
        Genres
      </SplitHeading>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {genres.map((g, i) => (
          <li key={g.slug}>
            <GenreTile slug={g.slug} name={g.name} posters={posters[i] ?? []} />
          </li>
        ))}
      </ul>
    </div>
  );
}
