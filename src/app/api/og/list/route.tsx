import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { getMovieBasic } from '@/lib/tmdb/endpoints';
import { fallbackGlow } from '@/lib/tmdb/color';
import { tmdbImage } from '@/lib/tmdb/images';
import { artDataUri, isArtPath } from '@/lib/art/catalogue';
import { cleanListName, decodeListIds } from '@/lib/shared-list';

const size = { width: 1200, height: 630 };

/** Share image for /list: a fanned collage of up to five posters and the list name. */
export async function GET(req: NextRequest) {
  const ids = decodeListIds(req.nextUrl.searchParams.get('i')).slice(0, 5);
  const name = cleanListName(req.nextUrl.searchParams.get('n'));
  const movies = (await Promise.all(ids.map((id) => getMovieBasic(id).catch(() => null)))).filter(
    (m) => m !== null,
  );
  const n = movies.length;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#08080d',
        color: '#ede8df',
        fontFamily: 'serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          background: 'radial-gradient(ellipse at 75% 40%, rgba(139,92,255,0.35), transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 70,
          width: 620,
          height: 500,
          display: 'flex',
        }}
      >
        {movies.map((m, i) => {
          const src = isArtPath(m.poster_path)
            ? artDataUri(m.poster_path)
            : tmdbImage(m.poster_path, 'w342');
          const mid = (n - 1) / 2;
          return (
            <div
              key={m.id}
              style={{
                position: 'absolute',
                left: 190 + (i - mid) * 105,
                top: 20 + Math.abs(i - mid) * 22,
                width: 240,
                height: 360,
                display: 'flex',
                borderRadius: 10,
                overflow: 'hidden',
                transform: `rotate(${(i - mid) * 7}deg)`,
                boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                background: src
                  ? '#12121a'
                  : `linear-gradient(160deg, ${fallbackGlow(m.title)}, #12121a 70%)`,
              }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img>
                <img
                  src={src}
                  alt=""
                  width={240}
                  height={360}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 18,
                    fontSize: 30,
                    lineHeight: 1,
                  }}
                >
                  {m.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 70,
          bottom: 80,
          width: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 4, color: '#8c8a9b', display: 'flex' }}>
          {`A LIST · ${ids.length} FILMS`}
        </div>
        <div style={{ fontSize: 68, lineHeight: 1.02, display: 'flex' }}>{name}</div>
        <div style={{ fontSize: 30, color: '#8b5cff', display: 'flex' }}>Reelhouse</div>
      </div>
    </div>,
    {
      ...size,
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    },
  );
}
