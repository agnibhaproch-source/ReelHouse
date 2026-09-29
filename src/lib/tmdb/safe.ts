import 'server-only';
import { isTmdbError, type TmdbError } from './errors';

export interface Safe<T> {
  data: T | null;
  error: TmdbError | null;
}

/** Never white-screen on TMDB failure (spec 64): callers render cached/empty states + a banner. */
export async function safe<T>(p: Promise<T>): Promise<Safe<T>> {
  try {
    return { data: await p, error: null };
  } catch (err) {
    if (isTmdbError(err)) {
      if (err.kind !== 'not_found') console.error('[tmdb]', err.kind, err.message);
      return { data: null, error: err };
    }
    throw err;
  }
}
