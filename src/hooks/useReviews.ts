'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/tmdb/query-keys';
import type { ReviewInput, SiteReview } from '@/lib/data/types';
import { toast } from '@/stores/toast';
import { useSession } from './useSession';

export function useSiteReviews(movieId: number) {
  const { repo, profileId, ready } = useSession();
  return useQuery({
    queryKey: [...qk.siteReviews(movieId), profileId, repo.kind],
    queryFn: () => repo.reviews.list(movieId, profileId),
    enabled: ready,
  });
}

export function useReviewMutations(movieId: number) {
  const { repo, profileId, profile } = useSession();
  const qc = useQueryClient();
  const key = [...qk.siteReviews(movieId), profileId, repo.kind];
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.siteReviews(movieId) });

  const save = useMutation({
    mutationFn: (input: ReviewInput) => repo.reviews.upsert(profile, profileId, input),
    onSuccess: () => toast.success('Review posted'),
    onSettled: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => repo.reviews.remove(profileId, id),
    onMutate: (id) => {
      const prev = qc.getQueryData<SiteReview[]>(key) ?? [];
      qc.setQueryData(
        key,
        prev.filter((r) => r.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
      toast.error('Couldn’t delete the review.');
    },
    onSettled: invalidate,
  });
  const like = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => repo.reviews.like(profileId, id, on),
    onMutate: ({ id, on }) => {
      const prev = qc.getQueryData<SiteReview[]>(key) ?? [];
      qc.setQueryData(
        key,
        prev.map((r) =>
          r.id === id ? { ...r, liked: on, likes: Math.max(0, r.likes + (on ? 1 : -1)) } : r,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
  });
  const report = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      repo.reviews.report(profileId, id, reason),
    onSuccess: () => toast.info('Thanks — the review was reported for moderation.'),
  });
  return { save, remove, like, report };
}
