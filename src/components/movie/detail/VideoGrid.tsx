'use client';

import { Play } from 'lucide-react';
import type { MovieDetail, Video } from '@/lib/tmdb/types';
import { youtubeThumb } from '@/lib/tmdb/videos';
import { toSnapshot } from '@/lib/snapshot';
import { useTrailerStore } from '@/stores/trailer';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { Reveal } from '@/components/motion/Reveal';

/** Trailers & clips (spec 24.4): thumbnail zoom 1.1 + pulsing play ring on hover; opens the player. */
export function VideoGrid({ videos, movie, color }: { videos: Video[]; movie: MovieDetail; color: string }) {
  const open = useTrailerStore((s) => s.open);
  if (!videos.length) return null;
  const list = videos.slice(0, 8);
  return (
    <section aria-labelledby="videos-h" className="px-gutter py-12">
      <SplitHeading id="videos-h" className="mb-6 font-display text-h2">
        Trailers &amp; clips
      </SplitHeading>
      <Reveal as="ul" stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((v, i) => (
          <li key={v.id}>
            <button
              type="button"
              data-cursor="play"
              data-cursor-label="Play"
              aria-label={`Play ${v.name} (${v.type})`}
              onClick={(e) => open(toSnapshot(movie), { videos: [...list.slice(i), ...list.slice(0, i)], origin: e.currentTarget.getBoundingClientRect(), color })}
              className="group/vid block w-full text-left"
            >
              <span className="relative block aspect-video overflow-hidden rounded-poster bg-seat">
                {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
                <img src={youtubeThumb(v.key)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-slow ease-reel group-hover/vid:scale-110 group-focus-visible/vid:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
                <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-reel/90 text-ink">
                  <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-reel opacity-0 group-hover/vid:animate-[pulse-ring_1.2s_var(--ease-reel)_infinite] group-hover/vid:opacity-100" />
                  <Play className="size-6 translate-x-0.5" fill="currentColor" aria-hidden="true" />
                </span>
              </span>
              <span className="mt-2 block truncate text-small font-semibold">{v.name}</span>
              <span className="block text-[0.75rem] text-dim">{v.type}</span>
            </button>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
