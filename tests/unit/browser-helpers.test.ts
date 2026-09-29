import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPreloaderDone, markPreloaderDone, whenIntroReady } from '@/lib/intro';
import { setTransitioning, PAGE_INTRO_EVENT } from '@/lib/transition';
import { setNowPlaying, watchTitle } from '@/lib/tab-title';
import { loadYouTube } from '@/lib/youtube';
import { track } from '@/lib/analytics';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

describe('intro coordination (L1 moments never overlap)', () => {
  it('waits for the preloader, then for the page transition', async () => {
    const cb = vi.fn();
    whenIntroReady(cb);
    expect(cb).not.toHaveBeenCalled();
    markPreloaderDone();
    markPreloaderDone();
    expect(isPreloaderDone()).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);

    const during = vi.fn();
    setTransitioning(true);
    const cancel = whenIntroReady(during);
    expect(during).not.toHaveBeenCalled();
    window.dispatchEvent(new Event(PAGE_INTRO_EVENT));
    expect(during).toHaveBeenCalledTimes(1);
    cancel();
    setTransitioning(false);

    const immediate = vi.fn();
    whenIntroReady(immediate);
    await Promise.resolve();
    expect(immediate).toHaveBeenCalled();

    const cancelled = vi.fn();
    whenIntroReady(cancelled)();
    await Promise.resolve();
    expect(cancelled).not.toHaveBeenCalled();
  });
});

describe('tab title micro-interactions', () => {
  it('shows now-playing and intermission titles, then restores', async () => {
    document.head.innerHTML = '<title>Dune — Reelhouse</title><link rel="icon" href="/icon.svg">';
    const stop = watchTitle();
    setNowPlaying('Dune');
    expect(document.title).toBe('▶ Now playing: Dune');
    expect(document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href).toContain('data:image/svg+xml');
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(document.title).toBe('Intermission — come back');
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    setNowPlaying(null);
    expect(document.title).toBe('Dune — Reelhouse');
    expect(document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href).toContain('/icon.svg');
    stop();
  });
});

describe('YouTube loader', () => {
  afterEach(() => {
    delete window.YT;
    document.head.innerHTML = '';
  });
  it('injects the IFrame API once and resolves when ready', async () => {
    const p = loadYouTube();
    const p2 = loadYouTube();
    expect(document.querySelectorAll('script[src*="iframe_api"]')).toHaveLength(1);
    window.YT = { Player: vi.fn() as never, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } };
    window.onYouTubeIframeAPIReady?.();
    await expect(p).resolves.toBe(window.YT);
    await expect(p2).resolves.toBe(window.YT);
    await expect(loadYouTube()).resolves.toBe(window.YT);
  });
});

describe('analytics', () => {
  it('respects Do Not Track', async () => {
    const { track: vt } = await import('@vercel/analytics');
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, get: () => '1' });
    track('list_add', { movie_id: 1 });
    expect(vt).not.toHaveBeenCalled();
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, get: () => '0' });
    track('list_add', { movie_id: 1 });
    expect(vt).toHaveBeenCalledWith('list_add', { movie_id: 1 });
  });
});
