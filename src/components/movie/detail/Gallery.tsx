'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import type { TmdbImage as TmdbImageT } from '@/lib/tmdb/types';
import { SIZES, tmdbImage } from '@/lib/tmdb/images';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { HorizontalScene } from '@/components/motion/HorizontalScene';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Lightbox } from './Lightbox';

const GalleryGL = dynamic(() => import('@/components/gl/GalleryGL').then((m) => m.GalleryGL), {
  ssr: false,
});

/**
 * Gallery (spec 24.8): backdrops in a pinned horizontal scene (vertical scroll → horizontal),
 * pin released below 768px. Hover zooms inside the mask; cursor "View"; click opens a lightbox.
 * With WebGL on, planes bend with scroll velocity and ripple under the pointer (spec 37).
 */
export function Gallery({ backdrops, title }: { backdrops: TmdbImageT[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const scope = useRef<HTMLDivElement>(null);
  const { webglEnabled, finePointer } = useMotionPrefs();
  if (backdrops.length < 2) return null;
  return (
    <div ref={scope}>
      <div className="px-gutter pt-12">
        <h2 id="gallery-h" className="font-display text-h2">
          Gallery
        </h2>
      </div>
      <HorizontalScene
        label={`${title} gallery`}
        className="py-10 md:flex md:h-svh md:items-center"
      >
        {backdrops.map((b, i) => (
          <button
            key={b.file_path}
            type="button"
            onClick={() => setOpen(i)}
            data-cursor="play"
            data-cursor-label="View"
            data-gl-src={tmdbImage(b.file_path, 'w780') ?? undefined}
            aria-label={`View image ${i + 1} of ${backdrops.length}`}
            className="group/img rounded-poster bg-seat relative aspect-video w-[80vw] shrink-0 snap-center overflow-hidden md:w-[46vw]"
          >
            <TmdbImage
              path={b.file_path}
              kind="backdrop"
              alt=""
              sizes={SIZES.backdropThumb}
              className="duration-slow ease-reel transition-transform group-hover/img:scale-105 group-focus-visible/img:scale-105"
            />
          </button>
        ))}
      </HorizontalScene>
      {webglEnabled && finePointer && <GalleryGL scope={scope} />}
      <Lightbox images={backdrops} index={open} onIndex={setOpen} title={title} />
    </div>
  );
}
