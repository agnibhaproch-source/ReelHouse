'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  variant?: 'text' | 'search';
  icon?: ReactNode;
  trailing?: ReactNode;
  shake?: boolean;
}

/**
 * Floating-label input (spec 39): underline draws from the left on focus, label floats with a
 * spring; states empty, filled, focus, error, disabled (spec 14).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    variant = 'text',
    icon,
    trailing,
    className,
    id,
    shake,
    placeholder,
    ...rest
  },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy =
    [error && `${inputId}-err`, hint && `${inputId}-hint`].filter(Boolean).join(' ') || undefined;
  const isSearch = variant === 'search';

  return (
    <div className={cn('group/input', className)}>
      <div
        className={cn(
          'bg-aisle duration-fast relative flex items-center gap-3 px-4 transition-colors',
          isSearch ? 'rounded-pill py-3' : 'rounded-t-[10px] pt-5 pb-2',
          rest.disabled && 'opacity-50',
          shake && 'shake',
        )}
      >
        {icon && <span className="text-dim [&_svg]:size-5">{icon}</span>}
        <div className="relative min-w-0 flex-1">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            data-cursor="text"
            placeholder={isSearch ? (placeholder ?? label) : ' '}
            className={cn(
              'peer text-reel w-full bg-transparent outline-none focus-visible:outline-none disabled:cursor-not-allowed',
              isSearch ? 'placeholder:text-dim' : 'placeholder:text-transparent',
            )}
            {...rest}
          />
          {isSearch ? (
            <label htmlFor={inputId} className="sr-only">
              {label}
            </label>
          ) : (
            <label
              htmlFor={inputId}
              className={cn(
                'text-dim duration-base ease-snap pointer-events-none absolute top-1/2 left-0 origin-left -translate-y-1/2 transition-[translate,scale,color]',
                'peer-focus:text-violet peer-focus:-translate-y-[165%] peer-focus:scale-75',
                'peer-[:not(:placeholder-shown)]:-translate-y-[165%] peer-[:not(:placeholder-shown)]:scale-75',
                error && 'text-danger peer-focus:text-danger',
              )}
            >
              {label}
            </label>
          )}
        </div>
        {trailing}
        {!isSearch && (
          <>
            <span aria-hidden="true" className="bg-line absolute inset-x-0 bottom-0 h-px" />
            <span
              aria-hidden="true"
              className={cn(
                'bg-violet duration-base ease-reel absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform group-focus-within/input:scale-x-100',
                error && 'bg-danger scale-x-100',
              )}
            />
          </>
        )}
      </div>
      {error && (
        <p id={`${inputId}-err`} role="alert" className="text-small text-danger mt-2">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-small text-dim mt-2">
          {hint}
        </p>
      )}
    </div>
  );
});
