'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/tmdb/query-keys';
import type { MovieSnapshot, WatchItem } from '@/lib/data/types';
import { enqueue, isOffline } from '@/lib/data/queue';
import { toast } from '@/stores/toast';
import { play } from '@/lib/sound';
import { track } from '@/lib/analytics';
import { useSession } from './useSession';

export function useWatchlist() {
  const { repo, profileId, ready } = useSession();
  return useQuery({
    queryKey: [...qk.watchlist(profileId), repo.kind],
    queryFn: () => repo.watchlist.list(profileId),
    enabled: ready,
    staleTime: 60_000,
  });
}

export function useInWatchlist(movieId: number): boolean {
  const { data } = useWatchlist();
  return Boolean(data?.some((w) => w.movie_id === movieId));
}

type ToggleVars = { movie: MovieSnapshot; add: boolean; silent?: boolean };

/** Optimistic add/remove with rollback + undo toast (specs 34, 52). */
export function useToggleWatchlist() {
  const { repo, profileId } = useSession();
  const qc = useQueryClient();
  const key = [...qk.watchlist(profileId), repo.kind];

  const mutation = useMutation({
    mutationFn: async ({ movie, add }: ToggleVars) => {
      if (isOffline()) {
        enqueue(
          add
            ? { op: 'add', profileId, movie }
            : { op: 'remove', profileId, movieId: movie.movie_id },
        );
        return;
      }
      if (add) await repo.watchlist.add(profileId, movie);
      else await repo.watchlist.remove(profileId, movie.movie_id);
    },
    onMutate: async ({ movie, add, silent }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WatchItem[]>(key) ?? [];
      const next: WatchItem[] = add
        ? [
            {
              ...movie,
              added_at: new Date().toISOString(),
              position: (prev[0]?.position ?? 1) - 1,
            },
            ...prev.filter((w) => w.movie_id !== movie.movie_id),
          ]
        : prev.filter((w) => w.movie_id !== movie.movie_id);
      qc.setQueryData(key, next);
      if (add) {
        void play('pop');
        track('list_add', { movie_id: movie.movie_id });
        if ('vibrate' in navigator) navigator.vibrate?.(8);
      }
      if (!silent) {
        if (add)
          toast.success(
            isOffline()
              ? 'Added to my list — will sync when you’re back online'
              : 'Added to my list',
          );
        else
          toast.info(`Removed “${movie.title}”`, {
            action: {
              label: 'Undo',
              onAction: () => mutation.mutate({ movie, add: true, silent: true }),
            },
          });
      }
      return { prev };
    },
    onError: (_err, { add }, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      void play('error');
      toast.error(
        add
          ? 'Couldn’t add to your list. Try again.'
          : 'Couldn’t remove from your list. Try again.',
      );
    },
    onSettled: () => {
      if (!isOffline()) void qc.invalidateQueries({ queryKey: key });
    },
  });
  return mutation;
}

export function useReorderWatchlist() {
  const { repo, profileId } = useSession();
  const qc = useQueryClient();
  const key = [...qk.watchlist(profileId), repo.kind];
  return useMutation({
    mutationFn: (ids: number[]) => repo.watchlist.reorder(profileId, ids),
    onMutate: (ids) => {
      const prev = qc.getQueryData<WatchItem[]>(key) ?? [];
      const pos = new Map(ids.map((id, i) => [id, i]));
      qc.setQueryData(
        key,
        [...prev]
          .map((w) => ({ ...w, position: pos.get(w.movie_id) ?? w.position }))
          .sort((a, b) => a.position - b.position),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      toast.error('Couldn’t save the new order.');
    },
  });
}
