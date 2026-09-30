import type { Metadata } from 'next';
import { PartyGate } from '@/components/party/PartyGate';
import { PartyHub } from '@/components/party/PartyHub';

export const metadata: Metadata = {
  title: 'Watch party',
  description: 'Pick a film together: a shared shortlist friends vote on in real time.',
  robots: { index: false },
};

export default function PartyPage() {
  return (
    <div className="px-gutter mx-auto max-w-5xl pt-32 pb-16">
      <p className="meta-caps text-dim">Watch party</p>
      <h1 className="font-display text-h1 mt-2 mb-10">Decide together.</h1>
      <PartyGate next="/party">
        <PartyHub />
      </PartyGate>
    </div>
  );
}
