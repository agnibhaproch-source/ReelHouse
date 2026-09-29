'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

interface PinSceneProps {
  children: ReactNode;
  className?: string;
  /** Scroll distance while pinned, in viewport heights. */
  length?: number;
  /** Build the scrubbed timeline. Receives the pinned element. */
  build: (tl: gsap.core.Timeline, el: HTMLElement) => void;
  /** Called instead when pinning is off (< 768px or reduced motion). */
  fallback?: (el: HTMLElement) => void;
}

/** Pins a section and exposes a scrubbed timeline; pins disabled < 768px (spec 32). */
export function PinScene({ children, className, length = 2, build, fallback }: PinSceneProps) {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (ctx) => {
        if (ctx.conditions?.mobile || reduced) {
          fallback?.(el);
          return;
        }
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${window.innerHeight * length}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        build(tl, el);
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );
  return (
    <section ref={ref} className={cn('relative', className)}>
      {children}
    </section>
  );
}
