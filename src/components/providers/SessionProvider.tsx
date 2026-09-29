'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { localRepo, readGuestWatchlist, clearGuestWatchlist } from '@/lib/data/local';
import { createSupabaseRepo } from '@/lib/data/supabase';
import { flush } from '@/lib/data/queue';
import type { Profile } from '@/lib/data/types';
import { SessionContext, type SessionValue } from '@/hooks/useSession';
import { activeProfileId, useProfileStore } from '@/stores/profile';
import { toast } from '@/stores/toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

/** Auth + active profile + persistence backend (specs 50–52). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const sb = getSupabaseBrowser();
  const router = useRouter();
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!sb);
  const profile = useProfileStore((s) => s.current);
  const setCurrent = useProfileStore((s) => s.setCurrent);
  const [mergeHandledFor, setMergeHandledFor] = useState<string | null>(null);

  useEffect(() => {
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data } = sb.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [sb]);

  const repo = useMemo(() => (sb && user ? createSupabaseRepo(sb, user.id) : localRepo), [sb, user]);

  // A stored profile must belong to the current identity.
  useEffect(() => {
    if (!ready || !profile) return;
    const belongs = user ? profile.user_id === user.id : profile.user_id === null;
    if (!belongs) setCurrent(null);
  }, [ready, user, profile, setCurrent]);

  // Offer to keep titles saved as a guest after signing in (spec 52).
  const mergeCount =
    user && profile && profile.user_id === user.id && mergeHandledFor !== profile.id ? readGuestWatchlist().length : 0;

  // Replay offline watchlist writes when back online.
  useEffect(() => {
    const onOnline = () =>
      void flush(repo).then((n) => {
        if (n) {
          toast.success(`Synced ${n} change${n > 1 ? 's' : ''} to your list`);
          void qc.invalidateQueries({ queryKey: ['watchlist'] });
        }
      });
    window.addEventListener('online', onOnline);
    if (navigator.onLine) onOnline();
    return () => window.removeEventListener('online', onOnline);
  }, [repo, qc]);

  const selectProfile = useCallback(
    (p: Profile | null) => {
      const kidsChanged = Boolean(p?.is_kids) !== Boolean(useProfileStore.getState().current?.is_kids);
      setCurrent(p);
      if (kidsChanged) router.refresh();
    },
    [setCurrent, router],
  );

  const signOut = useCallback(async () => {
    await sb?.auth.signOut();
    setCurrent(null);
    qc.clear();
    router.push('/');
    router.refresh();
  }, [sb, setCurrent, qc, router]);

  const mergeGuest = async (keep: boolean) => {
    const pid = activeProfileId(profile);
    if (keep) {
      const items = readGuestWatchlist();
      const existing = new Set((await repo.watchlist.list(pid)).map((w) => w.movie_id));
      for (const w of items.reverse()) if (!existing.has(w.movie_id)) await repo.watchlist.add(pid, w);
      void qc.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(`Kept ${items.length} title${items.length > 1 ? 's' : ''} in your list`);
    }
    clearGuestWatchlist();
    setMergeHandledFor(profile?.id ?? null);
  };

  const value: SessionValue = {
    ready,
    user,
    repo,
    profile,
    profileId: activeProfileId(profile),
    accountsEnabled: isSupabaseConfigured(),
    selectProfile,
    signOut,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      <Modal open={mergeCount > 0} onClose={() => void mergeGuest(false)} title={`Keep the ${mergeCount} title${mergeCount > 1 ? 's' : ''} you saved?`} description="You added these to your list before signing in.">
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => void mergeGuest(true)} data-autofocus>
            Keep them
          </Button>
          <Button variant="ghost" onClick={() => void mergeGuest(false)}>
            Discard
          </Button>
        </div>
      </Modal>
    </SessionContext.Provider>
  );
}
