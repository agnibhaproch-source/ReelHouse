import type { SupabaseClient } from '@supabase/supabase-js';
import { cleanReviewBody } from '@/lib/profanity';
import type { Repo } from './repo';
import type { AvatarKey, HistoryItem, Profile, SiteReview, WatchItem } from './types';

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const snapshotCols = (m: {
  movie_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string | null;
  genre_ids?: number[];
  original_language?: string;
}) => ({
  movie_id: m.movie_id,
  title: m.title,
  poster_path: m.poster_path,
  backdrop_path: m.backdrop_path ?? null,
  genre_ids: m.genre_ids ?? [],
  original_language: m.original_language ?? null,
});

/** Signed-in backend. Row-level security scopes every query to the user's own profiles. */
export function createSupabaseRepo(sb: SupabaseClient, userId: string): Repo {
  return {
    kind: 'supabase',
    profiles: {
      async list() {
        return check(await sb.from('profiles').select('*').order('created_at')) as Profile[];
      },
      async create(input) {
        return check(
          await sb
            .from('profiles')
            .insert({ ...input, user_id: userId })
            .select()
            .single(),
        ) as Profile;
      },
      async update(id, patch) {
        let settings = patch.settings;
        if (settings) {
          const cur = check(await sb.from('profiles').select('settings').eq('id', id).single()) as {
            settings: object;
          };
          settings = { ...cur.settings, ...settings };
        }
        return check(
          await sb
            .from('profiles')
            .update({ ...patch, ...(settings ? { settings } : {}) })
            .eq('id', id)
            .select()
            .single(),
        ) as Profile;
      },
      async remove(id) {
        check(await sb.from('profiles').delete().eq('id', id));
      },
    },
    watchlist: {
      async list(pid) {
        return check(
          await sb
            .from('watchlist')
            .select('*')
            .eq('profile_id', pid)
            .order('position')
            .order('added_at', { ascending: false }),
        ) as WatchItem[];
      },
      async add(pid, movie) {
        const min = check(
          await sb
            .from('watchlist')
            .select('position')
            .eq('profile_id', pid)
            .order('position')
            .limit(1),
        ) as { position: number }[];
        const row = {
          ...snapshotCols(movie),
          vote_average: movie.vote_average ?? null,
          release_date: movie.release_date ?? null,
          profile_id: pid,
          position: (min[0]?.position ?? 1) - 1,
        };
        return check(
          await sb
            .from('watchlist')
            .upsert(row, { onConflict: 'profile_id,movie_id', ignoreDuplicates: true })
            .select()
            .maybeSingle(),
        ) as WatchItem;
      },
      async remove(pid, movieId) {
        check(await sb.from('watchlist').delete().eq('profile_id', pid).eq('movie_id', movieId));
      },
      async reorder(pid, ids) {
        await Promise.all(
          ids.map((id, position) =>
            sb.from('watchlist').update({ position }).eq('profile_id', pid).eq('movie_id', id),
          ),
        );
      },
    },
    history: {
      async list(pid) {
        return check(
          await sb
            .from('history')
            .select('*')
            .eq('profile_id', pid)
            .order('at', { ascending: false })
            .limit(50),
        ) as HistoryItem[];
      },
      async record(pid, movie, kind, progress = 0) {
        const prev = check(
          await sb
            .from('history')
            .select('kind, progress')
            .eq('profile_id', pid)
            .eq('movie_id', movie.movie_id)
            .maybeSingle(),
        ) as { kind: string; progress: number } | null;
        check(
          await sb.from('history').upsert({
            ...snapshotCols(movie),
            profile_id: pid,
            kind: kind === 'trailer' || prev?.kind === 'trailer' ? 'trailer' : 'view',
            progress: Math.max(progress, prev?.progress ?? 0),
            at: new Date().toISOString(),
          }),
        );
      },
      async remove(pid, movieId) {
        check(await sb.from('history').delete().eq('profile_id', pid).eq('movie_id', movieId));
      },
      async clear(pid) {
        check(await sb.from('history').delete().eq('profile_id', pid));
      },
    },
    ratings: {
      async all(pid) {
        const rows = check(
          await sb.from('ratings').select('movie_id, score').eq('profile_id', pid),
        ) as { movie_id: number; score: number }[];
        return Object.fromEntries(rows.map((r) => [r.movie_id, r.score]));
      },
      async set(pid, movieId, score) {
        if (score === null)
          check(await sb.from('ratings').delete().eq('profile_id', pid).eq('movie_id', movieId));
        else check(await sb.from('ratings').upsert({ profile_id: pid, movie_id: movieId, score }));
      },
      async average(movieId) {
        const rows = check(await sb.rpc('movie_rating_average', { p_movie_id: movieId })) as {
          average: number;
          count: number;
        }[];
        return { average: Number(rows[0]?.average ?? 0), count: Number(rows[0]?.count ?? 0) };
      },
    },
    reviews: {
      async list(movieId, pid) {
        const rows = check(
          await sb.rpc('get_reviews', { p_movie_id: movieId, p_viewer: pid }),
        ) as (Omit<SiteReview, 'likes'> & { likes: number | string; avatar: string })[];
        return rows.map((r) => ({ ...r, avatar: r.avatar as AvatarKey, likes: Number(r.likes) }));
      },
      async upsert(profile, pid, input) {
        const body = cleanReviewBody(input.body);
        const row = check(
          await sb
            .from('reviews')
            .upsert(
              {
                ...(input.id ? { id: input.id } : {}),
                profile_id: pid,
                movie_id: input.movie_id,
                body,
                spoiler: input.spoiler,
              },
              { onConflict: 'profile_id,movie_id' },
            )
            .select()
            .single(),
        ) as Omit<SiteReview, 'profile_name' | 'avatar' | 'likes' | 'liked'>;
        return {
          ...row,
          profile_name: profile?.name ?? 'You',
          avatar: profile?.avatar ?? 'reel',
          likes: 0,
          liked: false,
        };
      },
      async remove(pid, reviewId) {
        check(await sb.from('reviews').delete().eq('id', reviewId).eq('profile_id', pid));
      },
      async like(pid, reviewId, on) {
        if (on)
          check(await sb.from('review_likes').upsert({ review_id: reviewId, profile_id: pid }));
        else
          check(
            await sb.from('review_likes').delete().eq('review_id', reviewId).eq('profile_id', pid),
          );
      },
      async report(pid, reviewId, reason) {
        check(
          await sb
            .from('review_reports')
            .upsert(
              { review_id: reviewId, profile_id: pid, reason: reason.slice(0, 500) },
              { onConflict: 'review_id,profile_id' },
            ),
        );
      },
    },
  };
}
