'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { createParty, joinParty, myParties, PARTY_CODE } from '@/lib/data/parties';
import { useSession } from '@/hooks/useSession';
import { toast } from '@/stores/toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TransitionLink } from '@/components/layout/TransitionLink';

/** Start a party, join one by code, or return to one you're in. */
export function PartyHub() {
  const { sb, user, profile } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const defaultName = profile?.name ?? user?.email?.split('@')[0] ?? 'Guest';
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);

  const parties = useQuery({
    queryKey: ['parties', user?.id],
    enabled: Boolean(sb && user),
    queryFn: () => myParties(sb!),
  });

  const create = async () => {
    if (!sb) return;
    setBusy('create');
    try {
      const c = await createParty(sb, name || `${defaultName}’s movie night`, defaultName);
      await qc.invalidateQueries({ queryKey: ['parties'] });
      router.push(`/party/${c}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };
  const join = async () => {
    const c = code.trim().toUpperCase();
    if (!sb || !PARTY_CODE.test(c)) return toast.error('Party codes are 6 letters and numbers.');
    setBusy('join');
    try {
      await joinParty(sb, c, defaultName);
      router.push(`/party/${c}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        className="rounded-modal border-line bg-seat lit-edge flex flex-col gap-5 border p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <PartyPopper className="text-violet size-7" aria-hidden="true" />
        <h2 className="font-display text-h3">Start a watch party</h2>
        <p className="text-dim">
          Share the code, add films together, and vote. The shortlist re-sorts live.
        </p>
        <Input
          label="Party name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder={`${defaultName}’s movie night`}
        />
        <Button type="submit" loading={busy === 'create'}>
          Start party
        </Button>
      </form>
      <form
        className="rounded-modal border-line bg-seat lit-edge flex flex-col gap-5 border p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          void join();
        }}
      >
        <h2 className="font-display text-h3">Join with a code</h2>
        <Input
          label="Party code"
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 6),
            )
          }
          autoCapitalize="characters"
          autoComplete="off"
          className="font-mono tracking-[0.3em]"
        />
        <Button
          type="submit"
          variant="secondary"
          icon={<ArrowRight />}
          loading={busy === 'join'}
          magnetic={false}
        >
          Join
        </Button>
        {parties.data && parties.data.length > 0 && (
          <div className="border-line mt-2 border-t pt-4">
            <p className="meta-caps text-dim mb-2">Your parties</p>
            <ul className="flex flex-col">
              {parties.data.map((p) => (
                <li key={p.id}>
                  <TransitionLink
                    href={`/party/${p.code}`}
                    className="hover:bg-reel/5 -mx-2 flex min-h-11 items-center justify-between rounded-md px-2"
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-dim font-mono text-[0.8rem] tracking-widest">
                      {p.code}
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
