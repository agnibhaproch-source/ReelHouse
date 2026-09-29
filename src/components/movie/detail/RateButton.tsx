'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StarRating } from '@/components/ui/StarRating';
import { RatingRing } from '@/components/ui/RatingRing';
import { useMyRating, useSetRating, useSiteAverage } from '@/hooks/useRatings';

/** "Rate" opens a panel: 5 stars with half steps + site average vs TMDB average rings (spec 55). */
export function RateButton({ movieId, title, tmdbAverage }: { movieId: number; title: string; tmdbAverage: number }) {
  const [open, setOpen] = useState(false);
  const mine = useMyRating(movieId);
  const set = useSetRating(movieId);
  const { data: site } = useSiteAverage(movieId);
  return (
    <>
      <Button variant="secondary" size="lg" icon={<Star fill={mine ? 'currentColor' : 'none'} />} onClick={() => setOpen(true)} magnetic={false} className={mine ? 'text-amber' : undefined}>
        {mine ? `Rated ${mine / 2}/5` : 'Rate'}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Rate ${title}`} description="Tap or use arrow keys. Half stars allowed.">
        <div className="mt-4 flex flex-col items-center gap-8">
          <StarRating value={mine} onChange={(v) => set.mutate(v)} size="lg" label={`Your rating for ${title}`} />
          <div className="flex items-center gap-10">
            <figure className="flex flex-col items-center gap-2">
              <RatingRing value={site?.average ?? 0} size={72} color="violet" label="Reelhouse average" />
              <figcaption className="text-small text-dim">
                Reelhouse{site?.count ? ` · ${site.count}` : ''}
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-2">
              <RatingRing value={tmdbAverage} size={72} label="TMDB average" />
              <figcaption className="text-small text-dim">TMDB</figcaption>
            </figure>
          </div>
        </div>
      </Modal>
    </>
  );
}
