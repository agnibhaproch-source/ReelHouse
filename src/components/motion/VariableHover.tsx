'use client';

import { useEffect, useRef } from 'react';
import type { TextTag } from './tags';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';

interface VariableHoverProps {
  text: string;
  as?: TextTag;
  className?: string;
  radius?: number;
}

/**
 * Fraunces `wght`/`SOFT` interpolate per character by pointer proximity — a magnifier effect
 * (spec 38). One rAF loop, no per-move tweens.
 */
export function VariableHover({ text, as = 'span', className, radius = 220 }: VariableHoverProps) {
  // Rendered as any intrinsic text tag; typed as div for ref compatibility.
  const Tag = as as 'div';
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, finePointer } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !finePointer) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>('[data-c]'));
    let px = -9999;
    let py = -9999;
    let raf = 0;
    let rects: DOMRect[] = [];
    const measure = () => {
      rects = chars.map((c) => c.getBoundingClientRect());
    };
    const render = () => {
      raf = 0;
      chars.forEach((c, i) => {
        const r = rects[i];
        if (!r) return;
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const t = Math.max(0, 1 - d / radius);
        c.style.fontVariationSettings = `'wght' ${Math.round(300 + t * 600)}, 'SOFT' ${Math.round(t * 100)}, 'opsz' 144`;
      });
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) {
        measure();
        raf = requestAnimationFrame(render);
      }
    };
    const onLeave = () => {
      px = py = -9999;
      if (!raf) raf = requestAnimationFrame(render);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [reduced, finePointer, radius]);

  return (
    <Tag ref={ref} className={cn('font-display', className)}>
      <span className="sr-only">{text}</span>
      {[...text].map((ch, i) => (
        <span key={i} data-c aria-hidden="true" className="inline-block transition-[font-variation-settings] duration-fast" style={{ fontVariationSettings: "'wght' 300, 'SOFT' 0, 'opsz' 144" }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </Tag>
  );
}
