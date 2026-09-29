import { readJSON, writeJSON, removeKey } from '@/lib/storage';
import { uid } from '@/lib/utils';
import type { Repo } from './repo';
import type { HistoryItem, Profile, SiteReview, WatchItem } from './types';
import { MAX_PROFILES } from './types';
import { cleanReviewBody } from '@/lib/profanity';

const K = {
  profiles: 'rh:profiles',
  watch: (p: string) => `rh:${p}:watchlist`,
  history: (p: string) => `rh:${p}:history`,
  ratings: (p: string) => `rh:${p}:ratings`,
  reviews: (m: number) => `rh:reviews:${m}`,
  likes: (p: string) => `rh:${p}:review-likes`,
};

const now = () => new Date().toISOString();
const HISTORY_LIMIT = 50;

/** Guest backend — everything lives in this browser's localStorage. */
export const localRepo: Repo = {
  kind: 'local',
  profiles: {
    async list() {
      return readJSON<Profile[]>(K.profiles, []);
    },
    async create(input) {
      const list = readJSON<Profile[]>(K.profiles, []);
      if (list.length >= MAX_PROFILES)
        throw new Error(`You can have up to ${MAX_PROFILES} profiles.`);
      const p: Profile = { ...input, id: uid(), user_id: null, settings: {}, created_at: now() };
      writeJSON(K.profiles, [...list, p]);
      return p;
    },
    async update(id, patch) {
      const list = readJSON<Profile[]>(K.profiles, []);
      const idx = list.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error('Profile not found.');
      const prev = list[idx] as Profile;
      const next: Profile = {
        ...prev,
        ...patch,
        settings: { ...prev.settings, ...patch.settings },
      };
      list[idx] = next;
      writeJSON(K.profiles, list);
      return next;
    },
    async remove(id) {
      writeJSON(
        K.profiles,
        readJSON<Profile[]>(K.profiles, []).filter((p) => p.id !== id),
      );
      for (const key of [K.watch(id), K.history(id), K.ratings(id), K.likes(id)]) removeKey(key);
    },
  },
  watchlist: {
    async list(pid) {
      return readJSON<WatchItem[]>(K.watch(pid), []).sort((a, b) => a.position - b.position);
    },
    async add(pid, movie) {
      const list = readJSON<WatchItem[]>(K.watch(pid), []);
      const existing = list.find((w) => w.movie_id === movie.movie_id);
      if (existing) return existing;
      const item: WatchItem = {
        ...movie,
        added_at: now(),
        position: list.length ? Math.min(...list.map((w) => w.position)) - 1 : 0,
      };
      writeJSON(K.watch(pid), [item, ...list]);
      return item;
    },
    async remove(pid, movieId) {
      writeJSON(
        K.watch(pid),
        readJSON<WatchItem[]>(K.watch(pid), []).filter((w) => w.movie_id !== movieId),
      );
    },
    async reorder(pid, ids) {
      const list = readJSON<WatchItem[]>(K.watch(pid), []);
      const pos = new Map(ids.map((id, i) => [id, i]));
      writeJSON(
        K.watch(pid),
        list.map((w) => ({ ...w, position: pos.get(w.movie_id) ?? w.position })),
      );
    },
  },
  history: {
    async list(pid) {
      return readJSON<HistoryItem[]>(K.history(pid), []);
    },
    async record(pid, movie, kind, progress = 0) {
      const list = readJSON<HistoryItem[]>(K.history(pid), []);
      const prev = list.find((h) => h.movie_id === movie.movie_id);
      const item: HistoryItem = {
        ...movie,
        kind: kind === 'trailer' || prev?.kind === 'trailer' ? 'trailer' : 'view',
        at: now(),
        progress: Math.max(progress, prev?.progress ?? 0),
      };
      writeJSON(
        K.history(pid),
        [item, ...list.filter((h) => h.movie_id !== movie.movie_id)].slice(0, HISTORY_LIMIT),
      );
    },
    async remove(pid, movieId) {
      writeJSON(
        K.history(pid),
        readJSON<HistoryItem[]>(K.history(pid), []).filter((h) => h.movie_id !== movieId),
      );
    },
    async clear(pid) {
      removeKey(K.history(pid));
    },
  },
  ratings: {
    async all(pid) {
      return readJSON<Record<number, number>>(K.ratings(pid), {});
    },
    async set(pid, movieId, score) {
      const r = readJSON<Record<number, number>>(K.ratings(pid), {});
      if (score === null) delete r[movieId];
      else r[movieId] = score;
      writeJSON(K.ratings(pid), r);
    },
    async average(movieId) {
      // Guests only see their own device's ratings.
      const profiles = readJSON<Profile[]>(K.profiles, []);
      const scores = [...profiles.map((p) => p.id), 'guest']
        .map((id) => readJSON<Record<number, number>>(K.ratings(id), {})[movieId])
        .filter((s): s is number => typeof s === 'number');
      return {
        average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        count: scores.length,
      };
    },
  },
  reviews: {
    async list(movieId, pid) {
      const likes = readJSON<string[]>(K.likes(pid), []);
      return readJSON<SiteReview[]>(K.reviews(movieId), []).map((r) => ({
        ...r,
        liked: likes.includes(r.id),
      }));
    },
    async upsert(profile, pid, input) {
      const list = readJSON<SiteReview[]>(K.reviews(input.movie_id), []);
      const body = cleanReviewBody(input.body);
      const existing = input.id
        ? list.find((r) => r.id === input.id && r.profile_id === pid)
        : undefined;
      const review: SiteReview = existing
        ? { ...existing, body, spoiler: input.spoiler, updated_at: now() }
        : {
            id: uid(),
            profile_id: pid,
            profile_name: profile?.name ?? 'Guest',
            avatar: profile?.avatar ?? 'reel',
            movie_id: input.movie_id,
            body,
            spoiler: input.spoiler,
            created_at: now(),
            updated_at: now(),
            likes: 0,
            liked: false,
          };
      writeJSON(
        K.reviews(input.movie_id),
        existing ? list.map((r) => (r.id === review.id ? review : r)) : [review, ...list],
      );
      return review;
    },
    async remove(pid, reviewId) {
      // Scan is fine at guest scale; ids are unique.
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('rh:reviews:')) continue;
        const list = readJSON<SiteReview[]>(key, []);
        if (list.some((r) => r.id === reviewId && r.profile_id === pid))
          writeJSON(
            key,
            list.filter((r) => r.id !== reviewId),
          );
      }
    },
    async like(pid, reviewId, on) {
      const likes = new Set(readJSON<string[]>(K.likes(pid), []));
      if (on) likes.add(reviewId);
      else likes.delete(reviewId);
      writeJSON(K.likes(pid), [...likes]);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('rh:reviews:')) continue;
        const list = readJSON<SiteReview[]>(key, []);
        if (list.some((r) => r.id === reviewId))
          writeJSON(
            key,
            list.map((r) =>
              r.id === reviewId ? { ...r, likes: Math.max(0, r.likes + (on ? 1 : -1)) } : r,
            ),
          );
      }
    },
    async report() {
      /* Guests' reviews never leave the device; nothing to moderate. */
    },
  },
};

/** Guest watchlist for the post-login merge dialog. */
export function readGuestWatchlist(): WatchItem[] {
  return readJSON<WatchItem[]>(K.watch('guest'), []);
}

export function clearGuestWatchlist(): void {
  removeKey(K.watch('guest'));
}
