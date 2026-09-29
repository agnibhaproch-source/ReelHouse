import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCursorStore, isCursorMode } from '@/stores/cursor';
import { useUiStore, DEFAULT_SETTINGS, pickSettings } from '@/stores/ui';
import { useProfileStore, activeProfileId } from '@/stores/profile';
import { useToastStore, toast } from '@/stores/toast';
import { usePreviewStore } from '@/stores/preview';
import { useTrailerStore } from '@/stores/trailer';
import { localRepo, readGuestWatchlist, clearGuestWatchlist } from '@/lib/data/local';
import { enqueue, flush, pending } from '@/lib/data/queue';
import { readJSON, writeJSON, removeKey } from '@/lib/storage';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import type { MovieSnapshot } from '@/lib/data/types';

const snap = (id: number): MovieSnapshot => ({ movie_id: id, title: `T${id}`, poster_path: null, vote_average: id });

describe('cursor store', () => {
  beforeEach(() => useCursorStore.getState().reset());
  it('sets, locks and resets modes', () => {
    const s = useCursorStore.getState();
    s.setMode('play', 'Preview');
    expect(useCursorStore.getState()).toMatchObject({ mode: 'play', label: 'Preview' });
    s.lock('loading');
    s.setMode('link');
    expect(useCursorStore.getState().mode).toBe('loading');
    s.unlock();
    expect(useCursorStore.getState()).toMatchObject({ mode: 'default', locked: false });
    s.setMagnet({ x: 1, y: 2, width: 3, height: 4, radius: 5 });
    s.reset();
    expect(useCursorStore.getState().magnet).toBeNull();
    expect(isCursorMode('drag')).toBe(true);
    expect(isCursorMode('nope')).toBe(false);
  });
});

describe('ui store', () => {
  it('toggles and persists only experience settings', () => {
    const s = useUiStore.getState();
    s.toggle('soundOn');
    s.set('searchOpen', true);
    s.setSettings({ grain: 70 });
    const persisted = JSON.parse(localStorage.getItem('reelhouse-ui') ?? '{}') as { state: Record<string, unknown> };
    expect(persisted.state.soundOn).toBe(!DEFAULT_SETTINGS.soundOn);
    expect(persisted.state.grain).toBe(70);
    expect(persisted.state).not.toHaveProperty('searchOpen');
    expect(Object.keys(pickSettings(useUiStore.getState())).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
  });
});

describe('profile, toast, preview and trailer stores', () => {
  it('profile id falls back to guest', () => {
    expect(activeProfileId(null)).toBe('guest');
    useProfileStore.getState().setCurrent({ id: 'p1', user_id: null, name: 'A', avatar: 'reel', is_kids: false, language: 'en-US', settings: {}, created_at: '' });
    expect(activeProfileId(useProfileStore.getState().current)).toBe('p1');
  });
  it('toasts push, cap and dismiss', () => {
    for (let i = 0; i < 6; i++) toast.info(`t${i}`);
    expect(useToastStore.getState().toasts.length).toBeLessThanOrEqual(4);
    const id = toast.error('boom');
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts.some((t) => t.id === id)).toBe(false);
  });
  it('preview and trailer stores open and close', () => {
    const rect = new DOMRect(0, 0, 10, 10);
    usePreviewStore.getState().open({ id: 1 } as never, rect, 'keyboard');
    expect(usePreviewStore.getState().source).toBe('keyboard');
    usePreviewStore.getState().close();
    expect(usePreviewStore.getState().movie).toBeNull();
    useTrailerStore.getState().open(snap(1), { color: '#fff' });
    expect(useTrailerStore.getState().color).toBe('#fff');
    useTrailerStore.getState().close();
    expect(useTrailerStore.getState().movie).toBeNull();
  });
});

describe('storage', () => {
  it('reads/writes JSON safely', () => {
    writeJSON('k', { a: 1 });
    expect(readJSON('k', null)).toEqual({ a: 1 });
    localStorage.setItem('bad', '{');
    expect(readJSON('bad', 'fallback')).toBe('fallback');
    removeKey('k');
    expect(readJSON('k', 0)).toBe(0);
    writeJSON('s', true, 'session');
    expect(readJSON('s', false, 'session')).toBe(true);
  });
});

describe('local (guest) repo', () => {
  it('manages profiles with a 5-profile cap', async () => {
    for (let i = 0; i < 5; i++) await localRepo.profiles.create({ name: `P${i}`, avatar: 'reel', is_kids: false, language: 'en-US' });
    await expect(localRepo.profiles.create({ name: 'P6', avatar: 'reel', is_kids: false, language: 'en-US' })).rejects.toThrow(/up to 5/);
    const [first] = await localRepo.profiles.list();
    const updated = await localRepo.profiles.update(first!.id, { name: 'Renamed', settings: { grain: 10 } });
    expect(updated).toMatchObject({ name: 'Renamed', settings: { grain: 10 } });
    await localRepo.profiles.remove(first!.id);
    expect(await localRepo.profiles.list()).toHaveLength(4);
    await expect(localRepo.profiles.update('missing', {})).rejects.toThrow();
  });

  it('watchlist adds without duplicates, removes and reorders', async () => {
    await localRepo.watchlist.add('p', snap(1));
    await localRepo.watchlist.add('p', snap(2));
    await localRepo.watchlist.add('p', snap(1));
    expect((await localRepo.watchlist.list('p')).map((w) => w.movie_id)).toEqual([2, 1]);
    await localRepo.watchlist.reorder('p', [1, 2]);
    expect((await localRepo.watchlist.list('p')).map((w) => w.movie_id)).toEqual([1, 2]);
    await localRepo.watchlist.remove('p', 1);
    expect(await localRepo.watchlist.list('p')).toHaveLength(1);
  });

  it('history keeps the max trailer progress, moves re-views to the front, clears', async () => {
    await localRepo.history.record('p', snap(1), 'trailer', 0.4);
    await localRepo.history.record('p', snap(2), 'view');
    await localRepo.history.record('p', snap(1), 'view', 0.1);
    const h = await localRepo.history.list('p');
    expect(h[0]).toMatchObject({ movie_id: 1, kind: 'trailer', progress: 0.4 });
    await localRepo.history.remove('p', 2);
    expect(await localRepo.history.list('p')).toHaveLength(1);
    await localRepo.history.clear('p');
    expect(await localRepo.history.list('p')).toHaveLength(0);
  });

  it('ratings and averages', async () => {
    await localRepo.ratings.set('guest', 5, 8);
    expect(await localRepo.ratings.all('guest')).toEqual({ 5: 8 });
    expect(await localRepo.ratings.average(5)).toEqual({ average: 8, count: 1 });
    await localRepo.ratings.set('guest', 5, null);
    expect(await localRepo.ratings.all('guest')).toEqual({});
  });

  it('reviews: create, edit own only, like, delete; bodies are cleaned', async () => {
    const r = await localRepo.reviews.upsert(null, 'me', { movie_id: 9, body: '  great shit  ', spoiler: true });
    expect(r.body).toBe('great s***');
    const other = await localRepo.reviews.upsert(null, 'someone', { id: r.id, movie_id: 9, body: 'hijack', spoiler: false });
    expect(other.id).not.toBe(r.id);
    await localRepo.reviews.like('me', other.id, true);
    const list = await localRepo.reviews.list(9, 'me');
    expect(list.find((x) => x.id === other.id)).toMatchObject({ likes: 1, liked: true });
    await localRepo.reviews.remove('someone-else', r.id);
    expect(await localRepo.reviews.list(9, 'me')).toHaveLength(2);
    await localRepo.reviews.remove('me', r.id);
    expect(await localRepo.reviews.list(9, 'me')).toHaveLength(1);
    await localRepo.reviews.report('me', other.id, 'spam');
  });

  it('guest watchlist helpers', async () => {
    await localRepo.watchlist.add('guest', snap(3));
    expect(readGuestWatchlist()).toHaveLength(1);
    clearGuestWatchlist();
    expect(readGuestWatchlist()).toHaveLength(0);
  });
});

describe('offline queue', () => {
  it('collapses ops per title and replays them', async () => {
    enqueue({ op: 'add', profileId: 'p', movie: snap(1) });
    enqueue({ op: 'remove', profileId: 'p', movieId: 1 });
    enqueue({ op: 'add', profileId: 'p', movie: snap(2) });
    expect(pending()).toHaveLength(2);
    const done = await flush(localRepo);
    expect(done).toBe(2);
    expect((await localRepo.watchlist.list('p')).map((w) => w.movie_id)).toEqual([2]);
    expect(pending()).toHaveLength(0);
    expect(await flush(localRepo)).toBe(0);
  });

  it('keeps failed ops', async () => {
    enqueue({ op: 'add', profileId: 'p', movie: snap(4) });
    const broken = { ...localRepo, watchlist: { ...localRepo.watchlist, add: vi.fn().mockRejectedValue(new Error('x')) } };
    expect(await flush(broken)).toBe(0);
    expect(pending()).toHaveLength(1);
  });
});

describe('useMotionPrefs', () => {
  it('combines the OS setting with the in-app toggle', () => {
    const { result } = renderHook(() => useMotionPrefs());
    expect(result.current.reduced).toBe(false);
    act(() => useUiStore.getState().setSettings({ reducedMotion: true }));
    const { result: r2 } = renderHook(() => useMotionPrefs());
    expect(r2.current.reduced).toBe(true);
    expect(r2.current.cursorEnabled).toBe(false);
    expect(r2.current.smoothScroll).toBe(false);
    act(() => useUiStore.getState().setSettings({ reducedMotion: false }));
  });

  it('reflects OS reduced motion', () => {
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...mm(q), matches: q.includes('reduce') })) as typeof window.matchMedia;
    const { result } = renderHook(() => useMotionPrefs());
    expect(result.current.osReduced).toBe(true);
    expect(result.current.reduced).toBe(true);
    window.matchMedia = mm;
  });
});
