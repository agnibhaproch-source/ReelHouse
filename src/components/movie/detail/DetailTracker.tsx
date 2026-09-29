'use client';

import { useEffect, useRef } from 'react';
import type { MovieDetail } from '@/lib/tmdb/types';
import { KIDS_EXCLUDED_GENRES } from '@/lib/tmdb/genres';
import { toSnapshot } from '@/lib/snapshot';
import { useRecordHistory } from '@/hooks/useHistory';
import { useSession } from '@/hooks/useSession';
import { EmptyState } from '@/components/layout/EmptyState';

/** Records the view in history (spec 56) and guards kids profiles (spec 51). */
export function DetailTracker({ movie, genreIds }: { movie: MovieDetail; genreIds: number[] }) {
  const record = useRecordHistory();
  const { profile, ready } = useSession();
  const done = useRef(false);
  const blocked =
    Boolean(profile?.is_kids) &&
    (movie.adult || genreIds.some((g) => (KIDS_EXCLUDED_GENRES as readonly number[]).includes(g)));

  useEffect(() => {
    if (!ready || done.current || blocked) return;
    done.current = true;
    record.mutate({ movie: toSnapshot(movie), kind: 'view' });
  }, [ready, blocked, movie, record]);

  if (!blocked) return null;
  return (
    <div className="bg-void/97 fixed inset-0 z-(--z-overlay) grid place-items-center backdrop-blur-xl">
      <EmptyState
        title="This title isn’t available on kids profiles."
        body="Switch profiles to watch grown-up titles."
        action={{ href: '/profiles', label: 'Switch profile' }}
      />
    </div>
  );
}
