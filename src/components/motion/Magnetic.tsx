'use client';

import { useRef, type ReactNode } from 'react';
import { useMagnetic } from '@/hooks/useMagnetic';

/** Wrapper that makes its child magnetic (spec 33). Put `data-magnetic-inner` on the label for depth. */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useMagnetic(ref, strength);
  return (
    <div ref={ref} className={className ?? 'inline-block'} data-cursor="magnetic">
      {children}
    </div>
  );
}
