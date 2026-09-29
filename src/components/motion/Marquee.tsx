'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { useLenis } from '@/hooks/useLenis';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: ReactNode;
  /** px per second at rest. */
  speed?: number;
  direction?: 1 | -1;
  /** Scroll velocity boosts speed and can flip direction (spec 32). */
  velocityReactive?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  label?: string;
}

/** Infinite, velocity-reactive marquee; pauses on hover (spec 38). */
export function Marquee({
  children,
  speed = 40,
  direction = 1,
  velocityReactive = true,
  pauseOnHover = true,
  className,
  label,
}: MarqueeProps) {
  const track = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const { reduced } = useMotionPrefs();
  const { velocity } = useLenis();

  useEffect(() => {
    const el = track.current;
    if (!el || reduced) return;
    let x = 0;
    let last = performance.now();
    let raf = 0;
    let dir: number = direction;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const half = el.scrollWidth / 2;
      let v = hovered.current ? 0 : speed;
      if (velocityReactive) {
        const sv =
          velocity() ||
          Number(getComputedStyle(document.documentElement).getPropertyValue('--scroll-velocity')) *
            40;
        if (Math.abs(sv) > 0.5) dir = Math.sign(sv) * direction;
        v += Math.min(600, Math.abs(sv) * 25);
      }
      x -= v * dt * dir;
      if (half > 0) x = (((x % half) + half) % half) - half;
      el.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, speed, direction, velocityReactive, velocity]);

  return (
    <div
      className={cn('overflow-hidden', className)}
      onPointerEnter={() => pauseOnHover && (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
      aria-label={label}
      role={label ? 'marquee' : undefined}
    >
      <div ref={track} className="flex w-max will-change-transform">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </div>
  );
}
