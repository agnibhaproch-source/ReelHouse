'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

/**
 * Vertical scroll drives horizontal translate of the track (spec 32). Below 768px or with reduced
 * motion the track becomes a native horizontal scroller instead of a pin.
 */
export function HorizontalScene({
  children,
  className,
  trackClassName,
  label,
}: {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  label: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  useGSAP(
    () => {
      const el = ref.current;
      const tr = track.current;
      if (!el || !tr) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        if (reduced) return;
        const distance = () => Math.max(0, tr.scrollWidth - el.clientWidth);
        if (distance() < 40) return;
        gsap.to(tr, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );
  return (
    <section ref={ref} aria-label={label} className={cn('relative overflow-hidden', className)}>
      <div
        ref={track}
        className={cn(
          'px-gutter flex w-max gap-6 max-md:w-full max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto',
          reduced && 'w-full overflow-x-auto',
          trackClassName,
        )}
        data-lenis-prevent-horizontal
      >
        {children}
      </div>
    </section>
  );
}
