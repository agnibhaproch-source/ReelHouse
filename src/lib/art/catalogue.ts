import { CATALOGUE, CATALOGUE_DIRECTORS } from '@/lib/tmdb/fixture-catalogue';
import { artAccent, backdropSvg, portraitSvg, posterSvg, type ArtFilm } from './generate';

/** Generated artwork is served from here (same origin, static). */
export const ART_PREFIX = '/art/';
export const STILLS_PER_FILM = 3;

export const isArtPath = (path: string | null | undefined): path is string =>
  Boolean(path?.startsWith(ART_PREFIX));

export const artPaths = {
  poster: (id: number) => `/art/poster/${id}.svg`,
  backdrop: (id: number) => `/art/backdrop/${id}.svg`,
  still: (id: number, n: number) => `/art/still/${id}-${n}.svg`,
  profile: (personId: number) => `/art/profile/${personId}.svg`,
};

export function artFilm(id: number): ArtFilm | null {
  const row = CATALOGUE[id - 1001];
  if (!row) return null;
  const [title, year, lang, genres, director] = row;
  return { id, title, year, lang, genres, director };
}

export function artAccentFor(id: number): string | null {
  const film = artFilm(id);
  return film ? artAccent(film) : null;
}

/** SVG markup for an art path, or null when it doesn't name a catalogue item. */
export function renderArt(path: string): string | null {
  const m = /^\/art\/(poster|backdrop|still|profile)\/(\d+)(?:-(\d))?\.svg$/.exec(path);
  if (!m) return null;
  const kind = m[1];
  const id = Number(m[2]);
  if (kind === 'profile') {
    const name = CATALOGUE_DIRECTORS[id - 5001];
    return name ? portraitSvg(name) : null;
  }
  const film = artFilm(id);
  if (!film) return null;
  if (kind === 'poster') return posterSvg(film);
  if (kind === 'backdrop') return backdropSvg(film);
  const n = Number(m[3] ?? 1);
  return n >= 1 && n <= STILLS_PER_FILM ? backdropSvg(film, n) : null;
}

/** Every art path, for static prerendering. */
export function allArtPaths(): string[] {
  const out: string[] = [];
  CATALOGUE.forEach((_, i) => {
    const id = 1001 + i;
    out.push(artPaths.poster(id), artPaths.backdrop(id));
    for (let n = 1; n <= STILLS_PER_FILM; n++) out.push(artPaths.still(id, n));
  });
  CATALOGUE_DIRECTORS.forEach((_, i) => out.push(artPaths.profile(5001 + i)));
  return out;
}

/** `data:` URI for places that can't fetch same-origin files (OG image rendering). */
export function artDataUri(path: string): string | null {
  const svg = renderArt(path);
  return svg ? `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` : null;
}
