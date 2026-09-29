'use client';

import { m } from 'motion/react';
import { useState } from 'react';
import { SPRING } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

/** Biography with "Read more" expanding via Motion `layout` (spec 27). Handles a missing bio. */
export function Biography({ text, name }: { text: string; name: string }) {
  const [open, setOpen] = useState(false);
  const { reduced } = useMotionPrefs();
  const long = text.length > 600;
  return (
    <section aria-labelledby="bio-h" className="px-gutter mx-auto max-w-4xl py-10" data-quotable>
      <h2 id="bio-h" className="font-display text-h2 mb-4">
        Biography
      </h2>
      {text ? (
        <m.div layout={!reduced} transition={SPRING} className="overflow-hidden">
          <m.p
            layout="position"
            className={cn(
              'measure text-reel/85 whitespace-pre-line',
              !open && long && 'line-clamp-6',
            )}
          >
            {text}
          </m.p>
          {long && (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="text-cyan mt-3 min-h-11 font-semibold hover:underline"
            >
              {open ? 'Read less' : 'Read more'}
            </button>
          )}
        </m.div>
      ) : (
        <p className="text-dim">We don’t have a biography for {name} yet.</p>
      )}
    </section>
  );
}
