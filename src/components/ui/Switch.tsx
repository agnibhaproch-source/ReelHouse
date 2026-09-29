'use client';

import * as m from 'motion/react-m';
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
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
  hideLabel,
}: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className={cn(hideLabel && 'sr-only')}>
        <label htmlFor={id} className="block font-semibold">
          {label}
        </label>
        {description && (
          <span id={`${id}-d`} className="text-small text-dim block">
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
        className="rounded-pill relative inline-flex h-7 w-12 shrink-0 items-center p-1 disabled:opacity-40"
      >
        <span aria-hidden="true" className="rounded-pill bg-line absolute inset-0" />
        <span
          aria-hidden="true"
          className={cn(
            'rounded-pill bg-violet duration-base ease-reel absolute inset-0 transition-opacity',
            checked ? 'opacity-100' : 'opacity-0',
          )}
        />
        <m.span
          aria-hidden="true"
          layout
          transition={SPRING}
          className={cn(
            'bg-reel relative size-5 rounded-full shadow',
            checked ? 'ml-auto' : 'ml-0',
          )}
        />
      </button>
    </div>
  );
}
