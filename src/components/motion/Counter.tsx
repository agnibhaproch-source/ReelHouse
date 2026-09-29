'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

interface CounterProps {
  /** Pre-formatted final value, e.g. "$1,204,000" or "2h 14m" — digits roll, other glyphs stay. */
  value: string;
  className?: string;
  label?: string;
}

/**
 * Odometer counter: each digit is a vertical 0–9 strip that rolls into place when it enters
 * the viewport (specs 32, 38). The real value is exposed to assistive tech.
 */
export function Counter({ value, className, label }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        setOn(true);
        io.disconnect();
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chars = [...value];
  return (
    <span ref={ref} className={cn('inline-flex tabular-nums', className)} aria-label={label ? `${label}: ${value}` : value} role="text">
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden="true" className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15]">
            <span
              className="flex flex-col transition-transform ease-reel"
              style={{
                transform: `translateY(${on || reduced ? -Number(ch) * 10 : 0}%)`,
                transitionDuration: reduced ? '0ms' : `calc(var(--dur-cinematic) + ${i * 60}ms)`,
              }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="h-[1.15em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}
