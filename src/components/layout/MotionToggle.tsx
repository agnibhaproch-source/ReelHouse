'use client';

import { useUiStore } from '@/stores/ui';
import { useMediaQuery, QUERIES } from '@/hooks/useMediaQuery';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** In-app reduced-motion toggle (combined with the OS setting in useMotionPrefs). */
export function MotionToggle({ className }: { className?: string }) {
  const reduced = useUiStore((s) => s.reducedMotion);
  const osReduced = useMediaQuery(QUERIES.reducedMotion);
  const toggle = useUiStore((s) => s.toggle);
  const effective = reduced || osReduced;
  return (
    <button
      type="button"
      aria-pressed={effective}
      aria-label={effective ? 'Reduced motion on — turn motion back on' : 'Reduce motion'}
      title={osReduced ? 'Reduced motion is set by your system' : undefined}
      disabled={osReduced}
      data-cursor="link"
      onClick={() => {
        toggle('reducedMotion');
        track('motion_toggle', { reduced: !reduced });
      }}
      className={cn(
        'text-reel duration-fast hover:bg-reel/10 grid size-11 place-items-center rounded-full transition-colors disabled:opacity-50',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {effective ? (
          <path d="M4 12h16" />
        ) : (
          <path
            d="M3 12c2.5-5 5.5-5 8 0s5.5 5 8 0"
            className="animate-[motion-wave_2.4s_linear_infinite]"
            strokeDasharray="4 3"
          />
        )}
        <circle
          cx={effective ? 12 : 19}
          cy="12"
          r="2"
          fill="currentColor"
          className="duration-base ease-snap transition-[cx]"
        />
      </svg>
    </button>
  );
}
