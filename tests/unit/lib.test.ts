import { describe, expect, it } from 'vitest';
import { encodeSrc, getBestLogo, nearestSize, tmdbImage, tmdbLoader } from '@/lib/tmdb/images';
import { isAllowedPath } from '@/lib/tmdb/allowlist';
import { fallbackGlow, hexToRgbTriplet } from '@/lib/tmdb/color';
import { genreById, genreBySlug, genreNames } from '@/lib/tmdb/genres';
import { getLanguage, languageName } from '@/lib/tmdb/languages';
import { bestTrailer, pickVideos } from '@/lib/tmdb/videos';
import { cardLabel, fromSnapshot, toSnapshot } from '@/lib/snapshot';
import {
  clamp,
  formatMoney,
  formatRuntime,
  greetingFor,
  isNewRelease,
  matchPercent,
  slugify,
  truncate,
  yearOf,
} from '@/lib/utils';
import { genreAffinity, languageAffinity, rankRecommendations } from '@/lib/recommendations';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  discoverQuery,
  filtersToSearch,
  parseFilters,
} from '@/lib/filters';
import { cleanReviewBody, containsProfanity, maskProfanity } from '@/lib/profanity';
import { authErrorMessage, passwordStrength, SignupSchema } from '@/lib/auth-schemas';
import { homeRows, rowUrl } from '@/lib/rows';
import { isProtectedPath, safeNext } from '@/lib/supabase/config';
import {
  shouldIntercept,
  transitionKindFor,
  requestTransition,
  signalPageReady,
  waitForPage,
  onTransitionRequest,
  setTransitioning,
} from '@/lib/transition';
import type { Movie, TmdbImage, Video } from '@/lib/tmdb/types';

const m = (id: number, extra: Partial<Movie> = {}): Movie => ({
  id,
  title: `M${id}`,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2024-05-01',
  vote_average: 7,
  vote_count: 1,
  popularity: 10,
  genre_ids: [],
  original_language: 'en',
  adult: false,
  ...extra,
});

describe('image helpers', () => {
  it('builds URLs and handles missing paths', () => {
    expect(tmdbImage('/a.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/a.jpg');
    expect(tmdbImage('a.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/a.jpg');
    expect(tmdbImage(null, 'w342')).toBeNull();
  });
  it('maps requested width → nearest valid TMDB size per kind', () => {
    expect(nearestSize('poster', 300)).toBe('w342');
    expect(nearestSize('poster', 342)).toBe('w342');
    expect(nearestSize('poster', 600)).toBe('w780');
    expect(nearestSize('poster', 5000)).toBe('original');
    expect(nearestSize('backdrop', 1000)).toBe('w1280');
    expect(nearestSize('profile', 300)).toBe('h632');
  });
  it('custom loader decodes kind:path sources', () => {
    expect(tmdbLoader({ src: encodeSrc('poster', '/x.jpg'), width: 384 })).toBe(
      'https://image.tmdb.org/t/p/w500/x.jpg',
    );
    expect(tmdbLoader({ src: '/local.png', width: 100 })).toBe('/local.png');
  });
  it('prefers English, then neutral, PNG, highest voted logos', () => {
    const logo = (p: string, lang: string | null, vote = 5): TmdbImage => ({
      file_path: p,
      width: 500,
      height: 200,
      aspect_ratio: 2.5,
      iso_639_1: lang,
      vote_average: vote,
      vote_count: 3,
    });
    expect(
      getBestLogo({
        logos: [logo('/fr.png', 'fr', 9), logo('/en.svg', 'en', 1), logo('/en.png', 'en', 2)],
      })?.file_path,
    ).toBe('/en.png');
    expect(getBestLogo({ logos: [logo('/fr.png', 'fr'), logo('/n.png', null)] })?.file_path).toBe(
      '/n.png',
    );
    expect(getBestLogo({ logos: [] })).toBeNull();
    expect(getBestLogo(null)).toBeNull();
  });
});

describe('proxy allowlist', () => {
  it('allows only whitelisted TMDB paths', () => {
    expect(isAllowedPath('search/multi')).toBe(true);
    expect(isAllowedPath('discover/movie')).toBe(true);
    expect(isAllowedPath('movie/123')).toBe(true);
    expect(isAllowedPath('movie/123/recommendations')).toBe(true);
    expect(isAllowedPath('account/1/favorite')).toBe(false);
    expect(isAllowedPath('person/1')).toBe(false);
    expect(isAllowedPath('../secret')).toBe(false);
  });
});

describe('colour, genres, languages, videos', () => {
  it('fallback glow is deterministic and within the palette', () => {
    expect(fallbackGlow(42)).toBe(fallbackGlow(42));
    expect(fallbackGlow('x')).toMatch(/^#[0-9a-f]{6}$/);
    expect(hexToRgbTriplet('#8b5cff')).toBe('139 92 255');
    expect(hexToRgbTriplet('nope')).toBe('139 92 255');
  });
  it('resolves genres and languages', () => {
    expect(genreBySlug('sci-fi')?.id).toBe(878);
    expect(genreById(28)?.name).toBe('Action');
    expect(genreNames([28, 35, 18, 99], 2)).toEqual(['Action', 'Comedy']);
    expect(getLanguage('ta')?.name).toBe('Tamil');
    expect(languageName('ko')).toBe('Korean');
    expect(languageName('de')).toBe('German');
  });
  it('picks official YouTube trailers first, newest first', () => {
    const v = (
      id: string,
      type: string,
      official: boolean,
      date: string,
      site = 'YouTube',
    ): Video => ({ id, key: `key${id}xx`, name: id, site, type, official, published_at: date });
    const out = pickVideos([
      v('a', 'Clip', true, '2024'),
      v('b', 'Trailer', false, '2024'),
      v('c', 'Trailer', true, '2023'),
      v('d', 'Trailer', true, '2022', 'Vimeo'),
      v('e', 'Teaser', true, '2025'),
    ]);
    expect(out.map((x) => x.id)).toEqual(['c', 'b', 'e', 'a']);
    expect(bestTrailer([])).toBeNull();
  });
});

describe('snapshots', () => {
  it('round-trips movie snapshots and labels cards accessibly', () => {
    const movie = m(7, {
      title: 'Dune: Part Two',
      release_date: '2024-03-01',
      vote_average: 8.2,
      genre_ids: [878],
    });
    const s = toSnapshot(movie);
    expect(s).toMatchObject({ movie_id: 7, title: 'Dune: Part Two', genre_ids: [878] });
    expect(fromSnapshot(s).id).toBe(7);
    expect(cardLabel(movie)).toBe('Dune: Part Two, 2024, rated 8.2');
    expect(cardLabel(m(1, { vote_average: 0, release_date: null }))).toBe('M1, not yet rated');
  });
});

describe('utils', () => {
  it('formats values', () => {
    expect(yearOf('2021-02-03')).toBe('2021');
    expect(yearOf(null)).toBe('');
    expect(formatRuntime(135)).toBe('2h 15m');
    expect(formatRuntime(45)).toBe('45m');
    expect(formatRuntime(null)).toBe('');
    expect(formatMoney(1500000)).toBe('$1,500,000');
    expect(formatMoney(0)).toBe('—');
    expect(truncate('hello world again', 12)).toBe('hello world…');
    expect(truncate('short', 12)).toBe('short');
    expect(slugify('Science Fiction & Fantasy')).toBe('science-fiction-and-fantasy');
    expect(clamp(5, 0, 3)).toBe(3);
    expect(matchPercent(9.9)).toBe(99);
    expect(matchPercent(1)).toBe(40);
  });
  it('detects new releases within 30 days', () => {
    const now = new Date('2026-09-29');
    expect(isNewRelease('2026-09-20', now)).toBe(true);
    expect(isNewRelease('2026-07-01', now)).toBe(false);
    expect(isNewRelease('2026-12-01', now)).toBe(false);
    expect(isNewRelease('bad', now)).toBe(false);
  });
  it('time-aware greeting', () => {
    expect(greetingFor(new Date('2026-01-01T23:30:00'))).toBe('Late-night show?');
    expect(greetingFor(new Date('2026-01-01T09:00:00'))).toBe('Morning matinee?');
    expect(greetingFor(new Date('2026-01-01T14:00:00'))).toBe('Afternoon screening?');
    expect(greetingFor(new Date('2026-01-01T19:00:00'))).toBe('Evening feature?');
  });
});

describe('recommendation ranking', () => {
  it('merges, dedupes, excludes and ranks by frequency × popularity', () => {
    const a = [m(1, { popularity: 10 }), m(2, { popularity: 500 }), m(3)];
    const b = [m(1, { popularity: 10 }), m(4, { popularity: 1000 })];
    const ranked = rankRecommendations([a, b, [m(1)]], new Set([3]));
    expect(ranked[0]?.id).toBe(1);
    expect(ranked.map((x) => x.id)).not.toContain(3);
    expect(new Set(ranked.map((x) => x.id)).size).toBe(ranked.length);
  });
  it('computes genre and language affinity', () => {
    const seeds = [
      { movie_id: 1, title: 'a', genre_ids: [28, 12], original_language: 'hi' },
      { movie_id: 2, title: 'b', genre_ids: [28], original_language: 'hi' },
      { movie_id: 3, title: 'c', genre_ids: [35], original_language: 'en' },
    ];
    expect(genreAffinity(seeds, 1)).toEqual([28]);
    expect(languageAffinity(seeds)).toBe('hi');
    expect(languageAffinity([])).toBeNull();
  });
});

describe('filters ⇄ URL', () => {
  it('round-trips and omits defaults', () => {
    expect(filtersToSearch(DEFAULT_FILTERS).toString()).toBe('');
    const f = { ...DEFAULT_FILTERS, sort: 'top' as const, from: 2000, rating: 7, lang: 'ko' };
    const sp = filtersToSearch(f);
    expect(parseFilters(sp)).toEqual(f);
    expect(activeFilterCount(f)).toBe(3);
  });
  it('rejects junk values', () => {
    const f = parseFilters(
      new URLSearchParams('sort=evil&from=abc&rating=99&lang=xxx&genre=1;drop'),
    );
    expect(f.sort).toBe('popular');
    expect(f.rating).toBe(9);
    expect(f.lang).toBeNull();
    expect(f.genre).toBeNull();
  });
  it('builds discover queries', () => {
    const q = discoverQuery({ ...DEFAULT_FILTERS, sort: 'new', runtimeMax: 120 }, { genre: 28 }, 2);
    expect(q.get('with_genres')).toBe('28');
    expect(q.get('page')).toBe('2');
    expect(q.get('with_runtime.lte')).toBe('120');
    expect(q.get('primary_release_date.lte')).toMatch(/^\d{4}-/);
  });
});

describe('moderation + auth copy', () => {
  it('masks profanity and strips control characters', () => {
    expect(maskProfanity('what the fuck')).toBe('what the f***');
    expect(containsProfanity('lovely film')).toBe(false);
    expect(containsProfanity('shit')).toBe(true);
    expect(cleanReviewBody('  hi\u0007 there  ')).toBe('hi there');
    expect(cleanReviewBody('x'.repeat(3000))).toHaveLength(2000);
  });
  it('scores passwords and validates signup', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc')).toBe(1);
    expect(passwordStrength('Abcdefgh12!xyz')).toBe(4);
    expect(SignupSchema.safeParse({ email: 'a@b.co', password: 'short' }).success).toBe(false);
    expect(SignupSchema.safeParse({ email: 'a@b.co', password: 'longenough1' }).success).toBe(true);
  });
  it('gives specific auth errors', () => {
    expect(authErrorMessage({ status: 429, message: 'x' })).toMatch(/Too many attempts/);
    expect(authErrorMessage({ message: 'User already registered' })).toBe(
      'That email already has an account. Log in instead.',
    );
    expect(authErrorMessage({ message: 'Invalid login credentials' })).toMatch(/don’t match/);
    expect(authErrorMessage(null)).toMatch(/Try again/);
  });
});

describe('rows, redirects and transitions', () => {
  it('home rows include language and genre rows with proxy URLs', () => {
    const rows = homeRows();
    expect(rows.find((r) => r.key === 'top10')?.ranked).toBe(true);
    expect(rows.some((r) => r.key === 'lang-ta')).toBe(true);
    expect(rows.some((r) => r.key === 'genre-horror')).toBe(true);
    expect(rowUrl({ path: 'discover/movie', params: { with_genres: 28 } }, 2)).toBe(
      '/api/tmdb/discover/movie?with_genres=28&page=2&with_meta=1',
    );
  });
  it('only allows same-origin next redirects', () => {
    expect(safeNext('/my-list')).toBe('/my-list');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext('/\\evil')).toBe('/');
    expect(isProtectedPath('/account')).toBe(true);
    expect(isProtectedPath('/movie/1')).toBe(false);
  });
  it('picks transition kinds', () => {
    expect(transitionKindFor('/login')).toBe('burn');
    expect(transitionKindFor('/login?next=/x')).toBe('burn');
    expect(transitionKindFor('/movie/1')).toBe('shutter');
  });
  it('does not intercept modified clicks, new tabs or external links', () => {
    const ev = (over: Partial<Record<string, unknown>> = {}) =>
      ({
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        currentTarget: { getAttribute: () => null },
        ...over,
      }) as unknown as React.MouseEvent<HTMLAnchorElement>;
    expect(shouldIntercept(ev(), '/movie/2')).toBe(true);
    expect(shouldIntercept(ev({ metaKey: true }), '/movie/2')).toBe(false);
    expect(shouldIntercept(ev(), 'https://x.com')).toBe(false);
    expect(
      shouldIntercept(ev({ currentTarget: { getAttribute: () => '_blank' } }), '/movie/2'),
    ).toBe(false);
  });
  it('never stacks transitions and never blocks navigation', async () => {
    const pushes: string[] = [];
    const off = onTransitionRequest(() => setTransitioning(true));
    expect(requestTransition({ href: '/a', kind: 'shutter', push: (h) => pushes.push(h) })).toBe(
      true,
    );
    expect(requestTransition({ href: '/b', kind: 'shutter', push: (h) => pushes.push(h) })).toBe(
      false,
    );
    setTransitioning(false);
    off();
    requestTransition({ href: '/c', kind: 'shutter', push: (h) => pushes.push(h) });
    expect(pushes).toEqual(['/c']);
    const ready = waitForPage(1000);
    signalPageReady('/c');
    await expect(ready).resolves.toBe('ready');
    await expect(waitForPage(10)).resolves.toBe('timeout');
  });
});
