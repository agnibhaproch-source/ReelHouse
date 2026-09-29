'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePress } from '@/hooks/usePress';

interface PillProps {
  children: ReactNode;
  /** Filter chips toggle; genre chips link. */
  selected?: boolean;
  onToggle?: (next: boolean) => void;
  href?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const cls =
  'group/pill relative isolate inline-flex items-center gap-1.5 overflow-hidden rounded-pill border border-line font-semibold transition-colors duration-base ease-reel';

/** Genre chip (link) or filter chip (toggle). Hover: fill grows from centre, text inverts (spec 33). */
export function Pill({ children, selected = false, onToggle, href, className, size = 'md' }: PillProps) {
  const press = usePress<HTMLElement>({ accent: 'var(--marquee-violet)', scale: 0.95 });
  const sizing = size === 'sm' ? 'h-8 px-3 text-small' : 'h-10 px-4 text-small';
  const inner = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 -z-10 m-auto rounded-pill bg-reel transition-transform duration-base ease-reel',
          selected ? 'scale-100 bg-violet' : 'scale-x-0 group-hover/pill:scale-x-100 group-focus-visible/pill:scale-x-100',
        )}
      />
      {children}
    </>
  );
  const state = selected
    ? 'border-violet text-void'
    : 'text-reel hover:text-void focus-visible:text-void';

  if (href) {
    return (
      <Link href={href} className={cn(cls, sizing, state, className)} data-cursor="link" {...press}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle?.(!selected)}
      className={cn(cls, sizing, state, className)}
      data-cursor="link"
      {...press}
    >
      {inner}
    </button>
  );
}
