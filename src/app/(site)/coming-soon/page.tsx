import type { Metadata } from 'next';
import { getComingSoon } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { getRequestPrefs } from '@/lib/prefs.server';
import type { Movie } from '@/lib/tmdb/types';
import { SIZES } from '@/lib/tmdb/images';
import { BrowseHeader } from '@/components/movie/BrowseHeader';
import { MovieCard } from '@/components/movie/MovieCard';
import { RemindButton } from '@/components/movie/RemindButton';
import { EmptyState } from '@/components/layout/EmptyState';
import { StatusBanner } from '@/components/layout/StatusBanner';

export const metadata: Metadata = {
  title: 'Coming soon',
  description:
    'Release calendar for the next four months. Set a reminder or add a date to your calendar.',
  alternates: { canonical: '/coming-soon' },
};

const monthKey = (d: string) => d.slice(0, 7);
const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
const dayParts = (d: string) => {
  const date = new Date(`${d}T00:00:00Z`);
  return {
    day: date.getUTCDate(),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
  };
};

/** Release calendar (next ~4 months), grouped by month, with reminders and .ics per film. */
export default async function ComingSoonPage() {
  const prefs = await getRequestPrefs();
  const pages = await Promise.all([1, 2, 3].map((p) => safe(getComingSoon(p, prefs))));
  const seen = new Set<number>();
  const films = await withMeta(
    pages
      .flatMap((p) => p.data?.results ?? [])
      .filter((m): m is Movie & { release_date: string } => Boolean(m.release_date))
      .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true))),
    24,
  );
  const months = new Map<string, typeof films>();
  for (const m of films) {
    const k = monthKey(m.release_date as string);
    months.set(k, [...(months.get(k) ?? []), m]);
  }
  const backdrops = films.map((m) => m.backdrop_path).filter((b): b is string => Boolean(b));

  return (
    <>
      <BrowseHeader
        eyebrow="Release calendar"
        title="Coming soon"
        sub="The next four months in cinemas and on streaming. Set a reminder and we’ll tell you on release day."
        backdrops={backdrops}
      />
      {pages.every((p) => p.error) && <StatusBanner kind="down" />}
      {films.length === 0 ? (
        <EmptyState
          title="Nothing scheduled yet."
          body="Check back soon — new dates land every week."
        />
      ) : (
        <div className="px-gutter mx-auto max-w-6xl pb-16">
          {[...months].map(([key, list]) => (
            <section key={key} aria-labelledby={`m-${key}`} className="mb-14">
              <h2
                id={`m-${key}`}
                className="font-display text-h2 bg-void/85 sticky top-(--nav-height) z-10 -mx-2 mb-6 px-2 py-3 backdrop-blur-md"
              >
                {monthLabel(key)}
              </h2>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => {
                  const { day, weekday } = dayParts(m.release_date as string);
                  return (
                    <li
                      key={m.id}
                      className="rounded-modal border-line bg-seat lit-edge grid grid-cols-[96px_1fr] gap-4 border p-3"
                    >
                      <MovieCard movie={m} sizes={SIZES.card} />
                      <div className="flex min-w-0 flex-col gap-2 py-1">
                        <p className="flex items-baseline gap-2">
                          <span className="font-display text-amber text-[2rem] leading-none tabular-nums">
                            {day}
                          </span>
                          <span className="meta-caps text-dim">{weekday}</span>
                        </p>
                        <p className="font-display text-body line-clamp-2 leading-snug">
                          {m.title}
                        </p>
                        <div className="mt-auto">
                          <RemindButton movie={m} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
