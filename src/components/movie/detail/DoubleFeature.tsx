'use client';

import { useRef, useState } from 'react';
import { ListPlus, Plus } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import type { Movie } from '@/lib/tmdb/types';
import type { MovieSnapshot } from '@/lib/data/types';
import { SIZES } from '@/lib/tmdb/images';
import { toSnapshot } from '@/lib/snapshot';
import { formatRuntime } from '@/lib/utils';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { useToggleWatchlist, useWatchlist } from '@/hooks/useWatchlist';
import { toast } from '@/stores/toast';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Button } from '@/components/ui/Button';
import { TransitionLink } from '@/components/layout/TransitionLink';

interface Props {
  movie: MovieSnapshot & { runtime: number | null };
  companion: Movie & { runtime: number | null };
  reason: string;
}

/** "Make it a double feature": this film + a companion, posters sliding together on scroll. */
export function DoubleFeature({ movie, companion, reason }: Props) {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  const list = useWatchlist();
  const toggle = useToggleWatchlist();
  const [busy, setBusy] = useState(false);
  const total = (movie.runtime ?? 0) + (companion.runtime ?? 0);
  const pair = [movie, toSnapshot(companion)];
  const missing = pair.filter((p) => !(list.data ?? []).some((w) => w.movie_id === p.movie_id));

  useGSAP(
    () => {
      if (reduced || !root.current) return;
      const trigger = { trigger: root.current, start: 'top 85%', end: 'top 35%', scrub: 0.6 };
      gsap.fromTo(
        '[data-df-a]',
        { x: -70, rotate: -12 },
        { x: 0, rotate: -6, ease: 'none', scrollTrigger: trigger },
      );
      gsap.fromTo(
        '[data-df-b]',
        { x: 70, rotate: 12 },
        { x: 0, rotate: 6, ease: 'none', scrollTrigger: trigger },
      );
      gsap.fromTo(
        '[data-df-plus]',
        { scale: 0 },
        { scale: 1, ease: 'none', scrollTrigger: trigger },
      );
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section ref={root} aria-labelledby="double-h" className="px-gutter py-12">
      <div className="rounded-modal border-line bg-seat lit-edge grid items-center gap-10 overflow-hidden border p-6 md:grid-cols-[minmax(260px,380px)_1fr] md:p-10">
        <div
          className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center md:h-72"
          aria-hidden="true"
        >
          <div
            data-df-a
            className="rounded-poster absolute left-[8%] aspect-[2/3] w-[46%] -rotate-6 overflow-hidden shadow-[0_24px_50px_rgb(0_0_0/0.55)]"
          >
            <TmdbImage
              path={movie.poster_path}
              kind="poster"
              alt=""
              sizes={SIZES.card}
              fallbackTitle={movie.title}
            />
          </div>
          <div
            data-df-b
            className="rounded-poster absolute right-[8%] aspect-[2/3] w-[46%] rotate-6 overflow-hidden shadow-[0_24px_50px_rgb(0_0_0/0.55)]"
          >
            <TmdbImage
              path={companion.poster_path}
              kind="poster"
              alt=""
              sizes={SIZES.card}
              fallbackTitle={companion.title}
            />
          </div>
          <span
            data-df-plus
            className="bg-violet text-void relative z-[1] grid size-12 place-items-center rounded-full shadow-lg"
          >
            <Plus className="size-6" />
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <p className="meta-caps text-dim">Make it a double feature</p>
          <h2 id="double-h" className="font-display text-h2">
            {movie.title} <span className="text-violet">+</span>{' '}
            <TransitionLink
              href={`/movie/${companion.id}`}
              className="hover:text-cyan decoration-line underline underline-offset-8"
            >
              {companion.title}
            </TransitionLink>
          </h2>
          <p className="text-reel/85">
            {reason}
            {total > 0 && (
              <>
                {' '}
                · <span className="font-semibold">{formatRuntime(total)}</span> of cinema
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              icon={<ListPlus />}
              loading={busy}
              disabled={missing.length === 0}
              onClick={async () => {
                setBusy(true);
                for (const m of missing)
                  await toggle.mutateAsync({ movie: m, add: true }).catch(() => {});
                setBusy(false);
                toast.success('Double feature saved to your list.');
              }}
            >
              {missing.length === 0 ? 'Both in your list' : 'Add both to my list'}
            </Button>
            <Button href={`/movie/${companion.id}`} variant="secondary" magnetic={false}>
              About {companion.title}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
