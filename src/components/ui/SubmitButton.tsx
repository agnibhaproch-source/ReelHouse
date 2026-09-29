'use client';

import { AnimatePresence, m } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DUR, EASES, SPRING } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { FilmReelSpinner } from './FilmReelSpinner';

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Submit morph (spec 34): button width morphs into a circle spinner → check, or shakes with a
 * red hairline flash on error. Disabled while pending (no double submit).
 */
export function SubmitButton({
  state,
  children,
  className,
}: {
  state: SubmitState;
  children: string;
  className?: string;
}) {
  const { reduced } = useMotionPrefs();
  const round = state === 'loading' || state === 'success';
  return (
    <m.button
      type="submit"
      layout={!reduced}
      transition={SPRING}
      disabled={state === 'loading' || state === 'success'}
      aria-busy={state === 'loading' || undefined}
      data-cursor="link"
      className={cn(
        'bg-violet text-void duration-fast relative mx-auto flex h-12 items-center justify-center overflow-hidden font-semibold transition-colors disabled:cursor-default',
        round ? 'w-12 rounded-full' : 'rounded-pill w-full',
        state === 'success' && 'bg-success',
        state === 'error' && 'shake',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'loading' ? (
          <m.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FilmReelSpinner className="size-5" label="Working" />
          </m.span>
        ) : state === 'success' ? (
          <m.span
            key="s"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: DUR.base, ease: EASES.snap }}
          >
            <Check className="size-5" aria-label="Done" />
          </m.span>
        ) : (
          <m.span
            key="t"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="whitespace-nowrap"
          >
            {children}
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );
}
