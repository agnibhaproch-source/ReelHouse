'use client';

import { useRef } from 'react';
import type { TextTag } from './tags';
import { gsap, useGSAP } from '@/lib/gsap';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';

/** Words brighten 0.15 → 1 opacity, scrubbed by scroll (spec 32). Accessible text preserved. */
export function ScrubText({ text, as = 'p', className }: { text: string; as?: TextTag; className?: string }) {
  // Rendered as any intrinsic text tag; typed as div for ref compatibility.
  const Tag = as as 'div';
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  const words = text.split(/\s+/).filter(Boolean);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      gsap.fromTo(
        el.querySelectorAll('[data-w]'),
        { opacity: 0.15 },
        { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } },
      );
    },
    { scope: ref, dependencies: [reduced, text], revertOnUpdate: true },
  );
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} data-w aria-hidden="true">
          {w}{' '}
        </span>
      ))}
    </Tag>
  );
}
