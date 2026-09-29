import { ImageResponse } from 'next/og';

export const alt = 'Reelhouse — cinematic movie discovery';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 72,
        background: 'radial-gradient(ellipse at 30% 20%, #2a1a5e 0%, #08080d 60%)',
        color: '#ede8df',
      }}
    >
      <div style={{ fontSize: 34, color: '#3fe0ff', marginBottom: 12 }}>Now showing</div>
      <div
        style={{
          display: 'flex',
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: -4,
          lineHeight: 1,
        }}
      >
        Reel<span style={{ color: '#8b5cff' }}>house</span>
      </div>
      <div style={{ fontSize: 34, color: '#8c8a9b', marginTop: 20 }}>
        Trending, top-rated and world cinema — trailers, cast and reviews.
      </div>
    </div>,
    size,
  );
}
