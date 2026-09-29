'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { isReducedNow } from './useMotionPrefs';

/** 3D rotateX/Y with perspective + glare vars `--mx/--my` (spec 33). */
export function useTilt(ref: RefObject<HTMLElement | null>, max = 8, enabled = true): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      if (isReducedNow()) return;
      rx((0.5 - py) * max * 2);
      ry((px - 0.5) * max * 2);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, max, enabled]);
}
