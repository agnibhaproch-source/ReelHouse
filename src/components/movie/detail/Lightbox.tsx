'use client';

import { AnimatePresence, m } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TmdbImage as TmdbImageT } from '@/lib/tmdb/types';
import { DUR, EASES } from '@/lib/tokens';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TmdbImage } from '@/components/ui/TmdbImage';

interface Props {
  images: TmdbImageT[];
  index: number | null;
  onIndex: (i: number | null) => void;
  title: string;
  kind?: 'backdrop' | 'profile';
}

/** Fullscreen lightbox with ←/→ keys, crossfading frames. */
export function Lightbox({ images, index, onIndex, title, kind = 'backdrop' }: Props) {
  const n = images.length;
  const img = index !== null ? images[index] : undefined;
  const go = (d: number) => index !== null && onIndex((index + d + n) % n);
  return (
    <Modal
      open={index !== null}
      onClose={() => onIndex(null)}
      title={`${title} — image ${(index ?? 0) + 1} of ${n}`}
      hideTitle
      variant="fullscreen"
      className="grid place-items-center p-4"
    >
      <div
        className="relative flex size-full items-center justify-center"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
      >
        <AnimatePresence mode="wait">
          {img && (
            <m.div
              key={img.file_path}
              className="relative max-h-[86svh] w-full max-w-[min(92vw,1600px)]"
              style={{ aspectRatio: `${img.aspect_ratio || img.width / img.height}` }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.base, ease: EASES.reel }}
            >
              <TmdbImage
                path={img.file_path}
                kind={kind}
                alt={`${title} still ${(index ?? 0) + 1}`}
                sizes="92vw"
                className="object-contain"
              />
            </m.div>
          )}
        </AnimatePresence>
        {n > 1 && (
          <>
            <Button
              variant="icon"
              label="Previous image"
              icon={<ChevronLeft />}
              iconAnim="nudge-left"
              onClick={() => go(-1)}
              className="bg-void/70 absolute left-2"
            />
            <Button
              variant="icon"
              label="Next image"
              icon={<ChevronRight />}
              iconAnim="nudge-right"
              onClick={() => go(1)}
              className="bg-void/70 absolute right-2"
              data-autofocus
            />
          </>
        )}
      </div>
    </Modal>
  );
}
