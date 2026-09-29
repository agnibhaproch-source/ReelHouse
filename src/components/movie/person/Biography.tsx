'use client';

import { motion } from 'motion/react';
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
    <section aria-labelledby="bio-h" className="mx-auto max-w-4xl px-gutter py-10" data-quotable>
      <h2 id="bio-h" className="mb-4 font-display text-h2">
        Biography
      </h2>
      {text ? (
        <motion.div layout={!reduced} transition={SPRING} className="overflow-hidden">
          <motion.p layout="position" className={cn('measure whitespace-pre-line text-reel/85', !open && long && 'line-clamp-6')}>
            {text}
          </motion.p>
          {long && (
            <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-3 min-h-11 font-semibold text-cyan hover:underline">
              {open ? 'Read less' : 'Read more'}
            </button>
          )}
        </motion.div>
      ) : (
        <p className="text-dim">We don’t have a biography for {name} yet.</p>
      )}
    </section>
  );
}
