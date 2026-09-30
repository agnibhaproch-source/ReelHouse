import { describe, expect, it } from 'vitest';
import {
  allArtPaths,
  artAccentFor,
  artDataUri,
  artPaths,
  isArtPath,
  renderArt,
} from '@/lib/art/catalogue';
import { posterSvg } from '@/lib/art/generate';
import { tmdbImage, tmdbLoader } from '@/lib/tmdb/images';

describe('generated artwork', () => {
  it('renders every catalogue path as a standalone, deterministic SVG', () => {
    const paths = allArtPaths();
    expect(paths.length).toBeGreaterThan(400);
    for (const p of paths.slice(0, 40)) {
      const svg = renderArt(p);
      expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(svg).not.toMatch(/<script|href="http|NaN|undefined/);
      expect(renderArt(p)).toBe(svg); // same film → same art
    }
    expect(renderArt(artPaths.poster(1001))).not.toBe(renderArt(artPaths.poster(1002)));
  });

  it('rejects unknown or malformed paths', () => {
    for (const p of [
      '/art/poster/9999.svg',
      '/art/still/1001-9.svg',
      '/art/../x.svg',
      '/art/poster/1001.png',
    ])
      expect(renderArt(p)).toBeNull();
  });

  it('escapes titles', () => {
    const svg = posterSvg({
      id: 1,
      title: 'A <b>&"',
      year: 2000,
      genres: [18],
      lang: 'en',
      director: 'X & Y',
    });
    expect(svg).toContain('A &lt;b&gt;&amp;&quot;');
    expect(svg).toContain('X &amp; Y');
  });

  it('bypasses the TMDB CDN for local art and exposes an accent and data URI', () => {
    const p = artPaths.backdrop(1010);
    expect(isArtPath(p)).toBe(true);
    expect(tmdbImage(p, 'w1280')).toBe(p);
    expect(tmdbLoader({ src: `backdrop:${p}`, width: 640 })).toBe(`${p}?w=640`);
    expect(artAccentFor(1010)).toMatch(/^#[0-9a-f]{6}$/);
    expect(artDataUri(p)).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
