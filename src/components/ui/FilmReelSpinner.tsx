import { cn } from '@/lib/utils';

/** Mini film-reel spinner used for button loading states (spec 41). */
export function FilmReelSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('reel-spin size-4', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={a}
          cx={12 + 5.5 * Math.cos((a * Math.PI) / 180)}
          cy={12 + 5.5 * Math.sin((a * Math.PI) / 180)}
          r="2.1"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
