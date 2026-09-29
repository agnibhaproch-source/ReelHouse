import 'server-only';
import { IMAGE_SIZE, tmdbImage } from './images';
import type { Movie, PosterMeta } from './types';
import { fallbackGlow } from './color';

const cache = new Map<string, Promise<PosterMeta>>();
const MAX_CACHE = 2000;

async function compute(path: string): Promise<PosterMeta> {
  const url = tmdbImage(path, IMAGE_SIZE.blur);
  if (!url) return { color: fallbackGlow(path), blur: null };
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`poster ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Native modules load lazily so a broken sharp install degrades to fallback colours, not a crash.
  const [{ default: sharp }, { getAverageColor }] = await Promise.all([
    import('sharp'),
    import('fast-average-color-node'),
  ]);
  const [avg, tiny] = await Promise.all([
    getAverageColor(buf, {
      algorithm: 'dominant',
      ignoredColor: [
        [0, 0, 0, 255, 24],
        [255, 255, 255, 255, 24],
      ],
    }),
    sharp(buf).resize(10, 15, { fit: 'cover' }).webp({ quality: 40 }).toBuffer(),
  ]);
  return { color: avg.hex, blur: `data:image/webp;base64,${tiny.toString('base64')}` };
}

/** Dominant colour + base64 blur placeholder from the w92 poster; memoised per path. */
export function getPosterMeta(path: string | null): Promise<PosterMeta> {
  if (!path) return Promise.resolve({ color: fallbackGlow('none'), blur: null });
  let hit = cache.get(path);
  if (!hit) {
    hit = compute(path).catch(() => ({ color: fallbackGlow(path), blur: null }));
    if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value as string);
    cache.set(path, hit);
  }
  return hit;
}

export async function getDominantColor(posterPath: string | null): Promise<string> {
  return (await getPosterMeta(posterPath)).color;
}

/** Attach meta to the first `limit` movies, with bounded concurrency. */
export async function withMeta(movies: Movie[], limit = 20, concurrency = 6): Promise<Movie[]> {
  const out = [...movies];
  let cursor = 0;
  const worker = async () => {
    while (cursor < Math.min(limit, out.length)) {
      const i = cursor++;
      const m = out[i];
      if (m) out[i] = { ...m, meta: await getPosterMeta(m.poster_path) };
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}
