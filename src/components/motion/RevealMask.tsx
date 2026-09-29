'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

/** Clip-path inset reveal — the image wipes open (spec 32). */
export function RevealMask({ children, className, direction = 'up' }: { children: ReactNode; className?: string; direction?: 'up' | 'left' }) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  useGSAP(
    () => {
      if (!ref.current) return;
      if (reduced) {
        gsap.from(ref.current, { autoAlpha: 0, duration: DUR.fast, scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true } });
        return;
      }
      gsap.fromTo(
        ref.current,
        { clipPath: direction === 'up' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.cinematic, ease: 'projector', scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } },
      );
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );
  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      {children}
    </div>
  );
}
