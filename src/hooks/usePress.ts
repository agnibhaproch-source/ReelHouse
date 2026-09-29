'use client';

import { useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { gsap } from '@/lib/gsap';
import { DUR } from '@/lib/tokens';
import { play } from '@/lib/sound';
import { isReducedNow } from './useMotionPrefs';

interface PressOptions {
  /** Ripple colour (CSS colour); defaults to currentColor. */
  accent?: string;
  scale?: number;
  sound?: boolean;
  ripple?: boolean;
}

/**
 * Press feedback (spec 34): scale 0.96 with `snap` on pointerdown, spring back on release,
 * plus a projector ripple from the click point. Returns pointer handlers to spread.
 */
export function usePress<T extends HTMLElement>({
  accent,
  scale = 0.96,
  sound = true,
  ripple = true,
}: PressOptions = {}) {
  const onPointerDown = useCallback(
    (e: ReactPointerEvent<T>) => {
      const el = e.currentTarget;
      if (
        e.button !== 0 ||
        el.hasAttribute('disabled') ||
        el.getAttribute('aria-disabled') === 'true'
      )
        return;
      if (sound) void play('press');
      if (isReducedNow()) return;
      gsap.to(el, { scale, duration: DUR.instant, ease: 'snap', overwrite: 'auto' });
      if (!ripple) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const size = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      Object.assign(dot.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        background: accent ?? 'currentColor',
        opacity: '0.25',
        borderRadius: 'inherit',
        clipPath: `circle(0px at ${x}px ${y}px)`,
      });
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.overflow ||= 'hidden';
      el.appendChild(dot);
      gsap.to(dot, {
        clipPath: `circle(${size}px at ${x}px ${y}px)`,
        duration: 0.5,
        ease: 'reel',
      });
      gsap.to(dot, { opacity: 0, duration: 0.35, delay: 0.3, onComplete: () => dot.remove() });
    },
    [accent, scale, sound, ripple],
  );

  const release = useCallback((e: ReactPointerEvent<T>) => {
    if (isReducedNow()) return;
    gsap.to(e.currentTarget, {
      scale: 1,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
      overwrite: 'auto',
    });
  }, []);

  return { onPointerDown, onPointerUp: release, onPointerLeave: release, onPointerCancel: release };
}
