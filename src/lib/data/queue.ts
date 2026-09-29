import { readJSON, writeJSON } from '@/lib/storage';
import type { Repo } from './repo';
import type { MovieSnapshot } from './types';

export type QueuedOp =
  | { op: 'add'; profileId: string; movie: MovieSnapshot }
  | { op: 'remove'; profileId: string; movieId: number };

const KEY = 'rh:offline-queue';

export function enqueue(op: QueuedOp): void {
  const q = readJSON<QueuedOp[]>(KEY, []);
  // Collapse add/remove pairs for the same title so replay is idempotent.
  const id = op.op === 'add' ? op.movie.movie_id : op.movieId;
  const rest = q.filter((x) => !(x.profileId === op.profileId && (x.op === 'add' ? x.movie.movie_id : x.movieId) === id));
  writeJSON(KEY, [...rest, op]);
}

export function pending(): QueuedOp[] {
  return readJSON<QueuedOp[]>(KEY, []);
}

/** Replays queued watchlist writes; keeps ops that still fail. */
export async function flush(repo: Repo): Promise<number> {
  const q = pending();
  if (!q.length) return 0;
  const failed: QueuedOp[] = [];
  let done = 0;
  for (const op of q) {
    try {
      if (op.op === 'add') await repo.watchlist.add(op.profileId, op.movie);
      else await repo.watchlist.remove(op.profileId, op.movieId);
      done++;
    } catch {
      failed.push(op);
    }
  }
  writeJSON(KEY, failed);
  return done;
}

export const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false;
