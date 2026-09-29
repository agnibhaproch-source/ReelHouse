'use client';

import { Reorder, useDragControls } from 'motion/react';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
import { useReorderWatchlist, useToggleWatchlist, useWatchlist } from '@/hooks/useWatchlist';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { fromSnapshot } from '@/lib/snapshot';
import type { WatchItem } from '@/lib/data/types';
import { yearOf } from '@/lib/utils';
import { SPRING } from '@/lib/tokens';
import { Pill } from '@/components/ui/Pill';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/layout/EmptyState';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { MovieGrid } from './MovieGrid';
import { Row } from './Row';

type Sort = 'custom' | 'added' | 'title' | 'rating';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'added', label: 'Recently added' },
  { id: 'title', label: 'Title' },
  { id: 'rating', label: 'Rating' },
  { id: 'custom', label: 'My order' },
];

function ReorderRow({ item, index, count, onMove, onRemove }: { item: WatchItem; index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} transition={SPRING} className="flex items-center gap-4 rounded-modal border border-line bg-seat p-3" whileDrag={{ scale: 1.02, boxShadow: '0 20px 50px rgb(0 0 0 / 0.5)' }}>
      <button type="button" aria-label={`Drag to reorder ${item.title}`} onPointerDown={(e) => controls.start(e)} className="grid size-11 cursor-grab touch-none place-items-center text-dim active:cursor-grabbing" data-cursor="drag">
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      <span className="w-6 text-right font-display text-h3 text-dim tabular-nums">{index + 1}</span>
      <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[4px] bg-seat">
        <TmdbImage path={item.poster_path} kind="poster" alt="" sizes="56px" />
      </span>
      <TransitionLink href={`/movie/${item.movie_id}`} className="min-w-0 flex-1">
        <span className="block truncate font-semibold hover:text-cyan">{item.title}</span>
        <span className="text-small text-dim">{yearOf(item.release_date)}</span>
      </TransitionLink>
      <div className="flex items-center">
        <button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)} className="grid size-11 place-items-center rounded-full text-dim hover:text-reel disabled:opacity-30">
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label={`Move ${item.title} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)} className="grid size-11 place-items-center rounded-full text-dim hover:text-reel disabled:opacity-30">
          <ArrowDown className="size-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label={`Remove ${item.title} from my list`} onClick={onRemove} className="grid size-11 place-items-center rounded-full text-dim hover:text-danger">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Reorder.Item>
  );
}

/** My list (spec 52): sortable grid, custom drag order with smooth reflow, Flip removal + undo. */
export function MyList() {
  const { data, isPending } = useWatchlist();
  const toggle = useToggleWatchlist();
  const reorder = useReorderWatchlist();
  const { reduced } = useMotionPrefs();
  const [sort, setSort] = useState<Sort>('added');
  const [order, setOrder] = useState<WatchItem[] | null>(null);

  const items = useMemo(() => {
    const list = [...(data ?? [])];
    if (sort === 'added') list.sort((a, b) => b.added_at.localeCompare(a.added_at));
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'rating') list.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    if (sort === 'custom') list.sort((a, b) => a.position - b.position);
    return list;
  }, [data, sort]);

  const custom = order ?? items;
  const commit = (next: WatchItem[]) => {
    setOrder(null);
    reorder.mutate(next.map((w) => w.movie_id));
  };
  const move = (from: number, to: number) => {
    const next = [...custom];
    const [x] = next.splice(from, 1);
    if (!x) return;
    next.splice(to, 0, x);
    commit(next);
  };

  return (
    <div className="px-gutter pt-32 pb-10">
      <SplitHeading as="h1" by="chars" trigger="mount" className="mb-8 font-display text-h1">
        My list
      </SplitHeading>
      {isPending ? (
        <GridSkeleton count={12} />
      ) : !items.length ? (
        <>
          <EmptyState title="Your list is empty." body="Add movies with the + button on any title." action={{ href: '/', label: 'Find something to watch' }} />
          <Row rowKey="trending" title="Trending now" source={{ path: 'trending/movie/week' }} />
        </>
      ) : (
        <>
          <div role="group" aria-label="Sort my list" className="mb-6 flex flex-wrap items-center gap-2">
            {SORTS.map((s) => (
              <Pill key={s.id} selected={sort === s.id} onToggle={() => setSort(s.id)}>
                {s.label}
              </Pill>
            ))}
            <span className="ml-auto text-small text-dim">
              {items.length} title{items.length === 1 ? '' : 's'}
            </span>
          </div>
          {sort === 'custom' ? (
            <Reorder.Group axis="y" values={custom} onReorder={setOrder} className="flex max-w-3xl flex-col gap-3" layoutScroll={!reduced} onPointerUp={() => order && commit(order)}>
              {custom.map((w, i) => (
                <ReorderRow key={w.movie_id} item={w} index={i} count={custom.length} onMove={move} onRemove={() => toggle.mutate({ movie: w, add: false })} />
              ))}
            </Reorder.Group>
          ) : (
            <MovieGrid label="My list" movies={items.map(fromSnapshot)} onRemove={(m) => {
              const w = items.find((x) => x.movie_id === m.id);
              if (w) toggle.mutate({ movie: w, add: false });
            }} />
          )}
        </>
      )}
    </div>
  );
}
