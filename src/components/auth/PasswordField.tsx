'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { passwordStrength } from '@/lib/auth-schemas';
import { Input } from '@/components/ui/Input';

const STAGES = [
  { label: '', color: 'bg-line' },
  { label: 'Weak', color: 'bg-danger' },
  { label: 'Fair', color: 'bg-amber' },
  { label: 'Good', color: 'bg-cyan' },
  { label: 'Strong', color: 'bg-success' },
] as const;

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & { label: string; error?: string; meter?: boolean; value?: string };

/** Password with a show/hide eye that blinks, and a strength meter that fills in colour stages (spec 50). */
export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField({ label, error, meter, value = '', ...rest }, ref) {
  const [show, setShow] = useState(false);
  const score = passwordStrength(value);
  const stage = STAGES[score];
  return (
    <div>
      <Input
        ref={ref}
        label={label}
        type={show ? 'text' : 'password'}
        error={error}
        value={value}
        {...rest}
        trailing={
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="grid size-9 place-items-center rounded-full text-dim hover:text-reel">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <g className="origin-center transition-transform duration-fast ease-snap" style={{ transform: show ? 'scaleY(1)' : 'scaleY(0.1)' }}>
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </g>
              {!show && <path d="M4 4l16 16" />}
            </svg>
          </button>
        }
      />
      {meter && (
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-pill bg-line">
                <span className={cn('block h-full origin-left transition-[scale,background-color] duration-base ease-reel', stage?.color)} style={{ scale: `${i <= score ? 1 : 0} 1` }} />
              </span>
            ))}
          </div>
          {score > 0 && <p className="mt-1 text-[0.75rem] text-dim">Password strength: {stage?.label}</p>}
        </div>
      )}
    </div>
  );
});
