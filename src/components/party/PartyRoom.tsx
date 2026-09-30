'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Crown, Heart, Link2, Plus, Search, X } from 'lucide-react';
import { addPick, joinParty, loadParty, removePick, setVote } from '@/lib/data/parties';
import type { Movie, MultiResults } from '@/lib/tmdb/types';
import { SIZES } from '@/lib/tmdb/images';
import { useSession } from '@/hooks/useSession';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { toast } from '@/stores/toast';
import { SPRING } from '@/lib/tokens';
import { cn, yearOf } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { EmptyState } from '@/components/layout/EmptyState';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { TransitionLink } from '@/components/layout/TransitionLink';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** A live room: roster, shortlist sorted by votes (animated re-order), add from list or search. */
export function PartyRoom({ code }: { code: string }) {
  const { sb, user, profile } = useSession();
  const qc = useQueryClient();
  const { reduced } = useMotionPrefs();
  const list = useWatchlist();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const key = ['party', code, user?.id];

  const room = useQuery({
    queryKey: key,
    enabled: Boolean(sb && user),
    queryFn: () => loadParty(sb!, code),
  });
  const party = room.data?.party;
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  // Live updates: any change to this party's roster, picks or votes refetches the room.
  useEffect(() => {
    if (!sb || !party) return;
    const filter = `party_id=eq.${party.id}`;
    const channel = sb.channel(`party-${party.id}`);
    for (const table of ['party_members', 'party_picks', 'party_votes'])
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => void refresh(),
      );
    channel.subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one channel per party
  }, [sb, party?.id]);

  // Search as you type (debounced) through the TMDB proxy.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<MultiResults>) : null))
        .then((d) => d && setResults(d.movies.slice(0, 6)))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  if (room.isPending) return <GridSkeleton count={6} />;
  if (!room.data || !party || !user || !sb)
    return (
      <EmptyState
        title="You’re not in this party yet."
        body={`Join party ${code} to see the shortlist and vote.`}
      >
        <Button
          onClick={async () => {
            try {
              await joinParty(sb!, code, profile?.name ?? user?.email?.split('@')[0] ?? 'Guest');
              void refresh();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Join party {code}
        </Button>
      </EmptyState>
    );

  const { members, shortlist } = room.data;
  const nameOf = (id: string) => members.find((mb) => mb.user_id === id)?.display_name ?? '?';
  const inShortlist = new Set(shortlist.map((p) => p.movie_id));
  const add = async (mv: { movie_id: number; title: string; poster_path: string | null }) => {
    try {
      await addPick(sb, party.id, user.id, mv);
      setQuery('');
      setResults([]);
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const vote = async (movieId: number, on: boolean) => {
    try {
      await setVote(sb, party.id, user.id, movieId, on);
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const invite = async () => {
    const url = `${window.location.origin}/party/${party.code}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: party.name,
          text: `Join my watch party (${party.code})`,
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Invite link copied.');
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="meta-caps text-dim">
            Watch party · code{' '}
            <span className="text-reel font-mono tracking-[0.25em]">{party.code}</span>
          </p>
          <h1 className="font-display text-h1 mt-2">{party.name}</h1>
          <ul className="mt-4 flex -space-x-2" aria-label={`${members.length} members`}>
            {members.map((mb) => (
              <li
                key={mb.user_id}
                title={mb.display_name}
                className="border-void bg-aisle text-small grid size-10 place-items-center rounded-full border-2 font-bold"
              >
                <span aria-hidden="true">{initials(mb.display_name)}</span>
                <span className="sr-only">{mb.display_name}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button variant="secondary" icon={<Link2 />} onClick={() => void invite()} magnetic={false}>
          Invite friends
        </Button>
      </header>

      <section
        aria-labelledby="add-h"
        className="rounded-modal border-line bg-seat lit-edge border p-5 md:p-6"
      >
        <h2 id="add-h" className="font-display text-h3 mb-4">
          Add films
        </h2>
        <label className="rounded-pill border-line bg-void focus-within:border-violet flex min-h-12 items-center gap-3 border px-4">
          <Search className="text-dim size-4" aria-hidden="true" />
          <span className="sr-only">Search films to add</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length < 2) setResults([]);
            }}
            placeholder="Search a title…"
            className="flex-1 bg-transparent outline-none"
          />
        </label>
        {results.length > 0 && (
          <ul className="mt-3 flex flex-col">
            {results.map((mv) => (
              <li key={mv.id}>
                <button
                  type="button"
                  disabled={inShortlist.has(mv.id)}
                  onClick={() =>
                    void add({ movie_id: mv.id, title: mv.title, poster_path: mv.poster_path })
                  }
                  className="hover:bg-reel/5 flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left disabled:opacity-50"
                >
                  <span>
                    {mv.title} <span className="text-dim">{yearOf(mv.release_date)}</span>
                  </span>
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {(list.data?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="meta-caps text-dim mb-2">From your list</p>
            <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {list
                .data!.filter((w) => !inShortlist.has(w.movie_id))
                .slice(0, 12)
                .map((w) => (
                  <li key={w.movie_id}>
                    <button
                      type="button"
                      onClick={() =>
                        void add({
                          movie_id: w.movie_id,
                          title: w.title,
                          poster_path: w.poster_path,
                        })
                      }
                      className="rounded-pill border-line text-small hover:border-violet/60 inline-flex min-h-10 items-center gap-2 border px-4 whitespace-nowrap"
                    >
                      <Plus className="size-3.5" aria-hidden="true" /> {w.title}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="shortlist-h">
        <h2 id="shortlist-h" className="font-display text-h2 mb-6">
          Shortlist
        </h2>
        {shortlist.length === 0 ? (
          <EmptyState
            title="Nothing on the shortlist yet."
            body="Add a film above; everyone in the party sees it instantly."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {shortlist.map((p, i) => {
                const mine = p.votes.includes(user.id);
                const lead = i === 0 && p.votes.length > 0;
                return (
                  <m.li
                    key={p.movie_id}
                    layout={!reduced}
                    transition={SPRING}
                    initial={reduced ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      'rounded-modal border-line bg-seat lit-edge relative grid grid-cols-[88px_1fr] gap-4 border p-3',
                      lead &&
                        'border-amber/60 shadow-[0_0_40px_color-mix(in_oklab,var(--projector-amber)_25%,transparent)]',
                    )}
                  >
                    <TransitionLink
                      href={`/movie/${p.movie_id}`}
                      className="rounded-poster bg-void relative aspect-[2/3] overflow-hidden"
                      aria-label={p.title}
                    >
                      <TmdbImage
                        path={p.poster_path}
                        kind="poster"
                        alt=""
                        sizes={SIZES.card}
                        fallbackTitle={p.title}
                      />
                    </TransitionLink>
                    <div className="flex min-w-0 flex-col gap-2 py-1">
                      {lead && (
                        <p className="meta-caps text-amber flex items-center gap-1.5">
                          <Crown className="size-3.5" aria-hidden="true" /> Tonight’s pick
                        </p>
                      )}
                      <p className="font-display text-body line-clamp-2 leading-snug">{p.title}</p>
                      <p className="text-dim text-[0.75rem]" aria-label={`${p.votes.length} votes`}>
                        {p.votes.length ? p.votes.map(nameOf).join(', ') : 'No votes yet'}
                      </p>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          aria-pressed={mine}
                          onClick={() => void vote(p.movie_id, !mine)}
                          className={cn(
                            'rounded-pill text-small inline-flex min-h-10 items-center gap-2 border px-4 font-semibold transition-colors',
                            mine
                              ? 'border-danger/60 bg-danger/15 text-reel'
                              : 'border-line hover:border-danger/50',
                          )}
                        >
                          <Heart
                            className={cn('size-4', mine && 'fill-danger text-danger')}
                            aria-hidden="true"
                          />
                          {p.votes.length}
                          <span className="sr-only">
                            {mine ? `Remove your vote for ${p.title}` : `Vote for ${p.title}`}
                          </span>
                        </button>
                        {(p.added_by === user.id || party.host_id === user.id) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await removePick(sb, party.id, p.movie_id);
                                void refresh();
                              } catch (e) {
                                toast.error((e as Error).message);
                              }
                            }}
                            aria-label={`Remove ${p.title} from the shortlist`}
                            className="text-dim hover:text-reel grid size-10 place-items-center rounded-full"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}
