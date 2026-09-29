'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Search, X, ArrowRight } from 'lucide-react';
import { useUiStore } from '@/stores/ui';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLenis } from '@/hooks/useLenis';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { useTypewriter } from '@/components/motion/Typewriter';
import { qk } from '@/lib/tmdb/query-keys';
import { readJSON, writeJSON } from '@/lib/storage';
import { EASES, DUR, SPRING } from '@/lib/tokens';
import { cn, yearOf } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { requestTransition } from '@/lib/transition';
import type { Movie, MultiResults, Paginated, PersonResult } from '@/lib/tmdb/types';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { FilmReelSpinner } from '@/components/ui/FilmReelSpinner';

const RECENT_KEY = 'rh:recent-searches';
const EXAMPLES = ['Search for a title…', 'Try “Dune”', 'Try “Shah Rukh Khan”', 'Try “Parasite”', 'Try “Christopher Nolan”', 'Try “RRR”'] as const;

type Option =
  | { kind: 'movie'; id: string; movie: Movie }
  | { kind: 'person'; id: string; person: PersonResult }
  | { kind: 'recent'; id: string; q: string }
  | { kind: 'all'; id: string; q: string };

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Command-palette search (spec 25): `/`, ⌘/Ctrl+K or the navbar icon. Debounced 250ms,
 * previous requests aborted, grouped results, arrow-key highlight that slides, Enter navigates.
 */
export function SearchOverlay() {
  const open = useUiStore((s) => s.searchOpen);
  const set = useUiStore((s) => s.set);
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { stop, start } = useLenis();
  const { reduced } = useMotionPrefs();
  const placeholder = useTypewriter(EXAMPLES, open && !q);
  const close = () => set('searchOpen', false);
  useFocusTrap(panel, open, close);
  const term = useDebounced(q.trim(), 250);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage on open (client only)
    setRecent(readJSON<string[]>(RECENT_KEY, []));
    stop();
    requestAnimationFrame(() => input.current?.focus());
    return () => start();
  }, [open, stop, start]);

  const { data, isFetching } = useQuery({
    queryKey: qk.search(term),
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(term)}`, { signal });
      if (!res.ok) throw new Error('search');
      return (await res.json()) as MultiResults;
    },
    enabled: open && term.length > 1,
    staleTime: 5 * 60_000,
  });

  const { data: trending } = useQuery({
    queryKey: ['search-trending'],
    queryFn: async () => (await (await fetch('/api/tmdb/trending/movie/day')).json()) as Paginated<Movie>,
    enabled: open,
    staleTime: 60 * 60_000,
  });

  const movies = data?.movies.slice(0, 6) ?? [];
  const people = data?.people.slice(0, 4) ?? [];
  const showResults = term.length > 1;
  const options: Option[] = showResults
    ? [
        ...movies.map((m) => ({ kind: 'movie' as const, id: `m${m.id}`, movie: m })),
        ...people.map((p) => ({ kind: 'person' as const, id: `p${p.id}`, person: p })),
        ...(movies.length || people.length ? [{ kind: 'all' as const, id: 'all', q: term }] : []),
      ]
    : recent.map((r) => ({ kind: 'recent' as const, id: `r${r}`, q: r }));
  const activeIndex = Math.min(active, Math.max(0, options.length - 1));

  const remember = (query: string) => {
    const next = [query, ...readJSON<string[]>(RECENT_KEY, []).filter((x) => x.toLowerCase() !== query.toLowerCase())].slice(0, 6);
    writeJSON(RECENT_KEY, next);
  };

  const go = (href: string) => {
    close();
    setQ('');
    requestTransition({ href, kind: 'shutter', push: (h) => router.push(h, { scroll: false }) });
  };

  const choose = (o: Option | undefined) => {
    if (!o) {
      if (term) {
        remember(term);
        track('search_submit');
        go(`/search?q=${encodeURIComponent(term)}`);
      }
      return;
    }
    if (o.kind === 'recent') {
      setQ(o.q);
      input.current?.focus();
      return;
    }
    if (term) remember(term);
    track('search_submit');
    if (o.kind === 'movie') go(`/movie/${o.movie.id}`);
    else if (o.kind === 'person') go(`/person/${o.person.id}`);
    else go(`/search?q=${encodeURIComponent(o.q)}`);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (options.length ? (a + 1) % options.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (options.length ? (a - 1 + options.length) % options.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(options.length && (showResults || recent.length) ? options[activeIndex] : undefined);
    }
  };

  const removeRecent = (r: string) => {
    const next = recent.filter((x) => x !== r);
    setRecent(next);
    writeJSON(RECENT_KEY, next);
  };

  const optionId = (o: Option) => `${listId}-${o.id}`;
  const renderOption = (o: Option, i: number) => {
    const selected = i === activeIndex;
    return (
      <motion.li
        key={o.id}
        id={optionId(o)}
        role="option"
        aria-selected={selected}
        layout={!reduced}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, height: 0, transition: { duration: DUR.fast } }}
        transition={{ delay: Math.min(i, 8) * 0.03, duration: DUR.base, ease: EASES.reel }}
        onPointerMove={() => setActive(i)}
        onClick={() => choose(o)}
        className="relative cursor-pointer overflow-hidden rounded-[10px]"
        data-cursor="link"
      >
        {selected && <motion.span layoutId="search-highlight" transition={SPRING} className="absolute inset-0 -z-10 rounded-[10px] bg-reel/8" aria-hidden="true" />}
        {selected && <motion.span layoutId="search-bar" transition={SPRING} className="absolute inset-y-2 left-0 w-0.5 rounded-pill bg-violet" aria-hidden="true" />}
        <div className="flex min-h-12 items-center gap-3 px-3 py-2">
          {o.kind === 'movie' && (
            <>
              <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-[4px] bg-seat">
                <TmdbImage path={o.movie.poster_path} kind="poster" alt="" sizes="40px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{o.movie.title}</span>
                <span className="text-small text-dim">{yearOf(o.movie.release_date) || 'Movie'}</span>
              </span>
            </>
          )}
          {o.kind === 'person' && (
            <>
              <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-seat">
                <TmdbImage path={o.person.profile_path} kind="profile" alt="" sizes="40px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{o.person.name}</span>
                <span className="text-small text-dim">{o.person.known_for_department || 'Person'}</span>
              </span>
            </>
          )}
          {o.kind === 'recent' && (
            <>
              <Clock className="size-4 text-dim" aria-hidden="true" />
              <span className="flex-1 truncate">{o.q}</span>
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Remove “${o.q}” from recent searches`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecent(o.q);
                }}
                className="grid size-9 place-items-center rounded-full text-dim hover:bg-reel/10 hover:text-reel"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </>
          )}
          {o.kind === 'all' && (
            <span className="flex flex-1 items-center gap-2 font-semibold text-cyan">
              See all results for “{o.q}” <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          )}
        </div>
      </motion.li>
    );
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-(--z-modal)" data-lenis-prevent>
          <motion.div aria-hidden="true" className="absolute inset-0 bg-void/85 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div aria-hidden="true" className="absolute inset-x-0 top-0 h-[8vh] bg-ink" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: DUR.slow, ease: EASES.projector }} />
          <motion.div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[8vh] bg-ink" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: DUR.slow, ease: EASES.projector }} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="absolute top-[11vh] left-1/2 flex max-h-[78vh] w-[min(94vw,720px)] -translate-x-1/2 flex-col overflow-hidden rounded-modal border border-line bg-aisle/95 shadow-2xl"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.base, ease: EASES.reel }}
          >
            <div className="relative flex items-center gap-3 border-b border-line px-5 py-4">
              <Search className="size-6 shrink-0 text-dim" aria-hidden="true" />
              <input
                ref={input}
                type="search"
                role="combobox"
                aria-expanded={options.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={options[activeIndex] ? optionId(options[activeIndex]) : undefined}
                aria-label="Search movies and people"
                value={q}
                onChange={(e) => {
                  setQ(e.currentTarget.value);
                  setActive(0);
                }}
                onKeyDown={onKey}
                placeholder={placeholder}
                data-cursor="text"
                className={cn(
                  'min-w-0 flex-1 bg-transparent font-display text-[clamp(1.4rem,3.4vw,2.2rem)] text-reel outline-none placeholder:text-dim/80 [&::-webkit-search-cancel-button]:hidden',
                  !q && !reduced && 'placeholder-shimmer',
                )}
              />
              {isFetching ? <FilmReelSpinner className="size-5 text-dim" label="Searching" /> : null}
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[0.7rem] text-dim md:block">Esc</kbd>
            </div>

            <div className="overflow-y-auto p-2">
              {!showResults && recent.length > 0 && <p className="px-3 pt-2 pb-1 text-small font-semibold text-dim">Recent searches</p>}
              {showResults && movies.length > 0 && <p className="sr-only">Movies</p>}
              <ul id={listId} role="listbox" aria-label="Search results" className="flex flex-col">
                <AnimatePresence initial={false}>
                  {showResults && movies.length > 0 && (
                    <motion.li key="h-movies" role="presentation" className="px-3 pt-2 pb-1 text-small font-semibold text-dim">
                      Movies
                    </motion.li>
                  )}
                  {options.filter((o) => o.kind === 'movie' || o.kind === 'recent').map((o) => renderOption(o, options.indexOf(o)))}
                  {showResults && people.length > 0 && (
                    <motion.li key="h-people" role="presentation" className="px-3 pt-3 pb-1 text-small font-semibold text-dim">
                      People
                    </motion.li>
                  )}
                  {options.filter((o) => o.kind === 'person' || o.kind === 'all').map((o) => renderOption(o, options.indexOf(o)))}
                </AnimatePresence>
              </ul>

              {showResults && !isFetching && data && !movies.length && !people.length && (
                <div className="px-3 py-6">
                  <p className="text-reel">
                    No matches for “{term}”. Try a title, actor, or director.
                  </p>
                </div>
              )}
              {(!showResults || (data && !movies.length && !people.length)) && trending && (
                <div className="px-3 pt-3 pb-2">
                  <p className="mb-2 text-small font-semibold text-dim">Trending now</p>
                  <div className="flex flex-wrap gap-2">
                    {trending.results.slice(0, 6).map((m) => (
                      <button key={m.id} type="button" onClick={() => go(`/movie/${m.id}`)} className="min-h-10 rounded-pill border border-line px-3 text-small transition-colors duration-fast hover:border-violet hover:text-reel">
                        {m.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 border-t border-line px-5 py-2 text-[0.72rem] text-dim max-md:hidden" aria-hidden="true">
              <span>↑↓ to move</span>
              <span>Enter to open</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
