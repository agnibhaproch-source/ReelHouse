import type { MovieDetail } from '@/lib/tmdb/types';
import { formatRuntime, yearOf } from '@/lib/utils';
import { languageName } from '@/lib/tmdb/languages';
import { ScrubText } from '@/components/motion/ScrubText';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/layout/TransitionLink';

/**
 * About the movie (spec 24.2): the synopsis brightens word-by-word with scroll, beside a sticky
 * "at a glance" card — director, year, runtime, language, genres.
 */
export function DetailOverview({ movie }: { movie: MovieDetail }) {
  const { overview } = movie;
  if (!overview) return null;
  const directors = movie.credits.crew.filter((c) => c.job === 'Director');
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: directors.length > 1 ? 'Directors' : 'Director',
      value: directors.length
        ? directors.map((d, i) => (
            <span key={d.id}>
              {i > 0 && ', '}
              <TransitionLink
                href={`/person/${d.id}`}
                className="hover:text-cyan decoration-line underline underline-offset-4"
              >
                {d.name}
              </TransitionLink>
            </span>
          ))
        : null,
    },
    { label: 'Released', value: yearOf(movie.release_date) },
    { label: 'Runtime', value: movie.runtime ? formatRuntime(movie.runtime) : null },
    { label: 'Language', value: languageName(movie.original_language) },
    { label: 'Genres', value: movie.genres.map((g) => g.name).join(' · ') || null },
  ].filter((r) => r.value);

  return (
    <section
      aria-labelledby="overview-h"
      className="px-gutter mx-auto grid max-w-7xl gap-12 py-20 md:grid-cols-[1fr_320px] md:py-28"
      data-quotable
    >
      <div>
        <SplitHeading id="overview-h" as="h2" className="meta-caps text-dim mb-6">
          About the movie
        </SplitHeading>
        <ScrubText
          text={overview}
          className="font-display text-[clamp(1.5rem,3vw,2.6rem)] leading-[1.2] [font-variation-settings:'SOFT'_50,'opsz'_72]"
        />
      </div>
      <aside className="md:sticky md:top-[calc(var(--nav-height)+80px)] md:self-start">
        <Reveal>
          <dl className="rounded-modal border-line bg-seat lit-edge divide-line divide-y border px-5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-6 py-4">
                <dt className="meta-caps text-dim shrink-0">{r.label}</dt>
                <dd className="text-right font-semibold">{r.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </aside>
    </section>
  );
}
