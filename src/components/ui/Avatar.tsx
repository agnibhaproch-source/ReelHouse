import { cn } from '@/lib/utils';
import type { AvatarKey } from '@/lib/data/types';

interface AvatarProps {
  avatar: AvatarKey;
  name: string;
  size?: number;
  className?: string;
  /** Eyes blink occasionally (profile picker). */
  blink?: boolean;
  /** Decorative (name shown next to it). */
  decorative?: boolean;
}

const BODY: Record<AvatarKey, { bg: string; fg: string; shape: React.ReactNode }> = {
  reel: {
    bg: 'var(--marquee-violet)',
    fg: 'var(--bg-void)',
    shape: (
      <>
        <circle cx="50" cy="54" r="34" fill="var(--text-reel)" />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle
            key={a}
            cx={50 + 21 * Math.cos(((a - 90) * Math.PI) / 180)}
            cy={54 + 21 * Math.sin(((a - 90) * Math.PI) / 180)}
            r="6.5"
            fill="var(--marquee-violet)"
            opacity="0.35"
          />
        ))}
      </>
    ),
  },
  clapper: {
    bg: 'var(--marquee-cyan)',
    fg: 'var(--bg-void)',
    shape: (
      <>
        <rect x="18" y="38" width="64" height="44" rx="6" fill="var(--text-reel)" />
        <path d="M18 26 80 18 83 32 21 40Z" fill="var(--bg-void)" />
        <path d="M30 24 36 37M46 22 52 35M62 20 68 33" stroke="var(--text-reel)" strokeWidth="5" />
      </>
    ),
  },
  popcorn: {
    bg: 'var(--danger)',
    fg: 'var(--bg-void)',
    shape: (
      <>
        {[28, 42, 58, 72, 36, 64, 50].map((x, i) => (
          <circle key={i} cx={x} cy={i > 3 ? 20 : 30} r="11" fill="var(--projector-amber)" />
        ))}
        <path d="M22 36h56l-8 50H30Z" fill="var(--text-reel)" />
        <path d="M36 36l3 50M50 36v50M64 36l-3 50" stroke="var(--danger)" strokeWidth="5" />
      </>
    ),
  },
  ticket: {
    bg: 'var(--projector-amber)',
    fg: 'var(--bg-void)',
    shape: (
      <path d="M16 30h68v14a8 8 0 0 0 0 16v14H16V60a8 8 0 0 0 0-16Z" fill="var(--text-reel)" />
    ),
  },
  lamp: {
    bg: 'var(--success)',
    fg: 'var(--bg-void)',
    shape: (
      <>
        <path d="M30 20h40l10 34H20Z" fill="var(--text-reel)" />
        <rect x="46" y="54" width="8" height="22" fill="var(--text-reel)" />
        <rect x="32" y="76" width="36" height="8" rx="3" fill="var(--text-reel)" />
      </>
    ),
  },
  star: {
    bg: 'var(--bg-aisle)',
    fg: 'var(--bg-void)',
    shape: (
      <path
        d="M50 12 61 38l28 3-21 19 6 28-24-14-24 14 6-28-21-19 28-3Z"
        fill="var(--projector-amber)"
      />
    ),
  },
};

const EYES: Record<AvatarKey, number> = {
  reel: 50,
  clapper: 58,
  popcorn: 58,
  ticket: 50,
  lamp: 40,
  star: 50,
};

/** Illustrated original-character avatar; ring rotates around it on hover (spec 33). */
export function Avatar({ avatar, name, size = 40, className, blink, decorative }: AvatarProps) {
  const a = BODY[avatar] ?? BODY.reel;
  const eyeY = EYES[avatar] ?? 50;
  const delay = `${(name.length * 0.7) % 4}s`;
  return (
    <span
      className={cn('group/avatar relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : `${name}'s avatar`}
      aria-hidden={decorative || undefined}
    >
      <svg
        viewBox="0 0 100 100"
        className="duration-base absolute -inset-[8%] size-[116%] opacity-0 transition-opacity group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="var(--marquee-cyan)"
          strokeWidth="2"
          strokeDasharray="6 8"
          className="origin-center animate-[reel-spin_6s_linear_infinite]"
        />
      </svg>
      <svg
        viewBox="0 0 100 100"
        className="size-full overflow-hidden rounded-[22%]"
        aria-hidden="true"
      >
        <rect width="100" height="100" fill={a.bg} />
        {a.shape}
        <g
          className={cn(blink && 'avatar-eyes')}
          style={{ animationDelay: delay, transformOrigin: `50px ${eyeY}px` }}
        >
          <ellipse cx="40" cy={eyeY} rx="4.5" ry="6" fill={a.fg} />
          <ellipse cx="60" cy={eyeY} rx="4.5" ry="6" fill={a.fg} />
        </g>
        <path
          d={`M42 ${eyeY + 12} q8 7 16 0`}
          stroke={a.fg}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
