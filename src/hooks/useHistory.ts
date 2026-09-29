'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/tmdb/query-keys';
import type { HistoryItem, HistoryKind, MovieSnapshot } from '@/lib/data/types';
import { useSession } from './useSession';

export function useHistory() {
  const { repo, profileId, ready } = useSession();
  return useQuery({
    queryKey: [...qk.history(profileId), repo.kind],
    queryFn: () => repo.history.list(profileId),
    enabled: ready,
  });
}

export function useRecordHistory() {
  const { repo, profileId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ movie, kind, progress }: { movie: MovieSnapshot; kind: HistoryKind; progress?: number }) =>
      repo.history.record(profileId, movie, kind, progress),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.history(profileId) }),
  });
}

export function useRemoveHistory() {
  const { repo, profileId } = useSession();
  const qc = useQueryClient();
  const key = [...qk.history(profileId), repo.kind];
  return useMutation({
    mutationFn: (movieId: number) => repo.history.remove(profileId, movieId),
    onMutate: (movieId) => {
      const prev = qc.getQueryData<HistoryItem[]>(key) ?? [];
      qc.setQueryData(key, prev.filter((h) => h.movie_id !== movieId));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
  });
}

export function useClearHistory() {
  const { repo, profileId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => repo.history.clear(profileId),
    onSuccess: () => qc.setQueryData([...qk.history(profileId), repo.kind], []),
  });
}
