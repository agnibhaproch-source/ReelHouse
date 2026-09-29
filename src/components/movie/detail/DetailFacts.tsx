import type { MovieDetail } from '@/lib/tmdb/types';
import { formatMoney, formatRuntime } from '@/lib/utils';
import { languageName } from '@/lib/tmdb/languages';
import { Counter } from '@/components/motion/Counter';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/layout/TransitionLink';

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  const t = Date.parse(d);
  return Number.isNaN(t) ? '—' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(t);
}

/** Details (spec 24.5): director, writers, budget, revenue (odometer), dates, language, runtime. */
export function DetailFacts({ movie }: { movie: MovieDetail }) {
  const directors = movie.credits.crew.filter((c) => c.job === 'Director');
  const writers = movie.credits.crew.filter((c) => ['Screenplay', 'Writer', 'Story', 'Novel'].includes(c.job)).slice(0, 4);
  const released = movie.release_dates?.results.find((r) => r.iso_3166_1 === 'IN')?.release_dates[0]?.release_date ?? movie.release_date;

  const people = (list: typeof directors) =>
    list.length ? (
      <span className="flex flex-wrap gap-x-2">
        {list.map((p, i) => (
          <TransitionLink key={p.credit_id ?? `${p.id}-${p.job}`} href={`/person/${p.id}`} className="underline decoration-line underline-offset-4 transition-colors hover:text-cyan hover:decoration-cyan">
            {p.name}
            {i < list.length - 1 ? ',' : ''}
          </TransitionLink>
        ))}
      </span>
    ) : (
      '—'
    );

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: directors.length > 1 ? 'Directors' : 'Director', value: people(directors) },
    { label: 'Writers', value: people(writers) },
    { label: 'Budget', value: movie.budget ? <Counter value={formatMoney(movie.budget)} label="Budget" /> : '—' },
    { label: 'Revenue', value: movie.revenue ? <Counter value={formatMoney(movie.revenue)} label="Revenue" /> : '—' },
    { label: 'Release date', value: formatDate(movie.release_date) },
    { label: 'Released in India', value: formatDate(released) },
    { label: 'Original language', value: languageName(movie.original_language) },
    { label: 'Runtime', value: movie.runtime ? <Counter value={formatRuntime(movie.runtime)} label="Runtime" /> : '—' },
    { label: 'Status', value: movie.status || '—' },
  ];

  return (
    <section aria-labelledby="facts-h" className="px-gutter py-12">
      <SplitHeading id="facts-h" className="mb-6 font-display text-h2">
        Details
      </SplitHeading>
      <Reveal as="dl" stagger className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="border-t border-line pt-4">
            <dt className="text-small text-dim">{f.label}</dt>
            <dd className="mt-1 text-[1.15rem] font-semibold">{f.value}</dd>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
