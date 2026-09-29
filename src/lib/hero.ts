import 'server-only';
import { getMovie, getTrending, type RequestPrefs } from './tmdb/endpoints';
import { getBestLogo } from './tmdb/images';
import { getPosterMeta } from './tmdb/meta';
import { pickVideos } from './tmdb/videos';
import type { Movie, Video } from './tmdb/types';

export interface HeroSlide {
  id: number;
  title: string;
  overview: string;
  backdrop: string | null;
  poster: string | null;
  logo: { path: string; ratio: number } | null;
  year: string;
  rating: number;
  runtime: number | null;
  genres: string[];
  videos: Video[];
  color: string;
  blur: string | null;
  movie: Movie;
}

/** Top 5 trending titles with a good backdrop, preferring ones with an English logo (spec 21). */
export async function getHeroSlides(prefs: RequestPrefs = {}): Promise<HeroSlide[]> {
  const trending = await getTrending('day', 1, prefs);
  const withArt = trending.results.filter((m) => m.backdrop_path || m.poster_path);
  // Demo fixtures have no artwork — fall back to the top titles so the billboard still renders.
  const candidates = (withArt.length >= 3 ? withArt : trending.results).slice(0, 10);
  const details = await Promise.all(candidates.map((m) => getMovie(m.id, prefs).catch(() => null)));
  const slides: HeroSlide[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const m = candidates[i] as Movie;
    const d = details[i];
    const logo = getBestLogo(d?.images);
    const meta = await getPosterMeta(m.poster_path);
    slides.push({
      id: m.id,
      title: m.title,
      overview: m.overview || d?.overview || '',
      backdrop: m.backdrop_path,
      poster: m.poster_path,
      logo: logo
        ? { path: logo.file_path, ratio: logo.aspect_ratio || logo.width / logo.height }
        : null,
      year: (m.release_date ?? '').slice(0, 4),
      rating: m.vote_average,
      runtime: d?.runtime ?? null,
      genres: d?.genres.slice(0, 3).map((g) => g.name) ?? [],
      videos: pickVideos(d?.videos.results).slice(0, 6),
      color: meta.color,
      blur: meta.blur,
      movie: { ...m, meta },
    });
  }
  // Prefer slides with a backdrop and logo; keep order otherwise.
  const score = (s: HeroSlide) => (s.backdrop ? 2 : 0) + (s.logo ? 1 : 0);
  return slides.sort((a, b) => score(b) - score(a)).slice(0, 5);
}
