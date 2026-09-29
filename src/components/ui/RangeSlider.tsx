'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  /** Single value or [from, to]. */
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  format?: (v: number) => string;
  className?: string;
}

/** Range slider: thumb grows while dragging and shows a value bubble (spec 39). Supports dual thumbs. */
export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format = String,
  className,
}: RangeSliderProps) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const values = Array.isArray(value) ? value : [value];
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const lo = values.length === 2 ? pct(values[0] as number) : 0;
  const hi = pct(values[values.length - 1] as number);

  const set = (i: number, v: number) => {
    if (!Array.isArray(value)) return onChange(v);
    const next: [number, number] = [...value];
    next[i] = v;
    if (next[0] > next[1]) next[i === 0 ? 1 : 0] = v;
    onChange(next);
  };

  return (
    <fieldset className={cn('w-full', className)}>
      <legend className="text-small mb-3 flex w-full justify-between">
        <span className="font-semibold">{label}</span>
        <span className="text-dim tabular-nums">{values.map(format).join(' – ')}</span>
      </legend>
      <div className="relative h-11">
        <div className="rounded-pill bg-line absolute inset-x-0 top-1/2 h-1 -translate-y-1/2" />
        <div
          className="rounded-pill bg-violet absolute top-1/2 h-1 -translate-y-1/2"
          style={{ left: `${lo}%`, right: `${100 - hi}%` }}
        />
        {values.map((v, i) => (
          <div key={i} className="pointer-events-none absolute inset-0">
            <input
              id={`${id}-${i}`}
              type="range"
              min={min}
              max={max}
              step={step}
              value={v}
              aria-label={values.length === 2 ? `${label} ${i === 0 ? 'from' : 'to'}` : label}
              aria-valuetext={format(v)}
              onChange={(e) => set(i, Number(e.currentTarget.value))}
              onPointerDown={() => setActive(i)}
              onPointerUp={() => setActive(null)}
              onBlur={() => setActive(null)}
              onKeyDown={() => setActive(i)}
              data-cursor="drag"
              className="range-input pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
            />
            <span
              aria-hidden="true"
              className={cn(
                'bg-violet text-small text-void duration-fast ease-snap absolute -top-7 -translate-x-1/2 rounded-md px-2 py-0.5 font-bold tabular-nums transition-[opacity,translate]',
                active === i ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
              )}
              style={{ left: `${pct(v)}%` }}
            >
              {format(v)}
            </span>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
