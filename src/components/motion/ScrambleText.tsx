'use client';

import { useEffect, useRef, useState } from 'react';
import type { TextTag } from './tags';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';

const GLYPHS = '█▓▒░<>/\\|=+*#%&@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface ScrambleTextProps {
  text: string;
  as?: TextTag;
  className?: string;
  /** Replay every N ms (404 title). */
  loop?: number;
  duration?: number;
  id?: string;
  tabIndex?: number;
}

/** Characters scramble through random glyphs before settling (spec 38). */
export function ScrambleText({ text, as = 'span', className, loop, duration = 900, id, tabIndex }: ScrambleTextProps) {
  // Rendered as any intrinsic text tag; typed as div for ref compatibility.
  const Tag = as as 'div';
  const [out, setOut] = useState(text);
  const frame = useRef(0);
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    if (reduced) return;
    let start = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const settled = Math.floor(p * text.length);
      setOut(
        [...text]
          .map((ch, i) => (i < settled || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(''),
      );
      if (p < 1) frame.current = requestAnimationFrame(run);
      else if (loop) timer = setTimeout(() => {
        start = 0;
        frame.current = requestAnimationFrame(run);
      }, loop);
    };
    frame.current = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(frame.current);
      if (timer) clearTimeout(timer);
    };
  }, [text, loop, duration, reduced]);

  return (
    <Tag className={className} aria-label={text} id={id} tabIndex={tabIndex}>
      <span aria-hidden="true">{reduced ? text : out}</span>
    </Tag>
  );
}
