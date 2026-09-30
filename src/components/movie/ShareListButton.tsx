'use client';

import { Share2 } from 'lucide-react';
import { sharedListPath } from '@/lib/shared-list';
import { useProfileStore } from '@/stores/profile';
import { toast } from '@/stores/toast';
import { Button } from '@/components/ui/Button';

/** Shares My list as a link (native share sheet where available, clipboard otherwise). */
export function ShareListButton({ ids }: { ids: number[] }) {
  const profile = useProfileStore((s) => s.current);
  const share = async () => {
    const name = profile?.name ? `${profile.name}’s list` : 'My Reelhouse list';
    const url = `${window.location.origin}${sharedListPath(ids, name)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `${ids.length} films on Reelhouse`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied. Anyone with it can see this list.');
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') toast.error('Couldn’t share the list.');
    }
  };
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<Share2 />}
      iconAnim="share"
      magnetic={false}
      onClick={() => void share()}
    >
      Share list
    </Button>
  );
}
