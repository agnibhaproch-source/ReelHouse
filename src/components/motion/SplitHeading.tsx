'use client';

import { useRef } from 'react';
import type { TextTag } from './tags';
import { gsap, useGSAP } from '@/lib/gsap';
import { loadSplitText } from '@/lib/split';
import { DUR, STAGGER } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

interface SplitHeadingProps {
  children: string;
  as?: TextTag;
  className?: string;
  /** chars for h1s, words for h2s, lines for paragraphs (spec 38). */
  by?: 'chars' | 'words' | 'lines';
  /** `scroll` reveals on enter; `mount` plays immediately (after `delay`). */
  trigger?: 'scroll' | 'mount';
  delay?: number;
  id?: string;
  tabIndex?: number;
}

/**
 * SplitText in masks; pieces rise with a 30ms stagger; re-splits on resize (autoSplit).
 * The original text stays accessible (SplitText aria: 'auto').
 */
export function SplitHeading({
  children,
  as = 'h2',
  className,
  by = 'words',
  trigger = 'scroll',
  delay = 0,
  id,
  tabIndex,
}: SplitHeadingProps) {
  // Rendered as any intrinsic text tag; typed as div for ref compatibility.
  const Tag = as as 'div';
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    (context) => {
      const el = ref.current;
      if (!el) return;
      if (reduced) {
        gsap.from(el, {
          opacity: 0,
          duration: DUR.fast,
          delay,
          scrollTrigger:
            trigger === 'scroll' ? { trigger: el, start: 'top 90%', once: true } : undefined,
        });
        return;
      }
      let played = false;
      let cancelled = false;
      void loadSplitText().then((SplitText) => {
        if (cancelled) return;
        context.add(() => {
          SplitText.create(el, {
            type: by === 'chars' ? 'words,chars' : by,
            mask: by === 'chars' ? 'words' : by,
            // aria-label is only valid on headings; other tags keep their text readable.
            aria: /^h[1-6]$/.test(as) ? 'auto' : 'none',
            autoSplit: true,
            onSplit(self) {
              const pieces = by === 'chars' ? self.chars : by === 'words' ? self.words : self.lines;
              if (played) return gsap.set(pieces, { yPercent: 0 });
              return gsap.from(pieces, {
                yPercent: 110,
                duration: DUR.slow,
                ease: 'reel',
                stagger: by === 'lines' ? STAGGER.loose : STAGGER.tight,
                delay,
                onComplete: () => {
                  played = true;
                },
                scrollTrigger:
                  trigger === 'scroll' ? { trigger: el, start: 'top 88%', once: true } : undefined,
              });
            },
          });
        });
      });
      return () => {
        cancelled = true;
      };
    },
    { scope: ref, dependencies: [reduced, children], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} id={id} tabIndex={tabIndex} className={cn(className)}>
      {children}
    </Tag>
  );
}
