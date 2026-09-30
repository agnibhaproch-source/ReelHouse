'use client';

import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/layout/EmptyState';
import { GridSkeleton } from '@/components/ui/Skeleton';

/** Watch parties need accounts: explains guest-only deployments, asks signed-out viewers to sign in. */
export function PartyGate({ next, children }: { next: string; children: ReactNode }) {
  const { ready, accountsEnabled, user } = useSession();
  if (!ready) return <GridSkeleton count={6} />;
  if (!accountsEnabled)
    return (
      <EmptyState
        title="Watch parties need accounts."
        body="This deployment runs in guest mode. Connect Supabase (see the README) to vote on films together in real time."
      />
    );
  if (!user)
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
        <span className="bg-violet/15 text-violet grid size-14 place-items-center rounded-full">
          <Users className="size-6" aria-hidden="true" />
        </span>
        <h2 className="font-display text-h3">Sign in to start or join a watch party.</h2>
        <p className="text-dim">
          Everyone adds films, everyone votes, and the shortlist sorts itself live.
        </p>
        <Button href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Button>
      </div>
    );
  return <>{children}</>;
}
