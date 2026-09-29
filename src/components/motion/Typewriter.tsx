'use client';

import { useEffect, useState } from 'react';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';

/** Cycles example phrases with a typewriter effect — the search placeholder (spec 38). */
export function useTypewriter(phrases: readonly string[], active = true): string {
  const [text, setText] = useState(phrases[0] ?? '');
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    if (!active || reduced || !phrases.length) return;
    let i = 0;
    let n = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const phrase = phrases[i % phrases.length] as string;
      n += deleting ? -1 : 1;
      setText(phrase.slice(0, n));
      let delay = deleting ? 28 : 60 + Math.random() * 50;
      if (!deleting && n >= phrase.length) {
        deleting = true;
        delay = 1600;
      } else if (deleting && n <= 0) {
        deleting = false;
        i++;
        delay = 350;
      }
      timer = setTimeout(step, delay);
    };
    timer = setTimeout(step, 400);
    return () => clearTimeout(timer);
  }, [phrases, active, reduced]);

  return reduced ? (phrases[0] ?? '') : text;
}
