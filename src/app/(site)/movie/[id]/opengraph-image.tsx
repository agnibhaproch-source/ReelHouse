import { ImageResponse } from 'next/og';
import { getMovie } from '@/lib/tmdb/endpoints';
import { getBestLogo, tmdbImage } from '@/lib/tmdb/images';
import { getPosterMeta } from '@/lib/tmdb/meta';

export const alt = 'Movie on Reelhouse';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 86400;

/** Backdrop + logo + rating in brand style (spec 63). */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovie(Number(id)).catch(() => null);
  if (!movie) {
    return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080d', color: '#ede8df', fontSize: 72 }}>Reelhouse</div>, size);
  }
  const backdrop = tmdbImage(movie.backdrop_path, 'w1280');
  const logo = getBestLogo(movie.images);
  const logoUrl = logo ? tmdbImage(logo.file_path, 'w500') : null;
  const { color } = await getPosterMeta(movie.poster_path);
  const pct = Math.round(movie.vote_average * 10);
  const year = movie.release_date?.slice(0, 4) ?? '';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#08080d', color: '#ede8df' }}>
        {backdrop && (
          <img src={backdrop} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: `linear-gradient(90deg, #08080d 0%, rgba(8,8,13,0.85) 40%, rgba(8,8,13,0.2) 100%)` }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, display: 'flex', background: color }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 64, width: '100%' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="" style={{ maxWidth: 560, maxHeight: 200, objectFit: 'contain', objectPosition: 'left bottom' }} />
          ) : (
            <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1, maxWidth: 800 }}>{movie.title}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 28, fontSize: 32 }}>
            {pct > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, borderRadius: 44, border: '6px solid #ffb547', fontSize: 30, fontWeight: 800 }}>{pct}%</div>
            )}
            <div style={{ display: 'flex', color: '#c9c4bb' }}>{[year, movie.genres.slice(0, 3).map((g) => g.name).join(' · ')].filter(Boolean).join('  ·  ')}</div>
          </div>
          <div style={{ display: 'flex', marginTop: 32, fontSize: 28, color: '#8b5cff', fontWeight: 700 }}>Reelhouse</div>
        </div>
      </div>
    ),
    size,
  );
}
