import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PARTY_CODE } from '@/lib/data/parties';
import { PartyGate } from '@/components/party/PartyGate';
import { PartyRoom } from '@/components/party/PartyRoom';

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: 'Watch party', robots: { index: false } };

export default async function PartyRoomPage({ params }: Props) {
  const code = (await params).code.toUpperCase();
  if (!PARTY_CODE.test(code)) notFound();
  return (
    <div className="px-gutter mx-auto max-w-6xl pt-32 pb-16">
      <PartyGate next={`/party/${code}`}>
        <PartyRoom code={code} />
      </PartyGate>
    </div>
  );
}
