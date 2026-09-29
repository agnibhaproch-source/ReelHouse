'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { useCursorStore } from '@/stores/cursor';
import { isReducedNow } from './useMotionPrefs';

const PAD = 40;

/**
 * Element follows the pointer within its bounds + 40px; `[data-magnetic-inner]` moves 1.5× for
 * depth; springs home on leave. Also snaps the cursor ring around the element (spec 33).
 */
export function useMagnetic(ref: RefObject<HTMLElement | null>, strength = 0.35): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 0.5, ease: 'power3.out' }) : null;
    const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 0.5, ease: 'power3.out' }) : null;
    let active = false;

    const onMove = (e: PointerEvent) => {
      if (isReducedNow()) return;
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX > r.left - PAD && e.clientX < r.right + PAD && e.clientY > r.top - PAD && e.clientY < r.bottom + PAD;
      if (!inside) {
        if (active) leave();
        return;
      }
      active = true;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      ixTo?.(dx * strength * 0.5);
      iyTo?.(dy * strength * 0.5);
      const radius = Number.parseFloat(getComputedStyle(el).borderRadius) || 8;
      useCursorStore.getState().setMagnet({ x: r.left, y: r.top, width: r.width, height: r.height, radius });
    };
    const leave = () => {
      active = false;
      gsap.to([el, inner].filter(Boolean), { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      useCursorStore.getState().setMagnet(null);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (active) useCursorStore.getState().setMagnet(null);
      gsap.killTweensOf([el, inner].filter(Boolean));
    };
  }, [ref, strength]);
}
