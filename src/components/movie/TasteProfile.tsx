'use client';

import { useMemo } from 'react';
import type { Bar } from '@/lib/taste';
import { buildTaste } from '@/lib/taste';
import { GENRES } from '@/lib/tmdb/genres';
import { SIZES } from '@/lib/tmdb/images';
import { useHistory } from '@/hooks/useHistory';
import { useRatings } from '@/hooks/useRatings';
import { useWatchlist } from '@/hooks/useWatchlist';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { EmptyState } from '@/components/layout/EmptyState';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { Button } from '@/components/ui/Button';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { GridSkeleton } from '@/components/ui/Skeleton';

const summary = (title: string, bars: Bar[]) =>
  `${title}: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}`;

function TableView({ title, bars }: { title: string; bars: Bar[] }) {
  return (
    <details className="text-small text-dim mt-3">
      <summary className="hover:text-reel inline-flex min-h-11 cursor-pointer items-center">
        Show as table
      </summary>
      <table className="mt-2 w-full max-w-sm">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="text-left">
            <th className="py-1 font-semibold">{title.split(' ')[0]}</th>
            <th className="py-1 text-right font-semibold">Weight</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.key} className="border-line border-t">
              <td className="py-1">{b.label}</td>
              <td className="py-1 text-right tabular-nums">{b.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Horizontal bars (one series, one hue): label · thin bar with a rounded end · hover value. */
function BarList({ title, bars }: { title: string; bars: Bar[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <figure className="rounded-modal border-line bg-seat lit-edge border p-5 md:p-6">
      <figcaption className="font-display text-h3 mb-4">{title}</figcaption>
      <div role="img" aria-label={summary(title, bars)} className="flex flex-col">
        {bars.map((b, i) => (
          <div
            key={b.key}
            aria-hidden="true"
            className="group/bar hover:bg-reel/5 -mx-2 grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 rounded-md px-2 py-1.5"
          >
            <span className="text-small text-dim group-hover/bar:text-reel truncate">
              {b.label}
            </span>
            <span className="bg-line/40 relative h-2.5 rounded-r-[4px]">
              <span
                className="bg-violet absolute inset-y-0 left-0 rounded-r-[4px]"
                style={{ width: `${(b.value / max) * 100}%` }}
              />
            </span>
            <span
              className={`text-small text-right tabular-nums transition-opacity ${i === 0 ? 'text-reel' : 'text-dim opacity-0 group-hover/bar:opacity-100'}`}
            >
              {b.value}
            </span>
          </div>
        ))}
      </div>
      <TableView title={title} bars={bars} />
    </figure>
  );
}

/** Decades as columns on a shared baseline (change over time reads left → right). */
function Columns({ title, bars }: { title: string; bars: Bar[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <figure className="rounded-modal border-line bg-seat lit-edge border p-5 md:p-6">
      <figcaption className="font-display text-h3 mb-4">{title}</figcaption>
      <div
        role="img"
        aria-label={summary(title, bars)}
        className="border-line flex h-44 items-end gap-[2px] border-b"
      >
        {bars.map((b) => (
          <div
            key={b.key}
            aria-hidden="true"
            className="group/col relative flex h-full flex-1 flex-col justify-end"
          >
            <span className="bg-aisle text-small text-reel pointer-events-none absolute -top-1 left-1/2 z-[1] -translate-x-1/2 -translate-y-full rounded-md px-2 py-0.5 whitespace-nowrap tabular-nums opacity-0 transition-opacity group-hover/col:opacity-100">
              {b.label}: {b.value}
            </span>
            <span
              className="bg-violet group-hover/col:bg-cyan mx-auto w-full max-w-10 rounded-t-[4px] transition-colors"
              style={{ height: `${Math.max(3, (b.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-[2px]">
        {bars.map((b) => (
          <span key={b.key} className="text-dim flex-1 text-center text-[0.7rem]">
            {b.label}
          </span>
        ))}
      </div>
      <TableView title={title} bars={bars} />
    </figure>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-modal border-line bg-seat lit-edge border p-5">
      <p className="meta-caps text-dim">{label}</p>
      <p className="font-display mt-2 text-[clamp(2rem,4vw,3rem)] leading-none">{value}</p>
    </div>
  );
}

/** Taste profile: what this profile gravitates to, from views, list and ratings. */
export function TasteProfile() {
  const history = useHistory();
  const list = useWatchlist();
  const ratings = useRatings();
  const taste = useMemo(
    () => buildTaste(history.data ?? [], list.data ?? [], ratings.data ?? {}),
    [history.data, list.data, ratings.data],
  );
  const pending = history.isPending || list.isPending || ratings.isPending;
  const topGenre = taste.genres[0];
  const topSlug = topGenre ? GENRES.find((g) => String(g.id) === topGenre.key)?.slug : undefined;

  return (
    <div className="px-gutter mx-auto max-w-6xl pt-32 pb-16">
      <SplitHeading as="h1" by="chars" trigger="mount" className="font-display text-h1">
        Your taste
      </SplitHeading>
      <p className="text-dim mt-3 mb-10 max-w-xl">
        Built from the films you open, save and rate on this profile. It never leaves your account.
      </p>
      {pending ? (
        <GridSkeleton count={6} />
      ) : taste.films < 3 ? (
        <EmptyState
          title="Not enough to go on yet."
          body="Open, save or rate a few films and your taste profile will appear here."
          action={{ href: '/browse', label: 'Browse moods & genres' }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Films explored" value={String(taste.films)} />
            <Stat label="Rated" value={String(taste.rated)} />
            <Stat
              label="Your average"
              value={taste.averageRating === null ? '—' : `${taste.averageRating}/10`}
            />
            <Stat label="Top genre" value={topGenre?.label ?? '—'} />
          </div>

          {taste.year.views > 0 && (
            <section
              aria-labelledby="year-h"
              className="rounded-modal border-line lit-edge relative overflow-hidden border p-6 md:p-8"
              style={{
                background:
                  'radial-gradient(90% 120% at 100% 0%, color-mix(in oklab, var(--marquee-violet) 22%, transparent), transparent 60%), var(--bg-seat)',
              }}
            >
              <p className="meta-caps text-dim">Your year in film</p>
              <h2 id="year-h" className="font-display text-h2 mt-1">
                {taste.year.year}: {taste.year.views} film{taste.year.views === 1 ? '' : 's'}
                {taste.year.topGenre ? `, mostly ${taste.year.topGenre.toLowerCase()}` : ''}.
              </h2>
              <ul className="mt-6 flex gap-3 overflow-x-auto pb-2">
                {taste.year.films.map((f) => (
                  <li key={f.movie_id} className="w-24 shrink-0 md:w-28">
                    <TransitionLink
                      href={`/movie/${f.movie_id}`}
                      className="rounded-poster bg-seat relative block aspect-[2/3] overflow-hidden"
                      aria-label={f.title}
                    >
                      <TmdbImage
                        path={f.poster_path}
                        kind="poster"
                        alt=""
                        sizes={SIZES.card}
                        fallbackTitle={f.title}
                      />
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <BarList title="Genres you gravitate to" bars={taste.genres} />
            <BarList title="Languages you watch in" bars={taste.languages} />
          </div>
          {taste.decades.length > 1 && <Columns title="Decades" bars={taste.decades} />}

          {topSlug && (
            <div className="flex flex-wrap gap-3">
              <Button href={`/browse/${topSlug}`}>More {topGenre?.label.toLowerCase()}</Button>
              <Button href="/browse#moods" variant="secondary">
                Try a mood
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
