'use client';

import { useState } from 'react';
import { DUR_MS, EASES, cssEase, type EaseName } from '@/lib/tokens';

/** Eases visualised as dots racing across a track; durations compared side by side (spec 12). */
export function EaseDemo() {
  const [run, setRun] = useState(false);
  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={() => setRun((r) => !r)}
        className="rounded-pill border-line text-small hover:border-violet min-h-11 self-start border px-4 font-semibold"
      >
        {run ? 'Reset' : 'Play eases'}
      </button>
      <ul className="flex flex-col gap-4">
        {(Object.keys(EASES) as EaseName[]).map((name) => (
          <li key={name} className="grid grid-cols-[140px_1fr] items-center gap-4">
            <code className="text-small text-dim">ease-{name}</code>
            <div className="rounded-pill bg-seat relative h-8">
              <span
                className="bg-violet absolute top-1/2 left-1 size-6 -translate-y-1/2 rounded-full"
                style={{
                  transform: `translate(${run ? 'calc(min(60vw, 700px) - 32px)' : '0'}, -50%)`,
                  transition: `transform ${DUR_MS.cinematic}ms ${cssEase(name)}`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-4">
        {(Object.entries(DUR_MS) as [string, number][]).map(([name, ms]) => (
          <li key={name} className="grid grid-cols-[140px_1fr] items-center gap-4">
            <code className="text-small text-dim">
              --dur-{name} <span className="text-reel/60">{ms}ms</span>
            </code>
            <div className="rounded-pill bg-seat relative h-8">
              <span
                className="bg-cyan absolute top-1/2 left-1 size-6 -translate-y-1/2 rounded-full"
                style={{
                  transform: `translate(${run ? 'calc(min(60vw, 700px) - 32px)' : '0'}, -50%)`,
                  transition: `transform ${ms}ms ${cssEase('reel')}`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
