'use client';

import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/tokens';
import { play } from '@/lib/sound';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}

/** Toggle: knob slides with a spring, track colour crossfades (spec 34). */
export function Switch({ label, description, checked, onChange, disabled, className, hideLabel }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className={cn(hideLabel && 'sr-only')}>
        <label htmlFor={id} className="block font-semibold">
          {label}
        </label>
        {description && (
          <span id={`${id}-d`} className="block text-small text-dim">
            {description}
          </span>
        )}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        data-cursor="link"
        onClick={() => {
          void play('toggle');
          onChange(!checked);
        }}
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill p-1 disabled:opacity-40"
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-pill bg-line" />
        <span
          aria-hidden="true"
          className={cn('absolute inset-0 rounded-pill bg-violet transition-opacity duration-base ease-reel', checked ? 'opacity-100' : 'opacity-0')}
        />
        <motion.span
          aria-hidden="true"
          layout
          transition={SPRING}
          className={cn('relative size-5 rounded-full bg-reel shadow', checked ? 'ml-auto' : 'ml-0')}
        />
      </button>
    </div>
  );
}
