'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** Checkbox whose tick draws its path (spec 39). */
export function Checkbox({ label, checked, onChange, disabled, className }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn('group/cb inline-flex min-h-11 items-center gap-3 select-none', disabled && 'opacity-40', className)} data-cursor="link">
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span
        aria-hidden="true"
        className="grid size-5 place-items-center rounded-[5px] border border-line bg-aisle transition-colors duration-fast ease-reel peer-checked:border-violet peer-checked:bg-violet peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-violet group-hover/cb:border-dim"
      >
        <svg viewBox="0 0 16 16" className="size-3.5 text-void">
          <path
            d="M3 8.5 6.5 12 13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={checked ? 0 : 1}
            className="transition-[stroke-dashoffset] duration-base ease-reel"
          />
        </svg>
      </span>
      <span className="text-small">{label}</span>
    </label>
  );
}
