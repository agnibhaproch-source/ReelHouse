'use client';

import { useEffect, useState } from 'react';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { cn } from '@/lib/utils';

/** Huge Fraunces title over a slow crossfading, darkened collage of 6 backdrops (spec 26). */
export function BrowseHeader({
  title,
  eyebrow,
  sub,
  backdrops,
}: {
  title: string;
  eyebrow: string;
  sub?: string;
  backdrops: string[];
}) {
  const [i, setI] = useState(0);
  const { reduced } = useMotionPrefs();
  const list = backdrops.slice(0, 6);

  useEffect(() => {
    if (reduced || list.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [reduced, list.length]);

  return (
    <header className="px-gutter relative isolate flex min-h-[62svh] items-end overflow-hidden pt-32 pb-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {list.map((b, k) => (
          <div
            key={b}
            className={cn(
              'ease-projector absolute inset-0 transition-opacity duration-[2400ms]',
              k === i ? 'opacity-100' : 'opacity-0',
            )}
          >
            <TmdbImage
              path={b}
              kind="backdrop"
              alt=""
              sizes="100vw"
              priority={k === 0}
              className={cn(
                'transition-transform duration-[8000ms] ease-linear',
                k === i && !reduced && 'scale-110',
              )}
            />
          </div>
        ))}
        <div className="bg-void/60 absolute inset-0" />
        <div className="from-void via-void/40 to-void/70 absolute inset-0 bg-gradient-to-t" />
      </div>
      <div>
        <p className="text-small text-cyan mb-2 font-semibold">{eyebrow}</p>
        <SplitHeading
          as="h1"
          by="chars"
          trigger="mount"
          className="font-display text-hero leading-[0.9]"
        >
          {title}
        </SplitHeading>
        {sub && <p className="text-dim mt-4 max-w-xl">{sub}</p>}
      </div>
    </header>
  );
}
