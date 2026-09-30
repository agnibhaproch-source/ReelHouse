import type { MovieDetail } from '@/lib/tmdb/types';
import { formatMoney } from '@/lib/utils';
import { Counter } from '@/components/motion/Counter';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/layout/TransitionLink';

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  const t = Date.parse(d);
  return Number.isNaN(t)
    ? '—'
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        t,
      );
}

/** Details (spec 24.5): writers, budget and box office (odometer), release dates, status. */
export function DetailFacts({ movie }: { movie: MovieDetail }) {
  const writers = movie.credits.crew
    .filter((c) => ['Screenplay', 'Writer', 'Story', 'Novel'].includes(c.job))
    .slice(0, 4);
  const released =
    movie.release_dates?.results.find((r) => r.iso_3166_1 === 'IN')?.release_dates[0]
      ?.release_date ?? movie.release_date;

  const people = (list: typeof writers) =>
    list.length ? (
      <span className="flex flex-wrap gap-x-2">
        {list.map((p, i) => (
          <TransitionLink
            key={p.credit_id ?? `${p.id}-${p.job}`}
            href={`/person/${p.id}`}
            className="decoration-line hover:text-cyan hover:decoration-cyan underline underline-offset-4 transition-colors"
          >
            {p.name}
            {i < list.length - 1 ? ',' : ''}
          </TransitionLink>
        ))}
      </span>
    ) : (
      '—'
    );

  // Director, year, runtime and language live in the "At a glance" card above; this section
  // carries the rest, and skips anything TMDB doesn't have.
  const releaseDate = formatDate(movie.release_date);
  const indiaDate = formatDate(released);
  const facts: { label: string; value: React.ReactNode }[] = [
    { label: 'Writers', value: writers.length ? people(writers) : null },
    {
      label: 'Budget',
      value: movie.budget ? <Counter value={formatMoney(movie.budget)} label="Budget" /> : null,
    },
    {
      label: 'Box office',
      value: movie.revenue ? <Counter value={formatMoney(movie.revenue)} label="Revenue" /> : null,
    },
    { label: 'Release date', value: releaseDate === '—' ? null : releaseDate },
    {
      label: 'Released in India',
      value: indiaDate === '—' || indiaDate === releaseDate ? null : indiaDate,
    },
    { label: 'Status', value: movie.status || null },
  ].filter((f) => Boolean(f.value));
  if (facts.length < 2) return null;

  return (
    <section aria-labelledby="facts-h" className="px-gutter py-12">
      <SplitHeading id="facts-h" className="font-display text-h2 mb-6">
        Details
      </SplitHeading>
      <Reveal
        as="dl"
        stagger
        className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {facts.map((f) => (
          <div key={f.label} className="border-line border-t pt-4">
            <dt className="text-small text-dim">{f.label}</dt>
            <dd className="mt-1 text-[1.15rem] font-semibold">{f.value}</dd>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
