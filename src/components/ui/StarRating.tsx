'use client';

import { useState, type KeyboardEvent } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** 1–10 (half-star steps), or null when unrated. */
  value: number | null;
  onChange?: (value: number | null) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const px = { sm: 16, md: 24, lg: 32 };

/**
 * 5 stars with half steps. Hover previews the value before click; stars fill sequentially with
 * overshoot (specs 34, 39, 55). Keyboard: slider semantics with arrows/Home/End/Delete.
 */
export function StarRating({
  value,
  onChange,
  label = 'Your rating',
  size = 'md',
  readOnly,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const s = px[size];

  const onKey = (e: KeyboardEvent) => {
    if (!onChange) return;
    const v = value ?? 0;
    const map: Record<string, number | null> = {
      ArrowRight: Math.min(10, v + 1),
      ArrowUp: Math.min(10, v + 1),
      ArrowLeft: Math.max(1, v - 1),
      ArrowDown: Math.max(1, v - 1),
      Home: 1,
      End: 10,
      Delete: null,
      Backspace: null,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    onChange(map[e.key] ?? null);
  };

  const pick = (
    e: React.PointerEvent<HTMLSpanElement> | React.MouseEvent<HTMLSpanElement>,
    i: number,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();
    const half = e.clientX - r.left < r.width / 2;
    return i * 2 + (half ? 1 : 2);
  };

  return (
    <div className="inline-flex items-center gap-3">
      <div
        role={readOnly ? 'img' : 'slider'}
        tabIndex={readOnly ? undefined : 0}
        aria-label={readOnly ? `${label}: ${(shown / 2).toFixed(1)} of 5 stars` : label}
        aria-valuemin={readOnly ? undefined : 0}
        aria-valuemax={readOnly ? undefined : 10}
        aria-valuenow={readOnly ? undefined : (value ?? 0)}
        aria-valuetext={readOnly ? undefined : value ? `${value / 2} of 5 stars` : 'Not rated'}
        onKeyDown={onKey}
        onPointerLeave={() => setHover(null)}
        className="flex items-center gap-1 rounded-md"
        data-cursor={readOnly ? undefined : 'link'}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, (shown - i * 2) / 2));
          return (
            <span
              key={i}
              className="relative inline-block"
              style={{ width: s, height: s }}
              onPointerMove={readOnly ? undefined : (e) => setHover(pick(e, i))}
              onClick={
                readOnly || !onChange
                  ? undefined
                  : (e) => {
                      const v = pick(e, i);
                      onChange(v === value ? null : v);
                    }
              }
            >
              <Star
                className="text-line absolute inset-0"
                style={{ width: s, height: s }}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span
                className={cn('ease-snap absolute inset-0 overflow-hidden transition-[clip-path]')}
                style={{
                  clipPath: `inset(0 ${100 - fill * 100}% 0 0)`,
                  transitionDuration: 'var(--dur-base)',
                  transitionDelay: hover === null ? `${i * 60}ms` : '0ms',
                }}
              >
                <Star
                  className={cn(
                    'text-amber duration-base ease-snap transition-transform',
                    fill > 0 && hover === null && 'scale-110',
                  )}
                  style={{ width: s, height: s }}
                  fill="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
            </span>
          );
        })}
      </div>
      {!readOnly && (
        <span className="text-small text-dim min-w-12 tabular-nums" aria-hidden="true">
          {shown ? `${(shown / 2).toFixed(1)} / 5` : 'Rate'}
        </span>
      )}
    </div>
  );
}
