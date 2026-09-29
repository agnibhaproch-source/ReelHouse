'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';

/** y offset relative to scroll. speed < 1 lags the page, > 1 leads it (spec 32). */
export function Parallax({
  children,
  speed = 0.8,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const dist = (1 - speed) * 200;
      gsap.fromTo(
        ref.current,
        { y: -dist / 2 },
        {
          y: dist / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [reduced, speed], revertOnUpdate: true },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
