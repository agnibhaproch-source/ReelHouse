'use client';

import { useState } from 'react';
import type { TmdbImage as TmdbImageT } from '@/lib/tmdb/types';
import { SIZES } from '@/lib/tmdb/images';
import { HorizontalScene } from '@/components/motion/HorizontalScene';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Lightbox } from './Lightbox';

/**
 * Gallery (spec 24.8): backdrops in a pinned horizontal scene (vertical scroll → horizontal),
 * pin released below 768px. Hover zooms inside the mask; cursor "View"; click opens a lightbox.
 */
export function Gallery({ backdrops, title }: { backdrops: TmdbImageT[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (backdrops.length < 2) return null;
  return (
    <>
      <div className="px-gutter pt-12">
        <h2 id="gallery-h" className="font-display text-h2">
          Gallery
        </h2>
      </div>
      <HorizontalScene label={`${title} gallery`} className="py-10 md:flex md:h-svh md:items-center">
        {backdrops.map((b, i) => (
          <button
            key={b.file_path}
            type="button"
            onClick={() => setOpen(i)}
            data-cursor="play"
            data-cursor-label="View"
            aria-label={`View image ${i + 1} of ${backdrops.length}`}
            className="group/img relative aspect-video w-[80vw] shrink-0 snap-center overflow-hidden rounded-poster bg-seat md:w-[46vw]"
          >
            <TmdbImage path={b.file_path} kind="backdrop" alt="" sizes={SIZES.backdropThumb} className="transition-transform duration-slow ease-reel group-hover/img:scale-105 group-focus-visible/img:scale-105" />
          </button>
        ))}
      </HorizontalScene>
      <Lightbox images={backdrops} index={open} onIndex={setOpen} title={title} />
    </>
  );
}
