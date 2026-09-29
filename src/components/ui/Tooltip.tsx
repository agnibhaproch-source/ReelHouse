'use client';

import { cloneElement, isValidElement, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'bottom';
  children: ReactElement<Record<string, unknown>>;
}

/** Tooltip: 400ms delay in, instant out, slides 4px from its side (spec 39). */
export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 400);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };
  if (!isValidElement(children)) return children;
  return (
    <span
      className="relative inline-flex"
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute left-1/2 z-(--z-toast) w-max max-w-60 -translate-x-1/2 rounded-md border border-line bg-seat px-2.5 py-1.5 text-small text-reel shadow-lg',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          open ? 'visible translate-y-0 opacity-100 transition-[opacity,translate] duration-fast ease-reel' : 'invisible opacity-0 transition-none',
          !open && (side === 'top' ? 'translate-y-1' : '-translate-y-1'),
        )}
      >
        {content}
      </span>
    </span>
  );
}
