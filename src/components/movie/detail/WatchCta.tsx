'use client';

import { MonitorPlay } from 'lucide-react';
import type { WatchRegion } from '@/lib/tmdb/types';
import { useUiStore } from '@/stores/ui';
import { Button } from '@/components/ui/Button';

/**
 * "Watch on …" — the top streaming option in the viewer's region, linking out through JustWatch
 * (TMDB's provider data requires the JustWatch link). Hidden when nothing streams there.
 */
export function WatchCta({
  providers,
  title,
}: {
  providers: Record<string, WatchRegion> | undefined;
  title: string;
}) {
  const region = useUiStore((s) => s.region);
  const data = providers?.[region];
  const best = [...(data?.flatrate ?? []), ...(data?.free ?? [])].sort(
    (a, b) => a.display_priority - b.display_priority,
  )[0];
  if (!data || !best) return null;
  return (
    <Button
      href={data.link ?? 'https://www.justwatch.com/'}
      target="_blank"
      rel="noreferrer"
      size="lg"
      icon={<MonitorPlay />}
      aria-label={`Watch ${title} on ${best.provider_name} (opens JustWatch in a new tab)`}
    >
      Watch on {best.provider_name}
    </Button>
  );
}
