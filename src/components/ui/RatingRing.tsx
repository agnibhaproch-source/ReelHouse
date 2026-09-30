'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DUR_MS } from '@/lib/tokens';
import { isReducedNow } from '@/hooks/useMotionPrefs';

interface RatingRingProps {
  /** 0–10 score. */
  value: number;
  size?: number;
  label?: string;
  className?: string;
  color?: 'amber' | 'cyan' | 'violet';
}

const stroke = { amber: 'stroke-amber', cyan: 'stroke-cyan', violet: 'stroke-violet' };

/** Percentage ring that draws its stroke on enter; hover thickens stroke and bumps the number (spec 33). */
export function RatingRing({
  value,
  size = 44,
  label = 'Rating',
  className,
  color = 'amber',
}: RatingRingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  const pct = Math.round(Math.max(0, Math.min(10, value)) * 10);
  const [shown, setShown] = useState<number | null>(null);
  const counted = useRef(false);
  const r = 16;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      setVisible(true);
      // Count up in step with the stroke drawing in (once; reduced motion shows the value).
      if (counted.current || isReducedNow()) return;
      counted.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DUR_MS.cinematic);
        setShown(t < 1 ? Math.round(pct * (1 - (1 - t) ** 3)) : null);
        if (t < 1) requestAnimationFrame(tick);
      };
      setShown(0);
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [pct]);

  return (
    <span
      className={cn('group/ring relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${(value || 0).toFixed(1)} out of 10`}
    >
      <svg ref={ref} viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="var(--bg-void)"
          fillOpacity="0.6"
          stroke="var(--line)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className={cn(
            stroke[color],
            'duration-cinematic ease-reel transition-[stroke-dashoffset,stroke-width] group-hover/ring:[stroke-width:4.5]',
          )}
          strokeDasharray={c}
          strokeDashoffset={visible ? c * (1 - pct / 100) : c}
        />
      </svg>
      <span
        aria-hidden="true"
        className="duration-fast ease-snap relative text-[0.7rem] font-extrabold tabular-nums transition-transform group-hover/ring:scale-115"
        style={{ fontSize: size * 0.27 }}
      >
        {pct ? (shown ?? pct) : '—'}
        {pct ? <sup className="text-[0.55em]">%</sup> : null}
      </span>
    </span>
  );
}
