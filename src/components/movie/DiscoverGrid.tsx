'use client';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  SORTS,
  activeFilterCount,
  discoverQuery,
  filtersToSearch,
  parseFilters,
  type Filters,
} from '@/lib/filters';
import { qk } from '@/lib/tmdb/query-keys';
import type { Movie, Paginated } from '@/lib/tmdb/types';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/layout/EmptyState';
import { MovieGrid } from './MovieGrid';
import { FilterPanel } from './FilterPanel';

interface DiscoverGridProps {
  fixed: { genre?: number; lang?: string };
  initial?: Paginated<Movie>;
  label: string;
}

/**
 * Browse grid (spec 26): sort chips, filter drawer, infinite scroll, Flip reorder on change.
 * Filters are mirrored into the URL (shareable) without a server round-trip.
 */
export function DiscoverGrid({ fixed, initial, label }: DiscoverGridProps) {
  const sp = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(new URLSearchParams(sp.toString())),
  );
  const [drawer, setDrawer] = useState(false);

  const update = useCallback((f: Filters) => {
    setFilters(f);
    const next = filtersToSearch(f, new URLSearchParams(window.location.search));
    const qs = next.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, []);

  const isDefault = filtersToSearch(filters).toString() === '';
  const paramsKey = useMemo(() => discoverQuery(filters, fixed, 1).toString(), [filters, fixed]);

  const q = useInfiniteQuery({
    queryKey: qk.discover({ fixed, paramsKey }),
    queryFn: async ({ pageParam, signal }) => {
      const res = await fetch(
        `/api/tmdb/discover/movie?${discoverQuery(filters, fixed, pageParam).toString()}&with_meta=1`,
        { signal },
      );
      if (!res.ok) throw new Error('discover');
      return (await res.json()) as Paginated<Movie>;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 25) ? last.page + 1 : undefined,
    initialData: isDefault && initial ? { pages: [initial], pageParams: [1] } : undefined,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60_000,
  });

  const movies = useMemo(() => {
    const seen = new Set<number>();
    return (q.data?.pages.flatMap((p) => p.results) ?? []).filter((m) =>
      seen.has(m.id) ? false : (seen.add(m.id), true),
    );
  }, [q.data]);
  const count = activeFilterCount(filters);
  const total = q.data?.pages[0]?.total_results ?? 0;

  return (
    <section aria-label={label} className="px-gutter">
      <div className="-mx-gutter bg-void/80 px-gutter sticky top-(--nav-height) z-20 mb-6 flex flex-wrap items-center gap-2 py-3 backdrop-blur-lg">
        <div role="group" aria-label="Sort by" className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <Pill
              key={s.id}
              selected={filters.sort === s.id}
              onToggle={() => update({ ...filters, sort: s.id })}
            >
              {s.label}
            </Pill>
          ))}
        </div>
        <Button
          variant="secondary"
          icon={<SlidersHorizontal />}
          onClick={() => setDrawer(true)}
          className="ml-auto"
          magnetic={false}
          aria-haspopup="dialog"
        >
          {count ? `Filters (${count})` : 'Filters'}
        </Button>
        <p className="text-small text-dim w-full" aria-live="polite">
          {q.isFetching && !q.isFetchingNextPage
            ? 'Updating…'
            : total
              ? `${total.toLocaleString()} titles`
              : ''}
        </p>
      </div>

      {q.isPending ? (
        <GridSkeleton count={18} />
      ) : movies.length === 0 ? (
        <EmptyState
          title="No titles match these filters."
          body="Widen the year range or lower the minimum rating."
        >
          <Button
            variant="secondary"
            onClick={() =>
              update({
                ...filters,
                from: 1950,
                to: new Date().getFullYear() + 1,
                rating: 0,
                runtimeMin: 0,
                runtimeMax: 240,
                lang: null,
                genre: null,
              })
            }
          >
            Reset filters
          </Button>
        </EmptyState>
      ) : (
        <MovieGrid
          label={label}
          movies={movies}
          hasMore={q.hasNextPage}
          loadingMore={q.isFetchingNextPage}
          onEndReached={() => !q.isFetchingNextPage && void q.fetchNextPage()}
        />
      )}

      <Modal
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Filters"
        variant="sheet"
        className="md:rounded-l-modal md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:rounded-none"
      >
        <div className="mt-6">
          <FilterPanel
            value={filters}
            onChange={update}
            showLanguage={!fixed.lang}
            showGenre={!fixed.genre}
            onDone={() => setDrawer(false)}
          />
        </div>
      </Modal>
    </section>
  );
}
