'use client';

import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { qk } from '@/lib/tmdb/query-keys';
import type { MovieDetail } from '@/lib/tmdb/types';

async function fetchDetail(id: number): Promise<MovieDetail> {
  const res = await fetch(`/api/tmdb/movie/${id}`);
  if (!res.ok) throw new Error(`detail ${res.status}`);
  return (await res.json()) as MovieDetail;
}

const options = (id: number) => ({
  queryKey: qk.movie(id),
  queryFn: () => fetchDetail(id),
  staleTime: 24 * 60 * 60_000,
});

export function useMovieDetail(id: number | null) {
  return useQuery({ ...options(id ?? 0), enabled: id !== null && id > 0 });
}

export function prefetchMovie(qc: QueryClient, id: number): void {
  void qc.prefetchQuery(options(id));
}

/** Prefetch detail data on hover intent (spec 15: ≥150ms). */
export function usePrefetchMovie() {
  const qc = useQueryClient();
  return useCallback((id: number) => prefetchMovie(qc, id), [qc]);
}
