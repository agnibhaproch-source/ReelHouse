'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/tmdb/query-keys';
import { toast } from '@/stores/toast';
import { useSession } from './useSession';

export function useRatings() {
  const { repo, profileId, ready } = useSession();
  return useQuery({
    queryKey: [...qk.ratings(profileId), repo.kind],
    queryFn: () => repo.ratings.all(profileId),
    enabled: ready,
  });
}

export function useMyRating(movieId: number): number | null {
  const { data } = useRatings();
  return data?.[movieId] ?? null;
}

export function useSiteAverage(movieId: number) {
  const { repo, ready } = useSession();
  return useQuery({
    queryKey: [...qk.siteAverage(movieId), repo.kind],
    queryFn: () => repo.ratings.average(movieId),
    enabled: ready,
  });
}

/** Optimistic rating (score 1–10, or null to clear). */
export function useSetRating(movieId: number) {
  const { repo, profileId } = useSession();
  const qc = useQueryClient();
  const key = [...qk.ratings(profileId), repo.kind];
  return useMutation({
    mutationFn: (score: number | null) => repo.ratings.set(profileId, movieId, score),
    onMutate: (score) => {
      const prev = qc.getQueryData<Record<number, number>>(key) ?? {};
      const next = { ...prev };
      if (score === null) delete next[movieId];
      else next[movieId] = score;
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      toast.error('Couldn’t save your rating. Try again.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.siteAverage(movieId) }),
  });
}
