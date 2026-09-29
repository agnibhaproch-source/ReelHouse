'use client';

import { useEffect, useState } from 'react';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { cn } from '@/lib/utils';

/** Huge Fraunces title over a slow crossfading, darkened collage of 6 backdrops (spec 26). */
export function BrowseHeader({ title, eyebrow, sub, backdrops }: { title: string; eyebrow: string; sub?: string; backdrops: string[] }) {
  const [i, setI] = useState(0);
  const { reduced } = useMotionPrefs();
  const list = backdrops.slice(0, 6);

  useEffect(() => {
    if (reduced || list.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [reduced, list.length]);

  return (
    <header className="relative isolate flex min-h-[62svh] items-end overflow-hidden px-gutter pt-32 pb-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {list.map((b, k) => (
          <div key={b} className={cn('absolute inset-0 transition-opacity duration-[2400ms] ease-projector', k === i ? 'opacity-100' : 'opacity-0')}>
            <TmdbImage path={b} kind="backdrop" alt="" sizes="100vw" priority={k === 0} className={cn('transition-transform duration-[8000ms] ease-linear', k === i && !reduced && 'scale-110')} />
          </div>
        ))}
        <div className="absolute inset-0 bg-void/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/70" />
      </div>
      <div>
        <p className="mb-2 text-small font-semibold text-cyan">{eyebrow}</p>
        <SplitHeading as="h1" by="chars" trigger="mount" className="font-display text-hero leading-[0.9]">
          {title}
        </SplitHeading>
        {sub && <p className="mt-4 max-w-xl text-dim">{sub}</p>}
      </div>
    </header>
  );
}
