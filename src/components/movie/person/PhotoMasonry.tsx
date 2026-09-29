'use client';

import { useState } from 'react';
import type { TmdbImage as TmdbImageT } from '@/lib/tmdb/types';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Reveal } from '@/components/motion/Reveal';
import { Lightbox } from '../detail/Lightbox';

/** Photo gallery masonry (CSS columns) with lightbox (spec 27). */
export function PhotoMasonry({ photos, name }: { photos: TmdbImageT[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length < 2) return null;
  return (
    <section aria-labelledby="photos-h" className="px-gutter py-12">
      <h2 id="photos-h" className="font-display text-h2 mb-6">
        Photos
      </h2>
      <Reveal as="ul" stagger className="columns-2 gap-4 sm:columns-3 lg:columns-5">
        {photos.map((p, i) => (
          <li key={p.file_path} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpen(i)}
              data-cursor="play"
              data-cursor-label="View"
              aria-label={`View photo ${i + 1} of ${name}`}
              className="group/ph rounded-poster bg-seat relative block w-full overflow-hidden"
              style={{ aspectRatio: `${p.aspect_ratio || p.width / p.height}` }}
            >
              <TmdbImage
                path={p.file_path}
                kind="profile"
                alt=""
                sizes="(max-width: 640px) 50vw, 20vw"
                className="duration-slow ease-reel transition-transform group-hover/ph:scale-105"
              />
            </button>
          </li>
        ))}
      </Reveal>
      <Lightbox images={photos} index={open} onIndex={setOpen} title={name} kind="profile" />
    </section>
  );
}
