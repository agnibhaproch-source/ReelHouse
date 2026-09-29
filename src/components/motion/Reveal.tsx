'use client';

import { useRef, type ReactNode } from 'react';
import type { TextTag } from './tags';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR, STAGGER } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  as?: TextTag;
  className?: string;
  /** Stagger direct children (max 8 staggered, the rest appear together). */
  stagger?: boolean;
  delay?: number;
  y?: number;
  start?: string;
}

/** Fade + rise 40px on enter, `reel` ease, once, start `top 85%` (spec 32). */
export function Reveal({
  children,
  as = 'div',
  className,
  stagger,
  delay = 0,
  y = 40,
  start = 'top 85%',
}: RevealProps) {
  // Rendered as any intrinsic text tag; typed as div for ref compatibility.
  const Tag = as as 'div';
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = stagger ? (Array.from(el.children) as HTMLElement[]) : [el];
      const staggered = targets.slice(0, STAGGER.maxItems);
      const rest = targets.slice(STAGGER.maxItems);
      const from = reduced ? { opacity: 0 } : { opacity: 0, y };
      const to = { opacity: 1, y: 0, duration: reduced ? DUR.fast : DUR.slow, ease: 'reel', delay };
      gsap.set(targets, from);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start, once: true } });
      tl.to(staggered, { ...to, stagger: STAGGER.base });
      if (rest.length) tl.to(rest, to, `<${STAGGER.base * STAGGER.maxItems}`);
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} className={cn('reveal-root', className)}>
      {children}
    </Tag>
  );
}
