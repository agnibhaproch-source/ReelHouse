import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseRepo } from '@/lib/data/supabase';

type Result = { data: unknown; error: { message: string } | null };

/** Chainable, thenable fake of the supabase-js query builder that records every call. */
function fakeClient(responses: Result[]) {
  const calls: { table: string; ops: [string, unknown[]][] }[] = [];
  const rpcCalls: [string, unknown][] = [];
  const next = (): Result => responses.shift() ?? { data: null, error: null };
  const builder = (table: string) => {
    const entry = { table, ops: [] as [string, unknown[]][] };
    calls.push(entry);
    const b: Record<string, unknown> = {};
    for (const m of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order', 'limit', 'single', 'maybeSingle']) {
      b[m] = (...args: unknown[]) => {
        entry.ops.push([m, args]);
        return b;
      };
    }
    b.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(next()).then(resolve, reject);
    return b;
  };
  const client = {
    from: (t: string) => builder(t),
    rpc: (fn: string, args: unknown) => {
      rpcCalls.push([fn, args]);
      return Promise.resolve(next());
    },
  } as unknown as SupabaseClient;
  return { client, calls, rpcCalls };
}

const ok = (data: unknown): Result => ({ data, error: null });

describe('supabase repo', () => {
  it('profiles: list/create/update(merging settings)/remove', async () => {
    const { client, calls } = fakeClient([ok([{ id: 'p' }]), ok({ id: 'p2' }), ok({ settings: { grain: 1 } }), ok({ id: 'p', settings: { grain: 1, webgl: false } }), ok(null)]);
    const repo = createSupabaseRepo(client, 'user-1');
    expect(await repo.profiles.list()).toEqual([{ id: 'p' }]);
    await repo.profiles.create({ name: 'A', avatar: 'reel', is_kids: false, language: 'en-US' });
    expect(calls[1]?.ops[0]).toEqual(['insert', [{ name: 'A', avatar: 'reel', is_kids: false, language: 'en-US', user_id: 'user-1' }]]);
    await repo.profiles.update('p', { settings: { webgl: false } });
    const upd = calls[3]?.ops.find(([m]) => m === 'update');
    expect(upd?.[1][0]).toEqual({ settings: { grain: 1, webgl: false } });
    await repo.profiles.remove('p');
    expect(calls[4]?.ops.map(([m]) => m)).toEqual(['delete', 'eq']);
  });

  it('surfaces errors as exceptions', async () => {
    const { client } = fakeClient([{ data: null, error: { message: 'You can have up to 5 profiles.' } }]);
    await expect(createSupabaseRepo(client, 'u').profiles.create({ name: 'x', avatar: 'reel', is_kids: false, language: 'en-US' })).rejects.toThrow(/up to 5/);
  });

  it('watchlist add prepends via position and ignores duplicates', async () => {
    const { client, calls } = fakeClient([ok([{ position: 3 }]), ok({ movie_id: 1 }), ok(null), ok(null), ok([])]);
    const repo = createSupabaseRepo(client, 'u');
    await repo.watchlist.add('p', { movie_id: 1, title: 'T', poster_path: null });
    const upsert = calls[1]?.ops.find(([m]) => m === 'upsert');
    expect(upsert?.[1][0]).toMatchObject({ movie_id: 1, profile_id: 'p', position: 2 });
    expect(upsert?.[1][1]).toEqual({ onConflict: 'profile_id,movie_id', ignoreDuplicates: true });
    await repo.watchlist.remove('p', 1);
    await repo.watchlist.reorder('p', [5]);
    await repo.watchlist.list('p');
    expect(calls.map((c) => c.table)).toEqual(['watchlist', 'watchlist', 'watchlist', 'watchlist', 'watchlist']);
  });

  it('history keeps trailer kind and max progress', async () => {
    const { client, calls } = fakeClient([ok({ kind: 'trailer', progress: 0.7 }), ok(null), ok([]), ok(null), ok(null)]);
    const repo = createSupabaseRepo(client, 'u');
    await repo.history.record('p', { movie_id: 1, title: 'T', poster_path: null }, 'view', 0.2);
    const upsert = calls[1]?.ops.find(([m]) => m === 'upsert');
    expect(upsert?.[1][0]).toMatchObject({ kind: 'trailer', progress: 0.7 });
    await repo.history.list('p');
    await repo.history.remove('p', 1);
    await repo.history.clear('p');
  });

  it('ratings: all/set/clear/average via RPC', async () => {
    const { client, rpcCalls } = fakeClient([ok([{ movie_id: 3, score: 8 }]), ok(null), ok(null), ok([{ average: '7.50', count: '2' }])]);
    const repo = createSupabaseRepo(client, 'u');
    expect(await repo.ratings.all('p')).toEqual({ 3: 8 });
    await repo.ratings.set('p', 3, 9);
    await repo.ratings.set('p', 3, null);
    expect(await repo.ratings.average(3)).toEqual({ average: 7.5, count: 2 });
    expect(rpcCalls[0]).toEqual(['movie_rating_average', { p_movie_id: 3 }]);
  });

  it('reviews: list via RPC, upsert cleans body, like/unlike, report, delete', async () => {
    const { client, calls, rpcCalls } = fakeClient([
      ok([{ id: 'r', profile_id: 'p', profile_name: 'A', avatar: 'reel', movie_id: 1, body: 'b', spoiler: false, created_at: '', updated_at: '', likes: '4', liked: true }]),
      ok({ id: 'r2', profile_id: 'p', movie_id: 1, body: 'x', spoiler: false, created_at: '', updated_at: '' }),
      ok(null),
      ok(null),
      ok(null),
      ok(null),
    ]);
    const repo = createSupabaseRepo(client, 'u');
    const list = await repo.reviews.list(1, 'p');
    expect(list[0]?.likes).toBe(4);
    expect(rpcCalls[0]).toEqual(['get_reviews', { p_movie_id: 1, p_viewer: 'p' }]);
    const saved = await repo.reviews.upsert(null, 'p', { movie_id: 1, body: ' shit film ', spoiler: false });
    expect(calls[0]?.ops.find(([m]) => m === 'upsert')?.[1][0]).toMatchObject({ body: 's*** film' });
    expect(saved.profile_name).toBe('You');
    await repo.reviews.like('p', 'r', true);
    await repo.reviews.like('p', 'r', false);
    await repo.reviews.report('p', 'r', 'spam');
    await repo.reviews.remove('p', 'r');
    expect(calls.map((c) => c.table)).toEqual(['reviews', 'review_likes', 'review_likes', 'review_reports', 'reviews']);
  });
});
