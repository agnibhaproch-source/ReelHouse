'use client';

import { useRef } from 'react';
import { useScrollListener } from '@/hooks/useLenis';

/** 2px cyan progress line at the top; scaleX = page progress (spec 31). */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollListener((y) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  });
  return <div ref={ref} aria-hidden="true" className="fixed inset-x-0 top-0 z-(--z-toast) h-0.5 origin-left scale-x-0 bg-cyan" />;
}
