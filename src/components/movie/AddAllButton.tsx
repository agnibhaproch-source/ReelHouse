'use client';

import { ListPlus } from 'lucide-react';
import { useState } from 'react';
import type { Movie } from '@/lib/tmdb/types';
import { toSnapshot } from '@/lib/snapshot';
import { useToggleWatchlist, useWatchlist } from '@/hooks/useWatchlist';
import { toast } from '@/stores/toast';
import { Button } from '@/components/ui/Button';

/** Copies a shared list's films into the viewer's own list (skipping ones already there). */
export function AddAllButton({ movies }: { movies: Movie[] }) {
  const { data } = useWatchlist();
  const toggle = useToggleWatchlist();
  const [busy, setBusy] = useState(false);
  const have = new Set((data ?? []).map((w) => w.movie_id));
  const missing = movies.filter((m) => !have.has(m.id));
  return (
    <Button
      icon={<ListPlus />}
      loading={busy}
      disabled={missing.length === 0}
      onClick={async () => {
        setBusy(true);
        for (const m of missing)
          await toggle.mutateAsync({ movie: toSnapshot(m), add: true }).catch(() => {});
        setBusy(false);
        toast.success(
          `Added ${missing.length} film${missing.length === 1 ? '' : 's'} to your list.`,
        );
      }}
    >
      {missing.length === 0 ? 'All in your list' : `Add ${missing.length} to my list`}
    </Button>
  );
}
