'use client';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { genreById } from '@/lib/tmdb/genres';
import { languageName } from '@/lib/tmdb/languages';
import { qk } from '@/lib/tmdb/query-keys';
import type { Movie, Paginated } from '@/lib/tmdb/types';
import { track } from '@/lib/analytics';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/layout/EmptyState';
import { MovieGrid } from './MovieGrid';

const RATINGS = [6, 7, 8] as const;

function useDebounced<T>(v: T, ms: number) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** /search?q= (spec 25): results grid, chip filters (genre, decade, language, rating) in the URL, infinite scroll, Flip. */
export function SearchResults() {
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const term = useDebounced(q.trim(), 300);
  const genre = sp.get('genre') ? Number(sp.get('genre')) : null;
  const decade = sp.get('decade') ? Number(sp.get('decade')) : null;
  const lang = sp.get('lang');
  const rating = sp.get('rating') ? Number(sp.get('rating')) : null;

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    router.replace(`/search?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const cur = new URLSearchParams(window.location.search).get('q') ?? '';
    if (term !== cur) {
      const next = new URLSearchParams(window.location.search);
      if (term) next.set('q', term);
      else next.delete('q');
      router.replace(`/search?${next.toString()}`, { scroll: false });
      if (term) track('search_submit');
    }
  }, [term, router]);

  const query = useInfiniteQuery({
    queryKey: [...qk.search(term), 'page'],
    queryFn: async ({ pageParam, signal }) => {
      const res = await fetch(`/api/tmdb/search/movie?query=${encodeURIComponent(term)}&page=${pageParam}&with_meta=1`, { signal });
      if (!res.ok) throw new Error('search');
      return (await res.json()) as Paginated<Movie>;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < Math.min(last.total_pages, 20) ? last.page + 1 : undefined),
    enabled: term.length > 1,
    placeholderData: keepPreviousData,
  });

  const all = useMemo(() => {
    const seen = new Set<number>();
    return (query.data?.pages.flatMap((p) => p.results) ?? []).filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }, [query.data]);

  const facets = useMemo(() => {
    const count = <K,>(keys: K[]) => {
      const map = new Map<K, number>();
      keys.forEach((k) => map.set(k, (map.get(k) ?? 0) + 1));
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };
    return {
      genres: count(all.flatMap((m) => m.genre_ids)).slice(0, 8).map(([k]) => k),
      decades: count(all.map((m) => (m.release_date ? Math.floor(Number(m.release_date.slice(0, 4)) / 10) * 10 : null)).filter((d): d is number => d !== null)).slice(0, 6).map(([k]) => k).sort((a, b) => b - a),
      langs: count(all.map((m) => m.original_language)).slice(0, 6).map(([k]) => k),
    };
  }, [all]);

  const movies = all.filter(
    (m) =>
      (!genre || m.genre_ids.includes(genre)) &&
      (!decade || (m.release_date && Math.floor(Number(m.release_date.slice(0, 4)) / 10) * 10 === decade)) &&
      (!lang || m.original_language === lang) &&
      (!rating || m.vote_average >= rating),
  );

  return (
    <div className="px-gutter pt-32 pb-10">
      <h1 className="mb-6 font-display text-h1">{term ? <>Results for “{term}”</> : 'Search'}</h1>
      <Input variant="search" type="search" label="Search movies" placeholder="Search for a title, actor or director" value={q} onChange={(e) => setQ(e.currentTarget.value)} icon={<Search />} className="mb-6 max-w-2xl" autoFocus={!q} />

      {all.length > 0 && (
        <div className="mb-8 flex flex-col gap-3">
          <ChipRow label="Genre">
            {facets.genres.map((g) => (
              <Pill key={g} size="sm" selected={genre === g} onToggle={(on) => setParam({ genre: on ? String(g) : null })}>
                {genreById(g)?.name ?? g}
              </Pill>
            ))}
          </ChipRow>
          <ChipRow label="Decade">
            {facets.decades.map((d) => (
              <Pill key={d} size="sm" selected={decade === d} onToggle={(on) => setParam({ decade: on ? String(d) : null })}>
                {d}s
              </Pill>
            ))}
          </ChipRow>
          <ChipRow label="Language">
            {facets.langs.map((l) => (
              <Pill key={l} size="sm" selected={lang === l} onToggle={(on) => setParam({ lang: on ? l : null })}>
                {languageName(l)}
              </Pill>
            ))}
          </ChipRow>
          <ChipRow label="Rating">
            {RATINGS.map((r) => (
              <Pill key={r} size="sm" selected={rating === r} onToggle={(on) => setParam({ rating: on ? String(r) : null })}>
                {r}+
              </Pill>
            ))}
          </ChipRow>
        </div>
      )}

      {term.length < 2 ? (
        <EmptyState title="Search for a title, actor, or director." body="Tip: press / anywhere to open quick search." />
      ) : query.isPending ? (
        <GridSkeleton count={12} />
      ) : movies.length === 0 ? (
        <EmptyState title={`No matches for “${term}”.`} body="Try a title, actor, or director — or clear a filter." action={{ href: '/browse', label: 'Browse genres' }} />
      ) : (
        <MovieGrid label={`Search results for ${term}`} movies={movies} hasMore={query.hasNextPage} loadingMore={query.isFetchingNextPage} onEndReached={() => !query.isFetchingNextPage && void query.fetchNextPage()} />
      )}
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-small text-dim">{label}</span>
      {children}
    </div>
  );
}
