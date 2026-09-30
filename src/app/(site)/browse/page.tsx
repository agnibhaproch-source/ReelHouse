import type { Metadata } from 'next';
import { GENRES } from '@/lib/tmdb/genres';
import { discover } from '@/lib/tmdb/endpoints';
import { getRequestPrefs } from '@/lib/prefs.server';
import { GenreTile } from '@/components/movie/GenreTile';
import { MoodTile } from '@/components/movie/MoodTile';
import { MOODS } from '@/lib/moods';
import { SplitHeading } from '@/components/motion/SplitHeading';

export const metadata: Metadata = {
  title: 'Browse moods and genres',
  description: 'Pick a mood or a genre, from rainy-Sunday dramas to midnight horror, and dive in.',
  alternates: { canonical: '/browse' },
};

/** Genre index (spec 26): big typographic tiles; hover fans out 3 posters behind the word. */
export default async function BrowseIndexPage() {
  const prefs = await getRequestPrefs();
  const genres = GENRES.filter((g) => g.slug !== 'tv-movie');
  const posters = await Promise.all(
    genres.map((g) =>
      discover({ genre: g.id, sort: 'popularity.desc' }, prefs)
        .then((p) =>
          p.results
            .filter((m) => m.poster_path)
            .slice(0, 3)
            .map((m) => m.poster_path as string),
        )
        .catch(() => [] as string[]),
    ),
  );
  return (
    <div className="px-gutter pt-32 pb-10">
      <SplitHeading
        as="h1"
        by="chars"
        trigger="mount"
        className="font-display text-hero mb-12 leading-[0.9]"
      >
        Browse
      </SplitHeading>
      <section id="moods" aria-labelledby="moods-heading" className="mb-20 scroll-mt-28">
        <h2 id="moods-heading" className="font-display text-h2 mb-6">
          By mood
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {MOODS.map((m) => (
            <li key={m.slug}>
              <MoodTile mood={m} compact />
            </li>
          ))}
        </ul>
      </section>
      <h2 className="font-display text-h2 mb-6">By genre</h2>
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
