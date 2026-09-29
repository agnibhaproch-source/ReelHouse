import type { Video } from './types';

/** Trailer preference (spec 54): YouTube Trailer (official, newest) → Teaser → Clip. */
export function pickVideos(videos: readonly Video[] | undefined | null): Video[] {
  const yt = (videos ?? []).filter((v) => v.site === 'YouTube' && /^[\w-]{6,20}$/.test(v.key));
  const rank = (v: Video) => (v.type === 'Trailer' ? 0 : v.type === 'Teaser' ? 1 : v.type === 'Clip' ? 2 : 3);
  return [...yt].sort(
    (a, b) => rank(a) - rank(b) || Number(b.official) - Number(a.official) || b.published_at.localeCompare(a.published_at),
  );
}

export function bestTrailer(videos: readonly Video[] | undefined | null): Video | null {
  const v = pickVideos(videos)[0];
  return v && v.type !== 'Featurette' && v.type !== 'Behind the Scenes' ? v : (v ?? null);
}

export const youtubeThumb = (key: string) => `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;
