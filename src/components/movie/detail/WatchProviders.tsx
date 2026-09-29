'use client';

import type { Provider, WatchRegion } from '@/lib/tmdb/types';
import { REGIONS } from '@/lib/tmdb/languages';
import { useUiStore } from '@/stores/ui';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Tooltip } from '@/components/ui/Tooltip';
import { SplitHeading } from '@/components/motion/SplitHeading';

const GROUPS: { key: keyof WatchRegion; label: string }[] = [
  { key: 'flatrate', label: 'Stream' },
  { key: 'free', label: 'Free' },
  { key: 'ads', label: 'With ads' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

/** Where to watch (spec 24.6) for the viewer's region (IN default) + JustWatch attribution. */
export function WatchProviders({ providers, title }: { providers: Record<string, WatchRegion>; title: string }) {
  const region = useUiStore((s) => s.region);
  const data = providers[region];
  const regionName = REGIONS.find((r) => r.value === region)?.label ?? region;
  const groups = data ? GROUPS.map((g) => ({ ...g, list: (data[g.key] as Provider[] | undefined) ?? [] })).filter((g) => g.list.length) : [];

  return (
    <section aria-labelledby="providers-h" className="px-gutter py-12">
      <SplitHeading id="providers-h" className="mb-2 font-display text-h2">
        Where to watch
      </SplitHeading>
      <p className="mb-6 text-small text-dim">
        In {regionName}. Change your region in <a href="/account" className="underline underline-offset-4 hover:text-cyan">settings</a>.
      </p>
      {groups.length ? (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.key}>
              <h3 className="mb-3 font-ui text-small font-bold text-reel">{g.label}</h3>
              <ul className="flex flex-wrap gap-3">
                {g.list
                  .sort((a, b) => a.display_priority - b.display_priority)
                  .map((p) => (
                    <li key={p.provider_id}>
                      <Tooltip content={p.provider_name}>
                        <a
                          href={data?.link ?? 'https://www.justwatch.com/'}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${g.label} ${title} on ${p.provider_name} (opens JustWatch in a new tab)`}
                          className="relative block size-14 overflow-hidden rounded-[12px] bg-seat ring-1 ring-line transition-[scale,box-shadow] duration-base ease-snap hover:scale-110 hover:ring-violet"
                        >
                          <TmdbImage path={p.logo_path} kind="logo" alt="" sizes="56px" />
                        </a>
                      </Tooltip>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-reel/80">Not streaming in {regionName} right now.</p>
      )}
      <p className="mt-6 text-[0.75rem] text-dim">
        Availability data provided by{' '}
        <a href="https://www.justwatch.com/" target="_blank" rel="noreferrer" className="font-semibold text-reel underline-offset-4 hover:underline">
          JustWatch
        </a>
        .
      </p>
    </section>
  );
}
