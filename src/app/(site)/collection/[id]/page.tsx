import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCollection } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { getRequestPrefs } from '@/lib/prefs.server';
import { truncate, yearOf } from '@/lib/utils';
import { SIZES } from '@/lib/tmdb/images';
import { BrowseHeader } from '@/components/movie/BrowseHeader';
import { MovieCard } from '@/components/movie/MovieCard';
import { Reveal } from '@/components/motion/Reveal';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { TransitionLink } from '@/components/layout/TransitionLink';

type Props = { params: Promise<{ id: string }> };

export const revalidate = 86400;

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 && String(id) === raw ? id : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const c = id ? (await safe(getCollection(id))).data : null;
  if (!c) return { title: 'Collection not found' };
  return {
    title: c.name,
    description: truncate(c.overview || `Every film in ${c.name}, in order.`, 160),
    alternates: { canonical: `/collection/${c.id}` },
  };
}

/** A franchise as a timeline: every part in release order, numbered like chapters. */
export default async function CollectionPage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const prefs = await getRequestPrefs();
  const { data: c, error } = await safe(getCollection(id, prefs));
  if (!c) {
    if (error?.kind === 'not_found') notFound();
    return (
      <div className="pt-24">
        <StatusBanner kind="down" />
      </div>
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  const parts = await withMeta(
    [...c.parts].sort((a, b) => (a.release_date ?? '9999').localeCompare(b.release_date ?? '9999')),
  );
  const backdrops = [c.backdrop_path, ...parts.map((p) => p.backdrop_path)].filter(
    (b): b is string => Boolean(b),
  );

  return (
    <>
      <BrowseHeader
        eyebrow={`Collection · ${parts.length} films`}
        title={c.name}
        sub={c.overview || undefined}
        backdrops={backdrops}
      />
      <ol className="px-gutter relative mx-auto max-w-5xl pb-16">
        <span
          aria-hidden="true"
          className="bg-line absolute top-0 bottom-16 left-[calc(var(--gutter)+1.75rem)] w-px md:left-[calc(var(--gutter)+2.75rem)]"
        />
        {parts.map((m, i) => {
          const upcoming = Boolean(m.release_date && m.release_date > today);
          return (
            <li
              key={m.id}
              className="relative grid grid-cols-[3.5rem_1fr] gap-4 py-6 md:grid-cols-[5.5rem_1fr] md:gap-8"
            >
              <span
                aria-hidden="true"
                className="font-display bg-void text-reel/30 relative z-[1] self-start pt-2 text-center text-[clamp(1.6rem,4vw,2.8rem)] leading-none tabular-nums"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <Reveal className="grid grid-cols-[minmax(110px,160px)_1fr] items-start gap-5 md:gap-8">
                <MovieCard movie={m} sizes={SIZES.card} />
                <div className="pt-1">
                  <p className="meta-caps text-dim">
                    {upcoming ? `Coming ${m.release_date}` : (yearOf(m.release_date) ?? 'TBA')}
                  </p>
                  <h2 className="font-display text-h3 mt-1">
                    <TransitionLink href={`/movie/${m.id}`} className="hover:text-cyan">
                      {m.title}
                    </TransitionLink>
                  </h2>
                  {m.overview && (
                    <p className="text-dim mt-2 line-clamp-3 max-w-prose">{m.overview}</p>
                  )}
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </>
  );
}
