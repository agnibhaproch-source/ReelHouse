'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getRecommendationRows } from '@/app/actions/recommendations';
import { qk } from '@/lib/tmdb/query-keys';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useHistory } from '@/hooks/useHistory';
import { useRatings } from '@/hooks/useRatings';
import { useSession } from '@/hooks/useSession';
import { Row } from './Row';

/** "Because you liked X" rows (spec 53) — refresh once the list changes. */
export function RecommendationRows() {
  const { profileId } = useSession();
  const { data: list } = useWatchlist();
  const { data: history } = useHistory();
  const { data: ratings } = useRatings();

  const seeds = useMemo(() => {
    const liked = new Set(Object.entries(ratings ?? {}).filter(([, s]) => s >= 8).map(([id]) => Number(id)));
    const fromList = (list ?? []).map((w) => ({ movie_id: w.movie_id, title: w.title, genre_ids: w.genre_ids, original_language: w.original_language ?? undefined }));
    const fromLikes = (history ?? []).filter((h) => liked.has(h.movie_id)).map((h) => ({ movie_id: h.movie_id, title: h.title, genre_ids: h.genre_ids, original_language: h.original_language ?? undefined }));
    const seen = new Set<number>();
    return [...fromList, ...fromLikes].filter((s) => (seen.has(s.movie_id) ? false : (seen.add(s.movie_id), true)));
  }, [list, history, ratings]);

  const exclude = useMemo(() => (list ?? []).map((w) => w.movie_id), [list]);
  const seedKey = seeds.map((s) => s.movie_id).join(',');

  const { data: rows } = useQuery({
    queryKey: [...qk.recommendations(profileId), seedKey],
    queryFn: () => getRecommendationRows({ seeds, exclude }),
    enabled: seeds.length > 0,
    staleTime: 6 * 60 * 60_000,
  });

  if (!rows?.length) return null;
  return (
    <>
      {rows.map((r) => (
        <Row key={r.key} rowKey={`rec-${r.key}`} title={r.title} href={r.href} items={r.movies} />
      ))}
    </>
  );
}
