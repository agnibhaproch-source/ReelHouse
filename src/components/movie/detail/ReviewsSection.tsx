'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useState } from 'react';
import { Flag, Heart, Pencil, Trash2 } from 'lucide-react';
import type { TmdbReview } from '@/lib/tmdb/types';
import type { SiteReview } from '@/lib/data/types';
import { useSiteReviews, useReviewMutations } from '@/hooks/useReviews';
import { useSession } from '@/hooks/useSession';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { SPRING, DUR } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { EmptyState } from '@/components/layout/EmptyState';
import dynamic from 'next/dynamic';

// Form + zod load only when someone writes a review (spec 61).
const ReviewSheet = dynamic(() => import('./ReviewSheet').then((m) => m.ReviewSheet), {
  ssr: false,
});

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function ExpandableText({ text, spoiler }: { text: string; spoiler?: boolean }) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(!spoiler);
  const { reduced } = useMotionPrefs();
  const long = text.length > 420;
  return (
    <m.div layout={!reduced} transition={SPRING} className="relative">
      {spoiler && !revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="text-small text-amber absolute inset-0 z-10 grid place-items-center rounded-md font-bold"
        >
          Contains spoilers — reveal
        </button>
      )}
      <p
        className={cn('spoiler text-reel/85 whitespace-pre-line', !open && long && 'line-clamp-6')}
        data-revealed={revealed}
        aria-hidden={!revealed || undefined}
      >
        {text}
      </p>
      {long && revealed && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-small text-cyan mt-2 min-h-9 font-semibold hover:underline"
          aria-expanded={open}
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </m.div>
  );
}

function HeartBurst({
  on,
  onClick,
  count,
  label,
}: {
  on: boolean;
  onClick: () => void;
  count: number;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={cn(
        'group rounded-pill text-small relative flex min-h-9 items-center gap-1.5 px-2 transition-colors',
        on ? 'text-danger' : 'text-dim hover:text-reel',
      )}
    >
      <span className="relative">
        <Heart
          className={cn('duration-base ease-snap size-4 transition-transform', on && 'scale-110')}
          fill={on ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        <AnimatePresence>
          {on && (
            <m.span
              key="burst"
              aria-hidden="true"
              className="border-danger absolute inset-0 rounded-full border-2"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.slow }}
            />
          )}
        </AnimatePresence>
      </span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

interface Props {
  movieId: number;
  title: string;
  tmdbReviews: TmdbReview[];
  tmdbAverage: number;
}

/** Reviews (specs 24.7, 55): TMDB + Reelhouse tabs, spoiler blur, read more, likes, edit/delete own, report. */
export function ReviewsSection({ movieId, title, tmdbReviews }: Props) {
  const [tab, setTab] = useState<'site' | 'tmdb'>('site');
  const [sheet, setSheet] = useState<{ open: boolean; editing?: SiteReview }>({ open: false });
  const [sheetUsed, setSheetUsed] = useState(false);
  if (sheet.open && !sheetUsed) setSheetUsed(true);
  const { profileId } = useSession();
  const { data: site = [] } = useSiteReviews(movieId);
  const { remove, like, report } = useReviewMutations(movieId);
  const { reduced } = useMotionPrefs();
  const mine = site.find((r) => r.profile_id === profileId);

  return (
    <section aria-labelledby="reviews-h" className="px-gutter py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SplitHeading id="reviews-h" className="font-display text-h2">
          Reviews
        </SplitHeading>
        <Button
          variant="secondary"
          icon={<Pencil />}
          onClick={() => setSheet({ open: true, editing: mine })}
          magnetic={false}
        >
          {mine ? 'Edit your review' : 'Write a review'}
        </Button>
      </div>
      <Tabs
        label="Review sources"
        idPrefix="reviews"
        value={tab}
        onChange={(id) => setTab(id as 'site' | 'tmdb')}
        items={[
          { id: 'site', label: `Reelhouse (${site.length})` },
          // TMDB reviews only exist with live data; don't show an empty tab otherwise.
          ...(tmdbReviews.length ? [{ id: 'tmdb', label: `TMDB (${tmdbReviews.length})` }] : []),
        ]}
      />
      <TabPanel id="site" value={tab} prefix="reviews" className="pt-6">
        {site.length === 0 ? (
          <EmptyState title="No Reelhouse reviews yet." body={`Be the first to review ${title}.`}>
            <Button onClick={() => setSheet({ open: true })}>Write a review</Button>
          </EmptyState>
        ) : (
          <ul className="grid gap-5 lg:grid-cols-2">
            <AnimatePresence initial={false}>
              {site.map((r) => (
                <m.li
                  key={r.id}
                  layout={!reduced}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-modal border-line bg-seat border p-5"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar avatar={r.avatar} name={r.profile_name} size={36} decorative />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.profile_name}</p>
                      <p className="text-dim text-[0.75rem]">
                        {dateFmt.format(Date.parse(r.created_at))}
                        {r.updated_at !== r.created_at && ' · edited'}
                      </p>
                    </div>
                  </div>
                  <ExpandableText text={r.body} spoiler={r.spoiler} />
                  <div className="mt-3 flex items-center gap-1">
                    <HeartBurst
                      on={r.liked}
                      count={r.likes}
                      label={r.liked ? 'Unlike review' : 'Like review'}
                      onClick={() => like.mutate({ id: r.id, on: !r.liked })}
                    />
                    {r.profile_id === profileId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSheet({ open: true, editing: r })}
                          className="rounded-pill text-small text-dim hover:text-reel ml-auto flex min-h-9 items-center gap-1 px-2"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove.mutate(r.id)}
                          className="rounded-pill text-small text-dim hover:text-danger flex min-h-9 items-center gap-1 px-2"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" /> Delete
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => report.mutate({ id: r.id, reason: 'Inappropriate' })}
                        className="rounded-pill text-small text-dim hover:text-amber ml-auto flex min-h-9 items-center gap-1 px-2"
                      >
                        <Flag className="size-3.5" aria-hidden="true" /> Report
                      </button>
                    )}
                  </div>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </TabPanel>
      <TabPanel id="tmdb" value={tab} prefix="reviews" className="pt-6">
        {tmdbReviews.length === 0 ? (
          <EmptyState
            title="No TMDB reviews for this title yet."
            action={{ href: 'https://www.themoviedb.org/', label: 'Visit TMDB' }}
          />
        ) : (
          <ul className="grid gap-5 lg:grid-cols-2">
            {tmdbReviews.slice(0, 10).map((r) => (
              <li key={r.id} className="rounded-modal border-line bg-seat border p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold">{r.author}</p>
                  {r.author_details?.rating ? (
                    <StarRating
                      value={Math.round(r.author_details.rating)}
                      readOnly
                      size="sm"
                      label={`${r.author}'s rating`}
                    />
                  ) : null}
                </div>
                <ExpandableText text={r.content} />
                <p className="text-dim mt-3 text-[0.75rem]">
                  {dateFmt.format(Date.parse(r.created_at))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>
      {sheetUsed && (
        <ReviewSheet
          movieId={movieId}
          title={title}
          open={sheet.open}
          editing={sheet.editing}
          onClose={() => setSheet({ open: false })}
        />
      )}
    </section>
  );
}
